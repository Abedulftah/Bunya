/**
 * Parser + executor for full Java-style function definitions.
 *
 * Supported subset (covers ~90% of Bagrut algorithm questions):
 *   - Function signature: [public] [static] <ReturnType> name(<params>) { … }
 *   - Local structure declarations: Stack<int> temp = new Stack<int>();
 *   - Local scalar declarations: int count = 0;  or  int x;
 *   - Assignments: count = count + 1;  count++;  count += 2;
 *   - While loops (capped at MAX_ITER iterations)
 *   - If / else / else if — K&R (`} else {`), Allman (`else` on its own line),
 *     and braceless single-statement bodies
 *   - Method-call statements: temp.insert(x);
 *   - Return statements: return count;
 *   - Conditions: !s.isEmpty(), x > 0, count == 3, &&, ||, parentheses
 *
 * The parser is STRICT: any line that doesn't match a supported statement is a
 * parse error with its line number — nothing is skipped silently. A validation
 * pass additionally rejects unknown method names, wrong argument counts, and
 * uses of undeclared variables before anything runs.
 *
 * The executor re-uses the existing generateSteps() from the step engine so
 * canvas animations are identical to toolbar-driven animations.
 */

import type { Frame, Operation, Step, TabKind, Value, VisualElement } from '../types';
import { frameElements } from '../types';
import { generateSteps } from './steps';
import { adjacentArrows } from './steps/linkedList';
import { makeEl } from './ids';
import { findMethod, matchesType, normalizeDigits, valueKindOf } from './interpreter';
import { MAX_FN_ITER } from '../constants';
import { S } from '../i18n/strings';

// ─── Public types ──────────────────────────────────────────────────────────────

export interface FuncParseError {
  line: number; // 0-based
  message: string;
}

export type FuncParseResult =
  | { ok: true; fn: FunctionDef }
  | { ok: false; error: FuncParseError };

export interface FunctionDef {
  name: string;
  returnType: string; // 'void' | 'int' | 'double' | 'boolean' | 'String' | …
  params: ParamDef[];
  body: Statement[];
  /** 0-based source line where the body starts (after the opening brace). */
  bodyStartLine: number;
}

/**
 * Every structure kind is also a TabKind, so a slot's kind can be passed
 * straight to findMethod()/generateSteps without translation. `sort` is the
 * kind used for `int[]` arrays.
 */
export type StructKind = 'stack' | 'queue' | 'list' | 'sort';

export type ParamDef =
  | { kind: 'struct'; structType: StructKind; typeParam: string; name: string; isArray?: boolean }
  | { kind: 'scalar'; varType: string; name: string };

function structKindOf(s: string): StructKind {
  const t = s.toLowerCase();
  if (t === 'queue') return 'queue';
  if (t === 'linkedlist' || t === 'list') return 'list';
  return 'stack';
}

/** Human-readable Java type label for a structure parameter (for the args UI). */
export function structTypeLabel(p: Extract<ParamDef, { kind: 'struct' }>): string {
  if (p.isArray) return `${p.typeParam}[]`;
  const name = p.structType === 'list' ? 'LinkedList'
    : p.structType[0].toUpperCase() + p.structType.slice(1);
  return `${name}<${p.typeParam}>`;
}

/** Parse a comma-separated parameter list into structure/scalar param defs. */
function parseParamList(paramStr: string): { ok: true; params: ParamDef[] } | { ok: false; bad: string } {
  const params: ParamDef[] = [];
  const s = paramStr.trim();
  if (s) {
    for (const part of s.split(',')) {
      const p = part.trim();
      const sm = p.match(/^(Stack|Queue|LinkedList)\s*<\s*(\w+)\s*>\s+(\w+)$/i);
      if (sm) {
        params.push({ kind: 'struct', structType: structKindOf(sm[1]), typeParam: sm[2], name: sm[3] });
        continue;
      }
      const am = p.match(/^(int|Integer)\s*\[\s*\]\s+(\w+)$/);
      if (am) {
        params.push({ kind: 'struct', structType: 'sort', typeParam: 'int', name: am[2], isArray: true });
        continue;
      }
      const cm = p.match(/^(int|double|float|long|boolean|String|char)\s+(\w+)$/);
      if (cm) {
        params.push({ kind: 'scalar', varType: cm[1], name: cm[2] });
        continue;
      }
      return { ok: false, bad: p };
    }
  }
  return { ok: true, params };
}

/** Build the correct Frame for a structure kind from its elements. */
function frameOf(type: StructKind, els: VisualElement[]): Frame {
  switch (type) {
    case 'stack': return { kind: 'stack', items: els };
    case 'queue': return { kind: 'queue', items: els };
    case 'list': return { kind: 'list', nodes: els, arrows: adjacentArrows(els.length) };
    case 'sort': return { kind: 'sort', bars: els };
  }
}

/**
 * Which parameter the on-screen canvas binds to: the first structure parameter
 * whose type matches the active tab, else the first structure parameter, else -1.
 */
function canvasParamIndex(params: ParamDef[], tab: TabKind): number {
  let firstStruct = -1;
  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    if (p.kind !== 'struct') continue;
    if (firstStruct === -1) firstStruct = i;
    if (p.structType === tab) return i;
  }
  return firstStruct;
}

// ─── AST ──────────────────────────────────────────────────────────────────────

type Statement =
  | StructDeclStmt
  | ArrayDeclStmt
  | ScalarDeclStmt
  | AssignStmt
  | MethodCallStmt
  | SortCallStmt
  | WhileStmt
  | IfStmt
  | ReturnStmt;

