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
}

export type Operation =
  | { kind: 'push'; value: Value; sourceLine: number }
  | { kind: 'pop'; sourceLine: number }
  | { kind: 'enqueue'; value: Value; sourceLine: number }
  | { kind: 'dequeue'; sourceLine: number }
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
