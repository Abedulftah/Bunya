export type TabKind = 'stack' | 'queue' | 'sort' | 'list';

export type ElemState =
  | 'default'
  | 'active'
  | 'comparing'
  | 'swapping'
  | 'sorted'
  | 'entering'
  | 'exiting';

/** Element values are generic — any type T (numbers, strings, chars). */
export type Value = number | string;

export interface VisualElement {
  id: number;
  value: Value;
  state: ElemState;
}

export interface ListArrow {
  from: number;
  to: number;
}

export interface FrameStack { kind: 'stack'; items: VisualElement[] }
export interface FrameQueue { kind: 'queue'; items: VisualElement[] }
export interface FrameSort { kind: 'sort'; bars: VisualElement[] }
export interface FrameList {
  kind: 'list';
  nodes: VisualElement[];
  arrows: ListArrow[];
  cursorIndex?: number;
}
export type Frame = FrameStack | FrameQueue | FrameSort | FrameList;

export type LineSource = 'pseudo' | 'editor';

export interface Step {
  frame: Frame;
  line?: number;
  lineSource: LineSource;
  description: string;
  error?: boolean;
  /** Editor source line (0-based) — set only on steps compiled from the code editor. */
  editorLine?: number;
  /** Op kind for selecting the right pseudo-code listing during code runs. */
  opKind?: OpKind;
  /** Snapshot of local variables at this step (function mode only). */
  locals?: Record<string, string>;
  /** Return value produced by the function (set on the final return step). */
  returnValue?: string;
  /** Variable name of the structure being operated on (set when running code). */
  structureName?: string;
}

// Note: the queue's Bagrut method names are insert/remove (head to peek);
// internally the op kinds stay 'enqueue'/'dequeue' and both spellings parse.
export type Operation =
  | { kind: 'newStructure'; target: 'stack' | 'queue' | 'list'; typeParam?: string; varName?: string; sourceLine: number }
  | { kind: 'newSort'; bars: number[]; sourceLine: number }
  | { kind: 'push'; value: Value; sourceLine: number }
  | { kind: 'pop'; sourceLine: number }
  | { kind: 'top'; sourceLine: number }
  | { kind: 'enqueue'; value: Value; sourceLine: number }
  | { kind: 'dequeue'; sourceLine: number }
  | { kind: 'head'; sourceLine: number }
  | { kind: 'isEmpty'; target: 'stack' | 'queue'; sourceLine: number }
  | { kind: 'bubbleSort'; sourceLine: number }
  | { kind: 'insertHead'; value: Value; sourceLine: number }
  | { kind: 'insertTail'; value: Value; sourceLine: number }
  | { kind: 'insertAt'; index: number; value: Value; sourceLine: number }
  | { kind: 'deleteHead'; sourceLine: number }
  | { kind: 'deleteTail'; sourceLine: number }
  | { kind: 'deleteAt'; index: number; sourceLine: number };

export type OpKind = Operation['kind'];

export function frameElements(frame: Frame): VisualElement[] {
  switch (frame.kind) {
    case 'stack': return frame.items;
    case 'queue': return frame.items;
    case 'sort': return frame.bars;
    case 'list': return frame.nodes;
  }
}

/**
 * A structure instance is homogeneous, like a generic container with a fixed T:
 * numbers and text never mix. (int vs double strictness is enforced separately
 * for explicitly declared type parameters in the interpreter.)
 */
export function kindOfValue(v: Value): 'number' | 'text' {
  return typeof v === 'string' ? 'text' : 'number';
}

/** Human-readable T of the elements currently in a structure. */
export function typeNameOf(els: VisualElement[]): string {
  if (els.length === 0) return 'T';
  if (typeof els[0].value === 'string') return 'string';
  return els.every(e => Number.isInteger(e.value)) ? 'int' : 'double';
}