interface StructDeclStmt {
  kind: 'structDecl';
  structType: string;
  typeParam: string;
  varName: string;
  sourceLine: number;
}
interface ArrayDeclStmt {
  kind: 'arrayDecl';
  elemType: string;
  varName: string;
  values: Value[];
  sourceLine: number;
}
interface SortCallStmt {
  kind: 'sortCall';
  target: string; // array variable, or '' to mean the canvas-bound array
  sourceLine: number;
}
interface ScalarDeclStmt {
  kind: 'scalarDecl';
  varType: string;
  varName: string;
  init: Expr | null; // null = declared without initializer (int x;)
  sourceLine: number;
}
interface AssignStmt {
  kind: 'assign';
  varName: string;
  expr: Expr;
  sourceLine: number;
}
interface MethodCallStmt {
  kind: 'methodCall';
  target: string;
  method: string;
  args: Expr[];
  sourceLine: number;
}
interface WhileStmt {
  kind: 'while';
  cond: Expr;
  body: Statement[];
  sourceLine: number;
}
interface IfStmt {
  kind: 'if';
  cond: Expr;
  then: Statement[];
  else_?: Statement[];
  sourceLine: number;
}
interface ReturnStmt {
  kind: 'return';
  expr?: Expr;
  sourceLine: number;
}

type Expr =
  | { kind: 'literal'; value: Value }
  | { kind: 'bool'; value: boolean }
  | { kind: 'var'; name: string }
  | { kind: 'binop'; op: string; left: Expr; right: Expr }
  | { kind: 'unary'; op: '!'; expr: Expr }
  | { kind: 'call'; target: string; method: string; args: Expr[] };

/** Internal parse abort carrying the offending 0-based line. */
class ParseFailure {
  readonly line: number;
  readonly message: string;
  constructor(line: number, message: string) {
    this.line = line;
    this.message = message;
  }
}

// ─── Regex helpers ────────────────────────────────────────────────────────────

/** Strip a trailing // line comment, but not a // that sits inside a string literal. */
function stripComment(line: string): string {
  let inStr = false;
  let quote = '';
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    if (inStr) {
      if (c === quote) inStr = false;
    } else if (c === '"' || c === "'") {
      inStr = true;
      quote = c;
    } else if (c === '/' && line[i + 1] === '/') {
      return line.slice(0, i);
    }
  }
  return line;
}

/** Strip // comments, normalize Arabic-Indic digits, and trim. */
function clean(line: string): string {
  return normalizeDigits(stripComment(line)).trim();
}

interface Tok { text: string; line: number; }

/**
 * Split source into statement/brace tokens, each tagged with its original
 * 0-based line. Braces and top-level `;` break tokens, so inline blocks like
 * `while (c) { x; }` and `} else {` parse correctly while error line numbers
 * stay accurate. String literals and parentheses are respected.
 */
function tokenize(rawLines: string[]): Tok[] {
  const toks: Tok[] = [];
  rawLines.forEach((raw, line) => {
    const cleaned = clean(raw);
    if (!cleaned) return;
    let depth = 0;
    let inStr = false;
    let quote = '';
    let cur = '';
    const flush = () => {
      const t = cur.trim();
      if (t && t !== ';') toks.push({ text: t, line });
      cur = '';
    };
    for (let i = 0; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (inStr) { cur += c; if (c === quote) inStr = false; continue; }
      if (c === '"' || c === "'") { inStr = true; quote = c; cur += c; continue; }
      if (c === '(' || c === '[') { depth++; cur += c; continue; }
      if (c === ')' || c === ']') { depth--; cur += c; continue; }
      if (depth === 0 && (c === '{' || c === '}')) { flush(); toks.push({ text: c, line }); continue; }
      if (depth === 0 && c === ';') { cur += c; flush(); continue; }
      cur += c;
    }
    flush();
  });
  return toks;
}

// `Stack<int> temp = new Stack<int>();` — both sides must agree
const STRUCT_DECL_RE =
  /^(Stack|Queue|LinkedList)\s*<\s*(\w+)\s*>\s+(\w+)\s*=\s*new\s+(Stack|Queue|LinkedList)\s*<\s*(\w+)\s*>\s*\(\s*\)\s*;?$/i;

// `int[] a = {5, 2, 8};`
const ARRAY_DECL_RE = /^(int|Integer)\s*\[\s*\]\s+(\w+)\s*=\s*\{([^}]*)\}\s*;?$/;

// `bubbleSort(arr);` or `sort();` — a free function, not a method on a receiver
const SORT_CALL_RE = /^(?:bubbleSort|sort)\s*\(\s*(\w*)\s*\)\s*;?$/i;

// `int count = 0;`  or  `int x = s.remove();`  – init may be anything
const SCALAR_DECL_RE = /^(int|double|float|long|boolean|String|char)\s+(\w+)\s*=\s*(.+?)\s*;?$/;

// `int x;` — declaration without initializer
const SCALAR_DECL_NOINIT_RE = /^(int|double|float|long|boolean|String|char)\s+(\w+)\s*;?$/;

// `count = count + 1;`
const ASSIGN_RE = /^(\w+)\s*=\s*(.+?)\s*;?$/;

// `count++;` / `count--;`
const INC_DEC_RE = /^(\w+)\s*(\+\+|--)\s*;?$/;

// `count += 2;` etc.
const COMPOUND_ASSIGN_RE = /^(\w+)\s*([+\-*/%])=\s*(.+?)\s*;?$/;

// `s.insert(x);`  or  `s.insert(temp.remove());`  (one level of nested parens)
const METHOD_CALL_STMT_RE = /^(\w+)\.(\w+)\s*\(((?:[^()]*|\([^()]*\))*)\)\s*;?$/;

// `while (cond)` with optional trailing `{`
const WHILE_RE = /^while\s*\((.+)\)\s*(\{)?$/;

// `if (cond)` with optional trailing `{`
const IF_RE = /^if\s*\((.+)\)\s*(\{)?$/;

// `else …` on its own line — tokenization splits `}`/`{` off, so `} else {`
// arrives as the tokens `}`, `else`, `{`. The capture handles inline `else if`.
const ELSE_RE = /^else\b(.*)$/;

// `return expr;`  or  `return;`
const RETURN_RE = /^return(?:\s+(.+?))?\s*;?$/;

// `[public] [static] ReturnType name(params) {`
const FUNC_SIG_RE =
  /^(?:(?:public|private)\s+)?(?:static\s+)?([\w<>[\]]+)\s+(\w+)\s*\(([^)]*)\)\s*\{?$/;

// `[public] [final|abstract] class Name` — the LeetCode-style wrapper
const CLASS_RE = /^(?:(?:public|final|abstract)\s+)*class\s+(\w+)$/;

// ─── Expression parser ────────────────────────────────────────────────────────

/** True when s is wrapped in one MATCHING pair of outer parens: `(a && b)` yes, `(a) && (b)` no. */
function isWrapped(s: string): boolean {
  if (!s.startsWith('(') || !s.endsWith(')')) return false;
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0 && i < s.length - 1) return false; // closed before the end
    }
  }
  return depth === 0;
}

