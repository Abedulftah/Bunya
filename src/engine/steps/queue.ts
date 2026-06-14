import type { FrameQueue, Step, Value, VisualElement } from '../../types';
import { MAX_QUEUE } from '../../constants';
import { makeEl } from '../ids';
import { S } from '../../i18n/strings';

// Method names: add/remove/head (insert/enqueue/dequeue are accepted aliases).
// The queue is a singly-linked list of Node<T> with head + tail (instruction.md).
export const QUEUE_PSEUDO = {
  add: [
    'void add(T x) {',                     // 0
    '  Node n = new Node(x);',             // 1
    '  if (this.isEmpty())',               // 2
    '    this.head = n;',                  // 3
    '  else',                              // 4
    '    this.tail.setNext(n);',           // 5
    '  this.tail = n;',                    // 6
    '}',                                   // 7
  ],
  remove: [
    'T remove() {',                        // 0
    '  if (this.isEmpty()) return null;',  // 1
    '  T v = this.head.getValue();',       // 2
    '  this.head = this.head.getNext();',  // 3
    '  if (this.head == null)',            // 4
    '    this.tail = null;',               // 5
    '  return v;',                         // 6
    '}',                                   // 7
  ],
  head: [
    'T head() {',                          // 0
    '  if (this.isEmpty()) return null;',  // 1
    '  return this.head.getValue();',      // 2
    '}',                                   // 3
  ],
};

const reset = (els: VisualElement[]): VisualElement[] =>
  els.map(e => ({ ...e, state: 'default' }));

const frame = (items: VisualElement[]): FrameQueue => ({ kind: 'queue', items });

const step = (items: VisualElement[], line: number, description: string, error = false): Step =>
  ({ frame: frame(items), line, lineSource: 'pseudo', description, error });

/**
 * add(x): append a new Node at the tail. items[0] is the front/head (drawn at
 * the right edge); a new element joins at the rear/tail (left edge).
 */
export function enqueueSteps(items: VisualElement[], value: Value): Step[] {
  const base = reset(items);
  // The MAX cap is a visualizer constraint (the linked list itself is unbounded),
  // overlaid on the new-node line — same as the stack.
  const steps: Step[] = [step(base, 1, S.queue.checkFull)];
  if (items.length >= MAX_QUEUE) {
    steps.push(step(base, 1, S.queue.full, true));
    return steps;
  }
  const empty = items.length === 0;
  const el = makeEl(value);
  steps.push(step([...base, { ...el, state: 'entering' }], 1, S.queue.newNode(value)));
  // empty → this.head = n (line 3); otherwise this.tail.setNext(n) (line 5)
  steps.push(step([...base, { ...el, state: 'active' }],
    empty ? 3 : 5, empty ? S.queue.linkHead : S.queue.linkTail));
  steps.push(step([...base, { ...el, state: 'active' }], 6, S.queue.advanceTail));
  steps.push(step([...base, el], 7, S.queue.enqueued(value)));
  return steps;
}

/** Bagrut head(): read the head value without removing it. */
export function headSteps(items: VisualElement[]): Step[] {
  const base = reset(items);
  const steps: Step[] = [step(base, 1, S.queue.checkEmpty)];
  if (items.length === 0) {
    steps.push(step(base, 1, S.queue.emptyErrHead, true));
    return steps;
  }
  const [front, ...rest] = base;
  steps.push(step([{ ...front, state: 'active' }, ...rest], 2, S.queue.peek(front.value)));
  steps.push(step(base, 2, S.queue.peekDone(front.value)));
  return steps;
}

/** remove(): unlink and return the head node. */
export function dequeueSteps(items: VisualElement[]): Step[] {
  const base = reset(items);
  const steps: Step[] = [step(base, 1, S.queue.checkEmpty)];
  if (items.length === 0) {
    steps.push(step(base, 1, S.queue.emptyErr, true));
    return steps;
  }
  const [front, ...rest] = base;
  steps.push(step([{ ...front, state: 'active' }, ...rest], 2, S.queue.readFront(front.value)));
  steps.push(step([{ ...front, state: 'exiting' }, ...rest], 3, S.queue.advanceHead));
  // if the queue is now empty, this.head == null → this.tail = null (lines 4–5)
  if (rest.length === 0) steps.push(step(rest, 5, S.queue.tailReset));
  steps.push(step(rest, 6, S.queue.dequeued(front.value)));
  return steps;
}
