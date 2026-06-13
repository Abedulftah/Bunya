/**
 * Expected-output parsing and comparison for function mode.
 *
 * The user types one or more comma-separated clauses describing the expected
 * result; each clause is one of:
 *   - `name: [1, 2, 3]`  — a structure variable (parameter or local) by name
 *   - `name: 3`          — a scalar variable by name
 *   - `return: 3`        — the scalar return value
 *   - `return: [3, 2, 1]`— the returned structure's contents
 *   - `[3, 2, 1]`        — bare: the returned structure, else the canvas structure
 *   - `3`                — bare: the scalar return value
 *
 * Structures are compared front→top: a stack as top→bottom (so `[3,2,1]` means
 * 3 is on top), a queue as front→rear. Values compare by normalized string, so
 * `3.0` matches `3` and quotes around text are optional.
 */

import type { Value, VisualElement } from '../types';
import type { FunctionRunResult, StructKind } from './function-interpreter';

export interface TestResult {
  pass: boolean;
  actual: string;
  expected: string;
}

// ─── Parsing ────────────────────────────────────────────────────────────────

type Clause =
  | { type: 'named'; name: string; raw: string }
  | { type: 'return'; raw: string }
  | { type: 'bare'; raw: string };

/** Split on top-level commas, respecting [...] brackets. */
function splitClauses(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    else if (ch === ',' && depth === 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseClauses(raw: string): Clause[] {
  return splitClauses(raw.trim()).map(clause => {
    // a ':' outside of brackets separates key from value
    let depth = 0;
    let colon = -1;
    for (let i = 0; i < clause.length; i++) {
      const c = clause[i];
      if (c === '[') depth++;
      else if (c === ']') depth--;
      else if (c === ':' && depth === 0) { colon = i; break; }
    }
    if (colon === -1) return { type: 'bare', raw: clause };
    const key = clause.slice(0, colon).trim();
    const val = clause.slice(colon + 1).trim();
    if (key.toLowerCase() === 'return') return { type: 'return', raw: val };
    return { type: 'named', name: key, raw: val };
  });
}

// ─── Value helpers ────────────────────────────────────────────────────────────

function isList(raw: string): boolean {
  return raw.trim().startsWith('[');
}

/** Parse a single value token: a number, or text with optional quotes. */
export function parseScalarToken(raw: string): Value {
  const s = raw.trim();
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s.replace(/^["']|["']$/g, '');
}

/** Parse a `[a, b, c]` (or bare `a, b, c`) list into values. */
export function parseList(raw: string): Value[] {
  const inner = raw.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  if (!inner) return [];
  return inner.split(',').map(t => parseScalarToken(t));
}

/** Normalize a scalar token so 3.0 == 3 and "abc" == abc. */
function normScalar(raw: string): string {
  const s = raw.trim().replace(/^["']|["']$/g, '');
  if (/^-?\d+(\.\d+)?$/.test(s)) return String(Number(s));
  return s;
}

function normValue(v: Value): string {
  return typeof v === 'number' ? String(v) : v.replace(/^["']|["']$/g, '');
}

/** Order a structure's elements front→top for display and comparison. */
function ordered(type: StructKind, els: VisualElement[]): Value[] {
  const vals = els.map(e => e.value);
  return type === 'stack' ? vals.reverse() : vals;
}

function fmtList(vals: Value[]): string {
  return `[${vals.join(', ')}]`;
}

function eqList(a: Value[], b: Value[]): boolean {
  return a.length === b.length && a.every((v, i) => normValue(v) === normValue(b[i]));
}

// ─── Comparison ────────────────────────────────────────────────────────────────

/** Compare a run result against the expected-output text. Returns null when blank. */
export function compareExpected(expectedRaw: string, result: FunctionRunResult): TestResult | null {
  if (!expectedRaw.trim()) return null;
  const clauses = parseClauses(expectedRaw);
  if (clauses.length === 0) return null;

  const mismatches: string[] = [];
  const actualParts: string[] = [];
  const expectedParts: string[] = [];

  const compareStructure = (
    target: { type: StructKind; elements: VisualElement[] } | null,
    expectedList: Value[],
    label: string,
  ) => {
    const actualVals = target ? ordered(target.type, target.elements) : [];
    const actualStr = `${label}${fmtList(actualVals)}`;
    const expectedStr = `${label}${fmtList(expectedList)}`;
    actualParts.push(actualStr);
    expectedParts.push(expectedStr);
    if (!target || !eqList(actualVals, expectedList)) mismatches.push(expectedStr);
  };

  const compareScalar = (actual: string, expectedRawVal: string, label: string) => {
    const exp = normScalar(expectedRawVal);
    const act = normScalar(actual);
    actualParts.push(`${label}${actual}`);
    expectedParts.push(`${label}${expectedRawVal}`);
    if (act !== exp) mismatches.push(`${label}${expectedRawVal}`);
  };

  const returnScalar = (): string =>
    result.ret.kind === 'scalar' ? result.ret.value : 'void';
  const returnStructure = () =>
    result.ret.kind === 'structure' ? result.ret : null;

  for (const clause of clauses) {
    if (clause.type === 'named') {
      const struct = result.structures[clause.name];
      if (struct) {
        compareStructure(struct, parseList(clause.raw), `${clause.name}: `);
      } else if (clause.name in result.locals) {
        compareScalar(result.locals[clause.name], clause.raw, `${clause.name}: `);
      } else {
        // unknown variable name — always a failure, surfaced plainly
        actualParts.push(`${clause.name}: ?`);
        expectedParts.push(`${clause.name}: ${clause.raw}`);
        mismatches.push(`${clause.name}: ${clause.raw}`);
      }
    } else if (clause.type === 'return') {
      if (isList(clause.raw)) {
        compareStructure(returnStructure(), parseList(clause.raw), 'return: ');
      } else {
        compareScalar(returnScalar(), clause.raw, 'return: ');
      }
    } else {
      // bare
      if (isList(clause.raw)) {
        const target = returnStructure()
          ?? (result.canvasType ? { type: result.canvasType, elements: result.canvasFinal ?? [] } : null);
        compareStructure(target, parseList(clause.raw), '');
      } else {
        compareScalar(returnScalar(), clause.raw, '');
      }
    }
  }

  return {
    pass: mismatches.length === 0,
    actual: actualParts.join(', '),
    expected: expectedParts.join(', '),
  };
}