function parseExpr(raw: string, line: number): Expr {
  const s = raw.trim();
  if (!s) throw new ParseFailure(line, S.fn.badExpr(raw));

  // boolean literals
  if (s === 'true') return { kind: 'bool', value: true };
  if (s === 'false') return { kind: 'bool', value: false };

  // strip one matching pair of outer parens
  if (isWrapped(s)) return parseExpr(s.slice(1, -1), line);

  // binary operators — lowest precedence first, split BEFORE unary `!` so that
  // `!a && b` parses as `(!a) && b` like Java, not `!(a && b)`.
  const binOps = ['||', '&&', '==', '!=', '<=', '>=', '<', '>', '+', '-', '*', '/', '%'];
  for (const op of binOps) {
    const idx = findBinOp(s, op);
    if (idx !== -1) {
      return {
        kind: 'binop',
        op,
        left: parseExpr(s.slice(0, idx), line),
        right: parseExpr(s.slice(idx + op.length), line),
      };
    }
  }

  // unary !
  if (s.startsWith('!')) {
    return { kind: 'unary', op: '!', expr: parseExpr(s.slice(1), line) };
  }

  // unary minus: -x  →  0 - x
  if (s.startsWith('-')) {
    return { kind: 'binop', op: '-', left: { kind: 'literal', value: 0 }, right: parseExpr(s.slice(1), line) };
  }

  // method call: obj.method(args)  — allow one level of nested parens in args
  const mc = s.match(/^(\w+)\.(\w+)\s*\(((?:[^()]*|\([^()]*\))*)\)$/);
  if (mc) {
    const rawArgs = mc[3].trim();
    const args = rawArgs ? splitArgs(rawArgs).map(a => parseExpr(a, line)) : [];
    return { kind: 'call', target: mc[1], method: mc[2], args };
  }

  // string literal
  const sq = s.match(/^"([^"]*)"$|^'([^']*)'$/);
  if (sq) return { kind: 'literal', value: sq[1] ?? sq[2] };

  // number literal
  if (/^-?\d+(\.\d+)?$/.test(s)) return { kind: 'literal', value: Number(s) };

  // variable
  if (/^\w+$/.test(s)) return { kind: 'var', name: s };

  throw new ParseFailure(line, S.fn.badExpr(s));
}

/** Find the rightmost binary occurrence of `op` not inside parentheses. */
function findBinOp(s: string, op: string): number {
  let depth = 0;
  // Walk every char so multi-char ops still see trailing parens for the depth count.
  // i >= 1: an operator at position 0 has no left operand (it's a sign/unary).
  for (let i = s.length - 1; i >= 1; i--) {
    const ch = s[i];
    if (ch === ')') depth++;
    else if (ch === '(') depth--;
    if (depth === 0 && s.startsWith(op, i)) {
      // Make sure it's not >=, <=, != when we're looking for > < =
      if (op === '>' && (s[i - 1] === '!' || s[i - 1] === '<' || s[i - 1] === '=')) continue;
      if (op === '<' && s[i + 1] === '=') continue;
      if (op === '>' && s[i + 1] === '=') continue;
      // `+`/`-` preceded by another operator is a sign, not a binary op (x * -2)
      if (op === '+' || op === '-') {
        let j = i - 1;
        while (j >= 0 && s[j] === ' ') j--;
        if (j < 0 || '+-*/%<>=&|(!'.includes(s[j])) continue;
      }
      return i;
    }
  }
  return -1;
}

