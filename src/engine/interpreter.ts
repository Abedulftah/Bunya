import type { Operation, Step, TabKind, Value, VisualElement } from '../types';
import { frameElements } from '../types';
import { MAX_VALUE_LEN } from '../constants';
import { S } from '../i18n/strings';
import { generateSteps } from './steps';

export interface ParseError {
  /** 0-based line index in the editor; -1 when not tied to a line. */
  line: number;
  message: string;
}

export type ParseResult =
  | { ok: true; ops: Operation[] }
  | { ok: false; error: ParseError };

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Students often type Arabic-Indic digits — normalize them to ASCII. */
function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, d => {
    const a = ARABIC_DIGITS.indexOf(d);
    if (a >= 0) return String(a);
    return String(PERSIAN_DIGITS.indexOf(d));
  });
}

/**
 * Only the operations named in instruction.md are accepted from code:
 * push/pop (stack) and enqueue/dequeue (queue). The other structures
 * are animated via their toolbar buttons.
 */
interface MethodSpec {
  kind: 'push' | 'pop' | 'enqueue' | 'dequeue';
  args: number;
  tab: TabKind;
}

const METHODS: Record<string, MethodSpec> = {
  push: { kind: 'push', args: 1, tab: 'stack' },
  pop: { kind: 'pop', args: 0, tab: 'stack' },
  enqueue: { kind: 'enqueue', args: 1, tab: 'queue' },
  dequeue: { kind: 'dequeue', args: 0, tab: 'queue' },
};

// e.g. `Stack<int> s = new Stack<int>();` — captures the type parameter T and the variable name
const DECLARATION_RE = /^\w+(?:\s*<\s*(\w+)\s*>)?\s+(\w+)\s*=\s*new\s+\w+(?:\s*<\s*\w+\s*>)?\s*\(\s*\)\s*;?$/;
const METHOD_RE = /^(\w+)\.(\w+)\s*\(([^()]*)\)\s*;?$/;

type ParsedValue =
  | { ok: true; value: Value; valueKind: 'int' | 'double' | 'text' }
  | { ok: false; message: string };

/** Values are generic (any type T): integers, decimals, or quoted text. */
function parseValue(raw: string): ParsedValue {
  const s = raw.trim();
  const quoted = s.match(/^"([^"]*)"$|^'([^']*)'$/);
  if (quoted) {
    const text = quoted[1] ?? quoted[2];
    if (text.length === 0) return { ok: false, message: S.errors.badValue };
    if (text.length > MAX_VALUE_LEN) return { ok: false, message: S.errors.tooLong };
    return { ok: true, value: text, valueKind: 'text' };
  }
  if (/^-?\d+$/.test(s) || /^-?\d+\.\d+$/.test(s)) {
    if (s.length > MAX_VALUE_LEN) return { ok: false, message: S.errors.tooLong };
    return { ok: true, value: Number(s), valueKind: s.includes('.') ? 'double' : 'int' };
  }
  if (/^[\p{L}_][\p{L}\p{N}_]*$/u.test(s)) return { ok: false, message: S.errors.needQuotes };
  return { ok: false, message: S.errors.badValue };
}

/** Does a parsed value match the declared generic type parameter? */
function matchesType(t: string, valueKind: 'int' | 'double' | 'text', value: Value): boolean {
  switch (t.toLowerCase()) {
    case 'int':
    case 'integer':
    case 'long':
      return valueKind === 'int';
    case 'double':
    case 'float':
      return valueKind === 'int' || valueKind === 'double';
    case 'string':
      return valueKind === 'text';
    case 'char':
    case 'character':
      return valueKind === 'text' && String(value).length === 1;
    default:
      return true; // T or any unknown type parameter accepts everything
  }
}

function err(line: number, message: string): ParseResult {
  return { ok: false, error: { line, message } };
}

export function parseProgram(text: string, tab: TabKind): ParseResult {
  const ops: Operation[] = [];
  const declaredType = new Map<string, string>(); // variable name → generic type parameter
  const lines = text.split('\n');

  for (let li = 0; li < lines.length; li++) {
    const code = normalizeDigits(lines[li]).replace(/\/\/.*$/, '').trim();
    if (!code) continue;

    const decl = code.match(DECLARATION_RE);
    if (decl) {
      if (decl[1]) declaredType.set(decl[2], decl[1]);
      continue;
    }

    const m = code.match(METHOD_RE);
    if (m) {
      const [, varName, name, argStr] = m;
      const spec = METHODS[name.toLowerCase()];
      if (!spec) return err(li, S.errors.unknownOp(name));
      if (spec.tab !== tab) return err(li, S.errors.wrongTab(name));
      const trimmedArgs = argStr.trim();
      if (spec.args === 0) {
        if (trimmedArgs) return err(li, S.errors.badArgs(name, 0));
        ops.push({ kind: spec.kind, sourceLine: li } as Operation);
        continue;
      }
      if (!trimmedArgs) return err(li, S.errors.badArgs(name, 1));
      const parsed = parseValue(trimmedArgs);
      if (!parsed.ok) return err(li, parsed.message);
      const t = declaredType.get(varName);
      if (t && !matchesType(t, parsed.valueKind, parsed.value)) {
        return err(li, S.errors.typeMismatch(parsed.value, t, varName));
      }
      ops.push({ kind: spec.kind, value: parsed.value, sourceLine: li } as Operation);
      continue;
    }

    return err(li, S.errors.syntax);
  }

  if (ops.length === 0) return err(-1, S.errors.emptyProgram);
  return { ok: true, ops };
}

/**
 * Chains operations into one scrubbable step list, retagging every step
 * with the editor line it came from. Stops at the first runtime error.
 */
export function compileOps(ops: Operation[], initial: VisualElement[]): Step[] {
  let data = initial;
  const all: Step[] = [];
  for (const op of ops) {
    const steps = generateSteps(data, op).map(s => ({
      ...s,
      line: op.sourceLine,
      lineSource: 'editor' as const,
    }));
    all.push(...steps);
    const last = steps[steps.length - 1];
    if (last.error) break;
    data = frameElements(last.frame);
  }
  return all;
}
