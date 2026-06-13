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
export function normalizeDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, d => {
    const a = ARABIC_DIGITS.indexOf(d);
    if (a >= 0) return String(a);
    return String(PERSIAN_DIGITS.indexOf(d));
  });
}

// ─── Method table ────────────────────────────────────────────────────────────
// Both Stack and Queue use insert/remove in the Ministry of Education spec, so
// the same method name maps to different op kinds depending on the active tab.
// Using an array (not a Record) lets us have duplicate method names with
// different tab scopes.

export type ArgSpec = 'none' | 'value' | 'index' | 'index+value';

export interface MethodEntry {
  name: string;
  kind: Operation['kind'];
  argSpec: ArgSpec;
  tabs: TabKind[];
}

const METHODS: MethodEntry[] = [
  // ── Stack (Ministry spec: insert/remove/top/isEmpty; push/pop as aliases) ──
  { name: 'insert', kind: 'push',    argSpec: 'value', tabs: ['stack'] },
  { name: 'remove', kind: 'pop',     argSpec: 'none',  tabs: ['stack'] },
  { name: 'top',    kind: 'top',     argSpec: 'none',  tabs: ['stack'] },
  { name: 'push',   kind: 'push',    argSpec: 'value', tabs: ['stack'] },   // alias
  { name: 'pop',    kind: 'pop',     argSpec: 'none',  tabs: ['stack'] },   // alias
  // ── Queue (insert/remove/head/isEmpty; enqueue/dequeue as aliases) ─────────
  { name: 'insert',  kind: 'enqueue', argSpec: 'value', tabs: ['queue'] },
  { name: 'remove',  kind: 'dequeue', argSpec: 'none',  tabs: ['queue'] },
  { name: 'head',    kind: 'head',    argSpec: 'none',  tabs: ['queue'] },
  { name: 'enqueue', kind: 'enqueue', argSpec: 'value', tabs: ['queue'] }, // alias
  { name: 'dequeue', kind: 'dequeue', argSpec: 'none',  tabs: ['queue'] }, // alias
  // ── Shared ─────────────────────────────────────────────────────────────────
  { name: 'isempty', kind: 'isEmpty', argSpec: 'none', tabs: ['stack', 'queue'] },
  // ── Linked List ────────────────────────────────────────────────────────────
  { name: 'inserthead', kind: 'insertHead', argSpec: 'value',       tabs: ['list'] },
  { name: 'inserttail', kind: 'insertTail', argSpec: 'value',       tabs: ['list'] },
  { name: 'insertat',   kind: 'insertAt',   argSpec: 'index+value', tabs: ['list'] },
  { name: 'deletehead', kind: 'deleteHead', argSpec: 'none',        tabs: ['list'] },
  { name: 'deletetail', kind: 'deleteTail', argSpec: 'none',        tabs: ['list'] },
  { name: 'deleteat',   kind: 'deleteAt',   argSpec: 'index',       tabs: ['list'] },
];

export function findMethod(name: string, tab: TabKind): MethodEntry | undefined {
  return METHODS.find(m => m.name === name.toLowerCase() && m.tabs.includes(tab));
}

function methodExistsForAnyTab(name: string): boolean {
  return METHODS.some(m => m.name === name.toLowerCase());
}

// ─── Regex patterns ──────────────────────────────────────────────────────────

// `Stack<int> s = new Stack<int>();`
const DECLARATION_RE =
  /^\w+(?:\s*<\s*(\w+)\s*>)?\s+(\w+)\s*=\s*new\s+\w+(?:\s*<\s*\w+\s*>)?\s*\(\s*\)\s*;?$/;

// `obj.method(args)`
const METHOD_RE = /^(\w+)\.(\w+)\s*\(([^()]*)\)\s*;?$/;

// `int[] arr = {5, 2, 8, 1};` (sort tab)
const SORT_ARRAY_RE =
  /^(?:int|Integer)\s*\[\s*\]\s+(\w+)\s*=\s*\{([^}]+)\}\s*;?$/;

// `bubbleSort(arr);` or just `bubbleSort();`
const SORT_CALL_RE = /^(?:\w+\.)?(?:bubbleSort|sort)\s*\([^)]*\)\s*;?$/;

// ─── Value parsing ────────────────────────────────────────────────────────────

export type ValueKind = 'int' | 'double' | 'text';

export type ParsedValue =
  | { ok: true; value: Value; valueKind: ValueKind }
  | { ok: false; message: string };

/** Classify an already-evaluated runtime value as int / double / text. */
export function valueKindOf(v: Value): ValueKind {
  if (typeof v === 'string') return 'text';
  return Number.isInteger(v) ? 'int' : 'double';
}

export function parseValue(raw: string): ParsedValue {
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

function parseIndex(raw: string): { ok: true; index: number } | { ok: false; message: string } {
  const s = raw.trim();
  if (/^\d+$/.test(s)) return { ok: true, index: parseInt(s, 10) };
  return { ok: false, message: S.errors.badIndex };
}

export function matchesType(t: string, valueKind: ValueKind, value: Value): boolean {
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
      return true;
  }
}