function splitArgs(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

// ─── Block parser ─────────────────────────────────────────────────────────────

interface ParseCtx {
  /** Statement/brace tokens, each tagged with its original 0-based line. */
  toks: Tok[];
  /** Current position (index into `toks`). */
  pos: number;
}

/** Parse statements until a `}` token (left for the caller) or EOF. */
function parseBlock(ctx: ParseCtx): Statement[] {
  const stmts: Statement[] = [];
  while (ctx.pos < ctx.toks.length && ctx.toks[ctx.pos].text !== '}') {
    stmts.push(parseStatement(ctx));
  }
  return stmts;
}

/** Consume exactly a `}` closer token, or fail. */
function expectClose(ctx: ParseCtx): void {
  const tok = ctx.toks[ctx.pos];
  if (!tok) {
    const lastLine = ctx.toks.length ? ctx.toks[ctx.toks.length - 1].line : 0;
    throw new ParseFailure(lastLine, S.fn.missingBrace);
  }
  if (tok.text === '}') { ctx.pos++; return; }
  throw new ParseFailure(tok.line, ELSE_RE.test(tok.text) ? S.fn.strayElse : S.fn.missingBrace);
}

/**
 * Parse a construct body: a `{ … }` block (the `{` is its own token) or a
 * single braceless statement, like Java.
 */
function parseBody(ctx: ParseCtx, headLine: number): Statement[] {
  if (ctx.toks[ctx.pos]?.text === '{') {
    ctx.pos++;
    const body = parseBlock(ctx);
    expectClose(ctx);
    return body;
  }
  if (ctx.pos >= ctx.toks.length) throw new ParseFailure(headLine, S.fn.emptyBody);
  return [parseStatement(ctx)];
}

/** Parse an else clause given the text after the `else` keyword. */
function parseElseBody(rest: string, elseLine: number, ctx: ParseCtx): Statement[] {
  const r = rest.trim();
  if (r === '') return parseBody(ctx, elseLine);
  // inline statement: `else if (…)`  /  `else x = 1;`
  return [parseStatementText(r, elseLine, ctx)];
}

function parseStatement(ctx: ParseCtx): Statement {
  const tok = ctx.toks[ctx.pos];
  ctx.pos++;
  return parseStatementText(tok.text, tok.line, ctx);
}

function parseStatementText(raw: string, li: number, ctx: ParseCtx): Statement {
  // while
  const wm = raw.match(WHILE_RE);
  if (wm) {
    const cond = parseExpr(wm[1], li);
    const body = parseBody(ctx, li);
    return { kind: 'while', cond, body, sourceLine: li };
  }

  // if / else
  const im = raw.match(IF_RE);
  if (im) {
    const cond = parseExpr(im[1], li);
    let thenBlock: Statement[];
    let elseBlock: Statement[] | undefined;

    if (peekOpenBrace(ctx)) {
      ctx.pos++; // consume the `{` token
      thenBlock = parseBlock(ctx);
      const closeTok = ctx.toks[ctx.pos];
      if (!closeTok) throw new ParseFailure(li, S.fn.missingBrace);
      if (closeTok.text !== '}') {
        throw new ParseFailure(closeTok.line, ELSE_RE.test(closeTok.text) ? S.fn.strayElse : S.fn.missingBrace);
      }
      ctx.pos++; // consume `}`
      elseBlock = tryDetachedElse(ctx);
    } else {
      // braceless single-statement then
      if (ctx.pos >= ctx.toks.length) throw new ParseFailure(li, S.fn.emptyBody);
      thenBlock = [parseStatement(ctx)];
      elseBlock = tryDetachedElse(ctx);
    }
    return { kind: 'if', cond, then: thenBlock, else_: elseBlock, sourceLine: li };
  }

  // a lone `else` that no if-handler consumed
  if (ELSE_RE.test(raw)) throw new ParseFailure(li, S.fn.strayElse);

  // return
  const rm = raw.match(RETURN_RE);
  if (rm) {
    return { kind: 'return', expr: rm[1] ? parseExpr(rm[1], li) : undefined, sourceLine: li };
  }

  // struct decl — both sides of the `=` must declare the same type
  const sd = raw.match(STRUCT_DECL_RE);
  if (sd) {
    if (sd[1].toLowerCase() !== sd[4].toLowerCase() || sd[2].toLowerCase() !== sd[5].toLowerCase()) {
      throw new ParseFailure(li, S.fn.declMismatch);
    }
    return { kind: 'structDecl', structType: sd[1], typeParam: sd[2], varName: sd[3], sourceLine: li };
  }

  // array decl with literal (int[] a = {5, 2, 8};)
  const ad = raw.match(ARRAY_DECL_RE);
  if (ad) {
    const inner = ad[3].trim();
    const values: Value[] = [];
    if (inner) {
      for (const tok of inner.split(',')) {
        const t = tok.trim();
        if (!/^-?\d+$/.test(t)) throw new ParseFailure(li, S.errors.badValue);
        values.push(Number(t));
      }
    }
    return { kind: 'arrayDecl', elemType: ad[1], varName: ad[2], values, sourceLine: li };
  }

  // free-function sort call (bubbleSort(arr);)
  const so = raw.match(SORT_CALL_RE);
  if (so) {
    return { kind: 'sortCall', target: so[1] ?? '', sourceLine: li };
  }

  // scalar decl with init (int x = …)
  const sc = raw.match(SCALAR_DECL_RE);
  if (sc) {
    return { kind: 'scalarDecl', varType: sc[1], varName: sc[2], init: parseExpr(sc[3], li), sourceLine: li };
  }

  // scalar decl without init (int x;)
  const sn = raw.match(SCALAR_DECL_NOINIT_RE);
  if (sn) {
    return { kind: 'scalarDecl', varType: sn[1], varName: sn[2], init: null, sourceLine: li };
  }

  // count++; / count--;
  const id = raw.match(INC_DEC_RE);
  if (id) {
    const op = id[2] === '++' ? '+' : '-';
    return {
      kind: 'assign',
      varName: id[1],
      expr: { kind: 'binop', op, left: { kind: 'var', name: id[1] }, right: { kind: 'literal', value: 1 } },
      sourceLine: li,
    };
  }

  // count += expr;
  const ca = raw.match(COMPOUND_ASSIGN_RE);
  if (ca) {
    return {
      kind: 'assign',
      varName: ca[1],
      expr: { kind: 'binop', op: ca[2], left: { kind: 'var', name: ca[1] }, right: parseExpr(ca[3], li) },
      sourceLine: li,
    };
  }

  // method call statement (obj.method(args);) — must come BEFORE assign
  const mc = raw.match(METHOD_CALL_STMT_RE);
  if (mc) {
    const rawArgs = mc[3].trim();
    const args = rawArgs ? splitArgs(rawArgs).map(a => parseExpr(a, li)) : [];
    return { kind: 'methodCall', target: mc[1], method: mc[2], args, sourceLine: li };
  }

  // assignment (varName = expr;)
  const am = raw.match(ASSIGN_RE);
  if (am) {
    return { kind: 'assign', varName: am[1], expr: parseExpr(am[2], li), sourceLine: li };
  }

  // recognizable-but-unsupported Java keywords get a clearer message
  const kw = raw.match(/^(for|do|switch|try|System)\b/);
  if (kw) throw new ParseFailure(li, S.fn.unsupportedKeyword(kw[1]));

  throw new ParseFailure(li, S.fn.badStatement);
}

function peekOpenBrace(ctx: ParseCtx): boolean {
  return ctx.toks[ctx.pos]?.text === '{';
}

function tryDetachedElse(ctx: ParseCtx): Statement[] | undefined {
  const tok = ctx.toks[ctx.pos];
  if (!tok) return undefined;
  const m = tok.text.match(ELSE_RE);
  if (!m) return undefined;
  ctx.pos++;
  return parseElseBody(m[1], tok.line, ctx);
}

// ─── Validation pass ──────────────────────────────────────────────────────────

/** How many arguments each ArgSpec carries. */
const ARITY: Record<string, number> = { none: 0, value: 1, index: 1, 'index+value': 2 };

/** Reject unknown methods, wrong arities, and undeclared variables before running. */
function validateFunction(params: ParamDef[], body: Statement[]): void {
  const structs = new Map<string, StructKind>();
  const scalars = new Set<string>();
  for (const p of params) {
    if (p.kind === 'struct') structs.set(p.name, p.structType);
    else scalars.add(p.name);
  }
  validateStmts(body, structs, scalars);
}

function validateStmts(stmts: Statement[], structs: Map<string, StructKind>, scalars: Set<string>): void {
  for (const st of stmts) {
    switch (st.kind) {
      case 'structDecl':
        structs.set(st.varName, structKindOf(st.structType));
        break;
      case 'arrayDecl':
        structs.set(st.varName, 'sort');
        break;
      case 'scalarDecl':
        if (st.init) validateExpr(st.init, st.sourceLine, structs, scalars);
        scalars.add(st.varName);
        break;
      case 'assign':
        if (!scalars.has(st.varName)) {
          throw new ParseFailure(
            st.sourceLine,
            structs.has(st.varName) ? S.fn.assignToStructure(st.varName) : S.fn.undeclaredVar(st.varName),
          );
        }
        validateExpr(st.expr, st.sourceLine, structs, scalars);
        break;
      case 'methodCall':
        validateCall(st.target, st.method, st.args, st.sourceLine, structs, scalars);
        break;
      case 'sortCall':
        if (st.target && structs.get(st.target) !== 'sort') {
          throw new ParseFailure(
            st.sourceLine,
            structs.has(st.target) ? S.fn.notAnArray(st.target) : S.fn.undeclaredVar(st.target),
          );
        }
        break;
      case 'while':
        validateExpr(st.cond, st.sourceLine, structs, scalars);
        validateStmts(st.body, structs, scalars);
        break;
      case 'if':
        validateExpr(st.cond, st.sourceLine, structs, scalars);
        validateStmts(st.then, structs, scalars);
        if (st.else_) validateStmts(st.else_, structs, scalars);
        break;
      case 'return':
        if (st.expr) validateExpr(st.expr, st.sourceLine, structs, scalars);
        break;
    }
  }
}

function validateExpr(e: Expr, line: number, structs: Map<string, StructKind>, scalars: Set<string>): void {
  switch (e.kind) {
    case 'var':
      if (!scalars.has(e.name) && !structs.has(e.name)) {
        throw new ParseFailure(line, S.fn.undeclaredVar(e.name));
      }
      break;
    case 'unary':
      validateExpr(e.expr, line, structs, scalars);
      break;
    case 'binop':
      validateExpr(e.left, line, structs, scalars);
      validateExpr(e.right, line, structs, scalars);
      break;
    case 'call':
      validateCall(e.target, e.method, e.args, line, structs, scalars);
      break;
    default:
      break;
  }
}

function validateCall(
  target: string, method: string, args: Expr[],
  line: number, structs: Map<string, StructKind>, scalars: Set<string>,
): void {
  const kind = structs.get(target);
  if (kind === undefined) {
    throw new ParseFailure(
      line,
      scalars.has(target) ? S.fn.notAStructure(target) : S.fn.undeclaredVar(target),
    );
  }
  const lc = method.toLowerCase();
  // isEmpty works on any element container (not on plain arrays).
  if (lc === 'isempty') {
    if (kind === 'sort') throw new ParseFailure(line, S.fn.unknownMethod(method));
    if (args.length !== 0) throw new ParseFailure(line, S.fn.noArgs(method));
    return;
  }
  const entry = findMethod(method, kind);
  if (!entry) throw new ParseFailure(line, S.fn.unknownMethod(method));
  const arity = ARITY[entry.argSpec];
  if (args.length !== arity) {
    throw new ParseFailure(line, arity === 0 ? S.fn.noArgs(method) : S.fn.needsArgs(method, arity));
  }
  for (const a of args) validateExpr(a, line, structs, scalars);
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseFunctionDef(text: string): FuncParseResult {
  const toks = tokenize(text.split('\n'));
  const lastLine = toks.length ? toks[toks.length - 1].line : 0;
  const fail = (line: number, message: string): FuncParseResult =>
    ({ ok: false, error: { line, message } });

  // 1. Require the LeetCode-style class wrapper: `class Name { … }`
  const classTok = toks[0];
  if (!classTok || !CLASS_RE.test(classTok.text)) {
    return fail(classTok ? classTok.line : 0, S.fn.noClass);
  }
  if (toks[1]?.text !== '{') {
    return fail(classTok.line, S.fn.missingClassBrace);
  }

  // 2. The static method signature must follow the class's opening brace.
  const sigTok = toks[2];
  if (!sigTok || !FUNC_SIG_RE.test(sigTok.text)) {
    return fail(sigTok ? sigTok.line : classTok.line, S.fn.noSignature);
  }
  const sigMatch = sigTok.text.match(FUNC_SIG_RE)!;
  const returnType = sigMatch[1];
  const name = sigMatch[2];

  // Parse parameters — structures (Stack<int> s, int[] arr) or scalars (int n)
  const pr = parseParamList(sigMatch[3]);
  if (!pr.ok) return fail(sigTok.line, S.fn.badParam(pr.bad));
  const params = pr.params;

  const ctx: ParseCtx = { toks, pos: 3 };
  try {
    // The method's opening brace is its own token right after the signature.
    if (ctx.toks[ctx.pos]?.text !== '{') {
      return fail(sigTok.line, S.fn.missingOpenBrace);
    }
    ctx.pos++;
    const bodyStartLine = ctx.toks[ctx.pos]?.line ?? sigTok.line;

    const body = parseBlock(ctx);

    // The method's own closing brace
    const closeTok = ctx.toks[ctx.pos];
    if (!closeTok) return fail(lastLine, S.fn.missingBrace);
    if (closeTok.text !== '}') {
      return fail(closeTok.line, ELSE_RE.test(closeTok.text) ? S.fn.strayElse : S.fn.missingBrace);
    }
    ctx.pos++;

    // The class's closing brace
    const classClose = ctx.toks[ctx.pos];
    if (!classClose) return fail(lastLine, S.fn.missingBrace);
    if (classClose.text !== '}') return fail(classClose.line, S.fn.missingBrace);
    ctx.pos++;

    // Nothing but blank/comment lines may follow
    if (ctx.pos < ctx.toks.length) return fail(ctx.toks[ctx.pos].line, S.fn.extraAfterEnd);

    validateFunction(params, body);

    return { ok: true, fn: { name, returnType, params, body, bodyStartLine } };
  } catch (e) {
    if (e instanceof ParseFailure) return fail(e.line, e.message);
    throw e;
  }
}

// ─── Executor ─────────────────────────────────────────────────────────────────

/** Value held in a scalar variable slot. null = declared but unassigned. */
type ScalarVal = Value | boolean | null;

/** Arguments for parameters that aren't bound to the canvas (scalars + extra structures). */
export type FnArgs = Record<string, Value | VisualElement[]>;

interface StructSlot {
  type: StructKind;
  typeParam: string; // declared T, e.g. 'int'; 'T' or '' means "infer from contents"
  isArray?: boolean;
  elements: VisualElement[];
}

class ReturnSignal {
  readonly value: ScalarVal;
  constructor(value: ScalarVal) { this.value = value; }
}

/** What the function produced, for the expected-output comparison. */
export type ReturnInfo =
  | { kind: 'void' }
  | { kind: 'scalar'; value: string }
  | { kind: 'structure'; name: string; type: StructKind; elements: VisualElement[] };

function cloneEls(els: VisualElement[]): VisualElement[] {
  return els.map(e => ({ ...e }));
}

class FunctionExecutor {
  private env = new Map<string, ScalarVal>();
  private structures = new Map<string, StructSlot>();
  private steps: Step[] = [];
  private tab: TabKind;
  /** The source line of the most recently executed statement, for step tagging. */
  private currentLine = 0;
  /** Whatever structure/kind the canvas is currently showing (for lightweight steps). */
  private curKind: StructKind;
  private curElements: VisualElement[] = [];
  private curName: string | undefined;
  /** Set once any error step is emitted — halts the rest of execution. */
  private aborted = false;

  canvasName: string | null = null;
  ret: ReturnInfo = { kind: 'void' };

  constructor(tab: TabKind) {
    this.tab = tab;
    this.curKind = tab; // TabKind and StructKind share the same four values
  }

  private localsSnapshot(): Record<string, string> {
    const snap: Record<string, string> = {};
    for (const [k, v] of this.env.entries()) {
      snap[k] = v === null ? '?' : String(v);
    }
    return snap;
  }

  /** Tag all steps added since `fromIdx` with the current locals snapshot. */
  private tagLocals(fromIdx: number) {
    const snap = this.localsSnapshot();
    for (let i = fromIdx; i < this.steps.length; i++) {
      this.steps[i] = { ...this.steps[i], locals: snap };
    }
  }

  /** Build a fresh frame from the currently-focused structure (never aliased). */
  private currentFrame(): Step['frame'] {
    return frameOf(this.curKind, cloneEls(this.curElements));
  }

  /** Emit a lightweight variable-update step (no structural change). */
  private emitVarStep(desc: string) {
    this.steps.push({
      frame: this.currentFrame(),
      lineSource: 'editor',
      editorLine: this.currentLine,
      description: desc,
      locals: this.localsSnapshot(),
      structureName: this.curName,
    });
  }

  /** Emit an error step and halt the rest of the run. */
  private emitError(desc: string) {
    this.steps.push({
      frame: this.currentFrame(),
      lineSource: 'editor',
      editorLine: this.currentLine,
      description: desc,
      error: true,
      locals: this.localsSnapshot(),
      structureName: this.curName,
    });
    this.aborted = true;
  }

  /** Run one structure op via the shared step engine; commit the result on success. */
  private runStructOp(target: string, slot: StructSlot, op: Operation): Step | undefined {
    const before = this.steps.length;
    const generated = generateSteps(slot.elements, op).map(s => ({
      ...s, editorLine: this.currentLine, opKind: op.kind, structureName: target,
    }));
    this.steps.push(...generated);
    this.tagLocals(before);
    const last = generated[generated.length - 1];
    if (last) {
      this.curKind = slot.type;
      this.curElements = frameElements(last.frame);
      this.curName = target;
      if (last.error) this.aborted = true;
      else slot.elements = frameElements(last.frame).map(e => ({ ...e, state: 'default' as const }));
    }
    return last;
  }

  /** The element a no-arg op reads or removes (top/head peek, pop/remove value). */
  private static elementForOp(kind: Operation['kind'], els: VisualElement[], index?: number): Value | null {
    if (els.length === 0) return null;
    switch (kind) {
      case 'top':
      case 'pop':
      case 'deleteTail':
        return els[els.length - 1].value;
      case 'head':
      case 'dequeue':
      case 'deleteHead':
        return els[0].value;
      case 'deleteAt':
        return index != null && els[index] ? els[index].value : null;
      default:
        return null;
    }
  }

  /** Run the bubble-sort animation on an array variable's elements. */
  private runSort(target: string) {
    const slot = this.structures.get(target);
    if (!slot) { this.emitError(S.fn.undeclaredVar(target)); return; }
    this.runStructOp(target, slot, { kind: 'bubbleSort', sourceLine: this.currentLine });
  }

  /** Call a method on a structure variable, dispatching on its DECLARED type. */
  private callMethod(target: string, method: string, args: ScalarVal[]): ScalarVal {
    const slot = this.structures.get(target);
    if (!slot) return null; // validation guarantees the target is declared
    const lc = method.toLowerCase();

    // isEmpty — emit a check/result step directly (works for every kind).
    if (lc === 'isempty') {
      const empty = slot.elements.length === 0;
      this.curKind = slot.type;
      this.curElements = cloneEls(slot.elements);
      this.curName = target;
      this.emitVarStep(S.isEmptyCheck);
      this.emitVarStep(S.isEmptyResult(empty));
      // Tag both steps so the isEmpty pseudo-code listing shows + highlights.
      const n = this.steps.length;
      this.steps[n - 2] = { ...this.steps[n - 2], opKind: 'isEmpty', lineSource: 'pseudo', line: 0 };
      this.steps[n - 1] = { ...this.steps[n - 1], opKind: 'isEmpty', lineSource: 'pseudo', line: 1 };
      return empty;
    }

    const entry = findMethod(method, slot.type);
    if (!entry) return null; // validation guarantees this never fires
    const line = this.currentLine;

    // Resolve a value argument (insert/push/insertHead/insertAt …) and type-check it.
    const valueArg = (raw: ScalarVal): Value | null => {
      if (raw === null || typeof raw === 'boolean') return null;
      const value = raw as Value;
      if (slot.typeParam && slot.typeParam.toLowerCase() !== 't'
        && !matchesType(slot.typeParam, valueKindOf(value), value)) {
        this.emitError(S.errors.typeMismatch(value, slot.typeParam, target));
        return null;
      }
      return value;
    };
    const indexArg = (raw: ScalarVal): number =>
      typeof raw === 'number' ? raw : 0;

    let op: Operation;
    let index: number | undefined;
    switch (entry.argSpec) {
      case 'value': {
        const value = valueArg(args[0]);
        if (value === null) return null; // type error already emitted
        op = { kind: entry.kind, value, sourceLine: line } as Operation;
        break;
      }
      case 'index': {
        index = indexArg(args[0]);
        op = { kind: entry.kind, index, sourceLine: line } as Operation;
        break;
      }
      case 'index+value': {
        index = indexArg(args[0]);
        const value = valueArg(args[1]);
        if (value === null) return null;
        op = { kind: entry.kind, index, value, sourceLine: line } as Operation;
        break;
      }
      default: // 'none' — peeks (top/head) and removals (pop/dequeue/delete*)
        op = { kind: entry.kind, sourceLine: line } as Operation;
        break;
    }

    const peekOrRemoved = FunctionExecutor.elementForOp(entry.kind, slot.elements, index);
    const last = this.runStructOp(target, slot, op);
    return last && last.error ? null : peekOrRemoved;
  }

  private evalExpr(expr: Expr): ScalarVal {
    switch (expr.kind) {
      case 'literal': return expr.value;
      case 'bool': return expr.value;
      case 'var': {
        if (this.env.has(expr.name)) return this.env.get(expr.name) ?? null;
        return null;
      }
      case 'unary': {
        const v = this.evalExpr(expr.expr);
        return !v;
      }
      case 'binop': {
        const l = this.evalExpr(expr.left);
        const r = this.evalExpr(expr.right);
        switch (expr.op) {
          case '+': return (l as number) + (r as number);
          case '-': return (l as number) - (r as number);
          case '*': return (l as number) * (r as number);
          case '/': {
            const a = l as number, b = r as number;
            // Java: int/int truncates toward zero; any double operand → real division.
            return Number.isInteger(a) && Number.isInteger(b) ? Math.trunc(a / b) : a / b;
          }
          case '%': return (l as number) % (r as number);
          case '==': return l === r;
          case '!=': return l !== r;
          case '<':  return (l as number) < (r as number);
          case '>':  return (l as number) > (r as number);
          case '<=': return (l as number) <= (r as number);
          case '>=': return (l as number) >= (r as number);
          case '&&': return Boolean(l) && Boolean(r);
          case '||': return Boolean(l) || Boolean(r);
          default: return null;
        }
      }
      case 'call': {
        const evaluatedArgs = expr.args.map(a => this.evalExpr(a));
        return this.callMethod(expr.target, expr.method, evaluatedArgs);
      }
    }
  }

  private execStatement(stmt: Statement): ReturnSignal | void {
    this.currentLine = stmt.sourceLine;

    switch (stmt.kind) {
      case 'structDecl': {
        const type = structKindOf(stmt.structType);
        this.structures.set(stmt.varName, { type, typeParam: stmt.typeParam, elements: [] });
        this.curKind = type;
        this.curElements = [];
        this.curName = stmt.varName;
        this.emitVarStep(S.fn.declStruct(stmt.varName, stmt.structType, stmt.typeParam));
        break;
      }

      case 'arrayDecl': {
        const els = stmt.values.map(v => makeEl(v));
        this.structures.set(stmt.varName, { type: 'sort', typeParam: stmt.elemType, isArray: true, elements: els });
        this.curKind = 'sort';
        this.curElements = els;
        this.curName = stmt.varName;
        this.emitVarStep(S.fn.declArray(stmt.varName, stmt.values.length));
        break;
      }

      case 'sortCall': {
        this.runSort(stmt.target || this.canvasName || '');
        break;
      }

      case 'scalarDecl': {
        const val = stmt.init ? this.evalExpr(stmt.init) : null;
        if (this.aborted) return;
        this.env.set(stmt.varName, val);
        this.emitVarStep(S.fn.declVar(stmt.varName, val === null ? '?' : val));
        break;
      }

      case 'assign': {
        const val = this.evalExpr(stmt.expr);
        if (this.aborted) return;
        this.env.set(stmt.varName, val);
        this.emitVarStep(S.fn.assignVar(stmt.varName, val));
        break;
      }

      case 'methodCall': {
        const args = stmt.args.map(a => this.evalExpr(a));
        this.callMethod(stmt.target, stmt.method, args);
        break;
      }

      case 'while': {
        let iters = 0;
        while (true) {
          if (iters >= MAX_FN_ITER) {
            this.currentLine = stmt.sourceLine;
            this.emitError(S.fn.tooManyIterations(MAX_FN_ITER));
            return;
          }
          // Reset to the while line before each condition check so condition
          // steps (e.g. isEmpty) highlight the right line.
          this.currentLine = stmt.sourceLine;
          const stepsBefore = this.steps.length;
          const cond = this.evalExpr(stmt.cond);
          if (this.aborted) return;
          // If the condition produced no steps (pure scalar: count > 0 etc.),
          // emit a lightweight step so the while line is always highlighted.
          if (this.steps.length === stepsBefore) {
            this.emitVarStep(cond ? S.fn.whileCheck : S.fn.whileExit);
          }
          if (!cond) break;
          iters++;
          for (const s of stmt.body) {
            const sig = this.execStatement(s);
            if (sig instanceof ReturnSignal) return sig;
            if (this.aborted) return;
          }
        }
        break;
      }

      case 'if': {
        // Reset to the if line before condition evaluation (important when if is
        // inside a loop body whose statements have updated currentLine).
        this.currentLine = stmt.sourceLine;
        const ifStepsBefore = this.steps.length;
        const cond = this.evalExpr(stmt.cond);
        if (this.aborted) return;
        if (this.steps.length === ifStepsBefore) {
          this.emitVarStep(S.fn.ifCheck);
        }
        const branch = cond ? stmt.then : (stmt.else_ ?? []);
        for (const s of branch) {
          const sig = this.execStatement(s);
          if (sig instanceof ReturnSignal) return sig;
          if (this.aborted) return;
        }
        break;
      }

      case 'return': {
        if (stmt.expr?.kind === 'var' && this.structures.has(stmt.expr.name)) {
          const slot = this.structures.get(stmt.expr.name)!;
          this.ret = { kind: 'structure', name: stmt.expr.name, type: slot.type, elements: cloneEls(slot.elements) };
          this.emitVarStep(S.fn.returned(stmt.expr.name));
          return new ReturnSignal(null);
        }
        const val = stmt.expr ? this.evalExpr(stmt.expr) : null;
        if (this.aborted) return;
        const valStr = val === null ? 'void' : String(val);
        this.ret = val === null ? { kind: 'void' } : { kind: 'scalar', value: valStr };
        this.emitVarStep(S.fn.returned(valStr));
        this.steps[this.steps.length - 1].returnValue = valStr;
        return new ReturnSignal(val);
      }
    }
  }

  run(fn: FunctionDef, initialData: VisualElement[], args: FnArgs): Step[] {
    const canvasIndex = canvasParamIndex(fn.params, this.tab);
    this.canvasName = canvasIndex >= 0 ? fn.params[canvasIndex].name : null;

    // Bind every parameter: the canvas-bound structure gets the on-screen data;
    // others come from the supplied arguments.
    fn.params.forEach((p, i) => {
      if (p.kind === 'struct') {
        const a = args[p.name];
        const elements = i === canvasIndex
          ? cloneEls(initialData)
          : (Array.isArray(a) ? cloneEls(a) : []);
        this.structures.set(p.name, { type: p.structType, typeParam: p.typeParam, isArray: p.isArray, elements });
      } else {
        const a = args[p.name];
        this.env.set(p.name, a === undefined || Array.isArray(a) ? null : a);
      }
    });

    // Initial canvas view: the on-screen structure (so step 0 shows real data).
    this.curKind = this.canvasName ? this.structures.get(this.canvasName)!.type : this.tab;
    this.curElements = cloneEls(initialData);
    this.curName = this.canvasName ?? undefined;

    for (const stmt of fn.body) {
      const sig = this.execStatement(stmt);
      if (sig instanceof ReturnSignal) break;
      if (this.aborted) break;
    }

    // If no steps were generated (empty function), emit a placeholder showing the data.
    if (this.steps.length === 0) {
      this.steps.push({
        frame: this.currentFrame(),
        lineSource: 'editor',
        editorLine: fn.bodyStartLine,
        description: S.fn.emptyFunction,
        locals: {},
      });
    }

    return this.steps;
  }

  /** Final state of the canvas-bound parameter, or null when nothing binds to it. */
  canvasFinal(): VisualElement[] | null {
    return this.canvasName ? (this.structures.get(this.canvasName)?.elements ?? null) : null;
  }

  canvasType(): StructKind | null {
    return this.canvasName ? (this.structures.get(this.canvasName)?.type ?? null) : null;
  }

  /** Snapshot every structure (params + locals) by name, for keyed comparison. */
  structuresSnapshot(): Record<string, { type: StructKind; elements: VisualElement[] }> {
    const out: Record<string, { type: StructKind; elements: VisualElement[] }> = {};
    for (const [name, slot] of this.structures.entries()) {
      out[name] = { type: slot.type, elements: cloneEls(slot.elements) };
    }
    return out;
  }

  /** Final values of scalar variables, for keyed comparison (e.g. count: 3). */
  localsFinal(): Record<string, string> {
    return this.localsSnapshot();
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export interface FunctionRunResult {
  steps: Step[];
  /** Commit to the canvas, or null to leave the canvas untouched. */
  canvasFinal: VisualElement[] | null;
  canvasType: StructKind | null;
  /** Every structure (params + locals) by name. */
  structures: Record<string, { type: StructKind; elements: VisualElement[] }>;
  /** Final values of scalar variables by name. */
  locals: Record<string, string>;
  ret: ReturnInfo;
}

export function executeFunction(
  fn: FunctionDef,
  initialData: VisualElement[],
  tab: TabKind,
  args: FnArgs = {},
): FunctionRunResult {
  const exec = new FunctionExecutor(tab);
  const steps = exec.run(fn, initialData, args);
  return {
    steps,
    canvasFinal: exec.canvasFinal(),
    canvasType: exec.canvasType(),
    structures: exec.structuresSnapshot(),
    locals: exec.localsFinal(),
    ret: exec.ret,
  };
}

/** Signature info for the parameter-inputs UI (cheap: parses the signature only). */
export interface SignatureInfo {
  params: ParamDef[];
  /** Parameter bound to the on-screen canvas (no input needed), or null. */
  canvasParamName: string | null;
}

export function parseSignature(text: string, tab: TabKind): SignatureInfo | null {
  const lines = text.split('\n').map(clean);
  let sigLine = -1;
  for (let i = 0; i < lines.length; i++) {
    // The method signature line keeps its trailing `{` after clean(); strip it.
    if (FUNC_SIG_RE.test(lines[i].replace(/\s*\{\s*$/, ''))) { sigLine = i; break; }
  }
  if (sigLine === -1) return null;
  const m = lines[sigLine].replace(/\s*\{\s*$/, '').match(FUNC_SIG_RE)!;
  const pr = parseParamList(m[3]);
  if (!pr.ok) return null;
  const ci = canvasParamIndex(pr.params, tab);
  return { params: pr.params, canvasParamName: ci >= 0 ? pr.params[ci].name : null };
}

/** Detect the LeetCode-style class wrapper, so the args/expected UI can show. */
export function isFunctionMode(code: string): boolean {
  return code.split('\n').some(line => CLASS_RE.test(clean(line).replace(/\s*\{\s*$/, '')));
}
