import type { Operation, Step, TabKind, VisualElement } from '../types';
import { frameElements } from '../types';
import { MAX_VALUE } from '../constants';
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

interface MethodSpec {
  kind: 'push' | 'pop' | 'enqueue' | 'dequeue'
    | 'insertHead' | 'insertTail' | 'insertAt'
    | 'deleteHead' | 'deleteTail' | 'deleteAt';
  args: number;
  tab: TabKind;
}

const METHODS: Record<string, MethodSpec> = {
  push: { kind: 'push', args: 1, tab: 'stack' },
  pop: { kind: 'pop', args: 0, tab: 'stack' },
  enqueue: { kind: 'enqueue', args: 1, tab: 'queue' },
  dequeue: { kind: 'dequeue', args: 0, tab: 'queue' },
  inserthead: { kind: 'insertHead', args: 1, tab: 'list' },
  inserttail: { kind: 'insertTail', args: 1, tab: 'list' },
  insertat: { kind: 'insertAt', args: 2, tab: 'list' },
  deletehead: { kind: 'deleteHead', args: 0, tab: 'list' },
  deletetail: { kind: 'deleteTail', args: 0, tab: 'list' },
  deleteat: { kind: 'deleteAt', args: 1, tab: 'list' },
};

const DECLARATION_RE = /^\w[\w<>[\]\s]*\s+\w+\s*=\s*new\s+[\w<>\s]+\(\s*\)\s*;?$/;
const ARRAY_RE = /^int\s*\[\s*\]\s*\w+\s*=\s*\{([^}]*)\}\s*;?$/;
const SORT_CALL_RE = /^bubblesort\s*\(\s*\w*\s*\)\s*;?$/i;
const METHOD_RE = /^(\w+)\.(\w+)\s*\(([^()]*)\)\s*;?$/;

function err(line: number, message: string): ParseResult {
  return { ok: false, error: { line, message } };
}

export function parseProgram(text: string, tab: TabKind): ParseResult {
  const ops: Operation[] = [];
  const lines = text.split('\n');

  for (let li = 0; li < lines.length; li++) {
    const code = normalizeDigits(lines[li]).replace(/\/\/.*$/, '').trim();
    if (!code) continue;
    if (DECLARATION_RE.test(code)) continue;

    const arr = code.match(ARRAY_RE);
    if (arr) {
      if (tab !== 'sort') return err(li, S.errors.wrongTab('int[]'));
      const parts = arr[1].split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length < 2 || parts.length > 10) return err(li, S.errors.arrayCount);
      const values = parts.map(p => (/^\d+$/.test(p) ? parseInt(p, 10) : NaN));
      if (values.some(v => Number.isNaN(v) || v > MAX_VALUE)) return err(li, S.errors.badNumber);
      ops.push({ kind: 'setArray', values, sourceLine: li });
      continue;
    }

    if (SORT_CALL_RE.test(code)) {
      if (tab !== 'sort') return err(li, S.errors.wrongTab('bubbleSort'));
      ops.push({ kind: 'bubbleSort', sourceLine: li });
      continue;
    }

    const m = code.match(METHOD_RE);
    if (m) {
      const name = m[2];
      const spec = METHODS[name.toLowerCase()];
      if (!spec) return err(li, S.errors.unknownOp(name));
      if (spec.tab !== tab) return err(li, S.errors.wrongTab(name));
      const argStr = m[3].trim();
      const args = argStr ? argStr.split(',').map(a => a.trim()) : [];
      if (args.length !== spec.args) return err(li, S.errors.badArgs(name, spec.args));
      const nums = args.map(a => (/^\d+$/.test(a) ? parseInt(a, 10) : NaN));
      if (nums.some(n => Number.isNaN(n) || n > MAX_VALUE)) return err(li, S.errors.badNumber);

      switch (spec.kind) {
        case 'push': ops.push({ kind: 'push', value: nums[0], sourceLine: li }); break;
        case 'pop': ops.push({ kind: 'pop', sourceLine: li }); break;
        case 'enqueue': ops.push({ kind: 'enqueue', value: nums[0], sourceLine: li }); break;
        case 'dequeue': ops.push({ kind: 'dequeue', sourceLine: li }); break;
        case 'insertHead': ops.push({ kind: 'insertHead', value: nums[0], sourceLine: li }); break;
        case 'insertTail': ops.push({ kind: 'insertTail', value: nums[0], sourceLine: li }); break;
        case 'insertAt': ops.push({ kind: 'insertAt', index: nums[0], value: nums[1], sourceLine: li }); break;
        case 'deleteHead': ops.push({ kind: 'deleteHead', sourceLine: li }); break;
        case 'deleteTail': ops.push({ kind: 'deleteTail', sourceLine: li }); break;
        case 'deleteAt': ops.push({ kind: 'deleteAt', index: nums[0], sourceLine: li }); break;
      }
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