function err(line: number, message: string): ParseResult {
  return { ok: false, error: { line, message } };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseProgram(text: string, tab: TabKind): ParseResult {
  const ops: Operation[] = [];
  const declaredType = new Map<string, string>();
  const lines = text.split('\n');

  for (let li = 0; li < lines.length; li++) {
    const code = normalizeDigits(lines[li]).replace(/\/\/.*$/, '').trim();
    if (!code) continue;

    // ── Sort tab: array declaration ───────────────────────────────────────────
    if (tab === 'sort') {
      const arr = code.match(SORT_ARRAY_RE);
      if (arr) {
        const rawNums = arr[2].split(',').map(s => s.trim()).filter(Boolean);
        const nums: number[] = [];
        for (const raw of rawNums) {
          if (!/^-?\d+(\.\d+)?$/.test(raw)) return err(li, S.errors.badValue);
          nums.push(Number(raw));
        }
        if (nums.length < 2) return err(li, 'تحتاج المصفوفة إلى عنصرين على الأقل');
        if (nums.length > 12) return err(li, 'المصفوفة كبيرة جدًا — الحد الأقصى 12 عنصرًا');
        ops.push({ kind: 'newSort', bars: nums, sourceLine: li });
        continue;
      }
      if (SORT_CALL_RE.test(code)) {
        ops.push({ kind: 'bubbleSort', sourceLine: li });
        continue;
      }
      return err(li, S.errors.syntax);
    }

    // ── Declaration: Stack<T> s = new Stack<T>(); ─────────────────────────────
    const decl = code.match(DECLARATION_RE);
    if (decl) {
      if (decl[1]) declaredType.set(decl[2], decl[1]);
      if (tab === 'stack' || tab === 'queue' || tab === 'list') {
        ops.push({
          kind: 'newStructure',
          target: tab as 'stack' | 'queue' | 'list',
          typeParam: decl[1],
          varName: decl[2],
          sourceLine: li,
        });
      }
      continue;
    }

    // ── Method call: obj.method(args) ─────────────────────────────────────────
    const m = code.match(METHOD_RE);
    if (m) {
      const [, varName, name, argStr] = m;
      const spec = findMethod(name, tab);
      if (!spec) {
        if (methodExistsForAnyTab(name)) return err(li, S.errors.wrongTab(name));
        return err(li, S.errors.unknownOp(name));
      }

      const trimmed = argStr.trim();

      if (spec.argSpec === 'none') {
        if (trimmed) return err(li, S.errors.badArgs(name, 0));
        if (spec.kind === 'isEmpty') {
          ops.push({ kind: 'isEmpty', target: tab as 'stack' | 'queue', sourceLine: li });
        } else {
          ops.push({ kind: spec.kind, sourceLine: li } as Operation);
        }
        continue;
      }

      if (spec.argSpec === 'value') {
        if (!trimmed) return err(li, S.errors.badArgs(name, 1));
        const parsed = parseValue(trimmed);
        if (!parsed.ok) return err(li, parsed.message);
        const t = declaredType.get(varName);
        if (t && !matchesType(t, parsed.valueKind, parsed.value)) {
          return err(li, S.errors.typeMismatch(parsed.value, t, varName));
        }
        ops.push({ kind: spec.kind, value: parsed.value, sourceLine: li } as Operation);
        continue;
      }

      if (spec.argSpec === 'index') {
        if (!trimmed) return err(li, S.errors.badArgs(name, 1));
        const pi = parseIndex(trimmed);
        if (!pi.ok) return err(li, pi.message);
        ops.push({ kind: spec.kind, index: pi.index, sourceLine: li } as Operation);
        continue;
      }

      if (spec.argSpec === 'index+value') {
        // insertAt(index, value)
        const parts = trimmed.split(',');
        if (parts.length !== 2) return err(li, S.errors.badArgs(name, 2));
        const pi = parseIndex(parts[0]);
        if (!pi.ok) return err(li, pi.message);
        const pv = parseValue(parts[1]);
        if (!pv.ok) return err(li, pv.message);
        const t = declaredType.get(varName);
        if (t && !matchesType(t, pv.valueKind, pv.value)) {
          return err(li, S.errors.typeMismatch(pv.value, t, varName));
        }
        ops.push({ kind: spec.kind, index: pi.index, value: pv.value, sourceLine: li } as Operation);
        continue;
      }
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
  let currentVarName: string | undefined = undefined;
  for (const op of ops) {
    if (op.kind === 'newStructure' && op.varName) currentVarName = op.varName;
    const steps = generateSteps(data, op).map(s => ({
      ...s,
      editorLine: op.sourceLine,
      opKind: op.kind,
      structureName: currentVarName,
    }));
    all.push(...steps);
    const last = steps[steps.length - 1];
    if (last.error) break;
    data = frameElements(last.frame);
  }
  return all;
}
