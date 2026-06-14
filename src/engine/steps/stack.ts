import type { FrameStack, Step, Value, VisualElement } from '../../types';
import { MAX_STACK } from '../../constants';
import { makeEl } from '../ids';
import { S } from '../../i18n/strings';

export const STACK_PSEUDO = {
  push: [
    'void push(T x) {',
    '  Node n = new Node(x);',
    '  n.setNext(this.head);',
    '  this.head = n;',
    '}',
  ],
  pop: [
    'T pop() {',
    '  if (isEmpty()) return null;',
    '  T v = this.head.getValue();',
    '  this.head = this.head.getNext();',
    '  return v;',
    '}',
  ],
  top: [
    'T top() {',
    '  if (isEmpty()) return null;',
    '  return this.head.getValue();',
    '}',
  ],
};

const reset = (els: VisualElement[]): VisualElement[] =>
  els.map(e => ({ ...e, state: 'default' }));

const frame = (items: VisualElement[]): FrameStack => ({ kind: 'stack', items });

const step = (items: VisualElement[], line: number, description: string, error = false): Step =>
  ({ frame: frame(items), line, lineSource: 'pseudo', description, error });

export function pushSteps(items: VisualElement[], value: Value): Step[] {
  const base = reset(items);
  const steps: Step[] = [step(base, 1, S.stack.checkFull)];
  if (items.length >= MAX_STACK) {
    steps.push(step(base, 1, S.stack.full, true));
    return steps;
  }
  const el = makeEl(value);
  steps.push(step([...base, { ...el, state: 'entering' }], 2, S.stack.raiseTop));
  steps.push(step([...base, { ...el, state: 'active' }], 3, S.stack.place(value)));
  steps.push(step([...base, el], 4, S.stack.pushed(value)));
  return steps;
}

/** Bagrut top(): read the top value without removing it. */
export function topSteps(items: VisualElement[]): Step[] {
  const base = reset(items);
  const steps: Step[] = [step(base, 1, S.stack.checkEmpty)];
  if (items.length === 0) {
    steps.push(step(base, 1, S.stack.emptyErrTop, true));
    return steps;
  }
  const t = base[base.length - 1];
  const rest = base.slice(0, -1);
  steps.push(step([...rest, { ...t, state: 'active' }], 2, S.stack.peek(t.value)));
  steps.push(step(base, 3, S.stack.peekDone(t.value)));
  return steps;
}

export function popSteps(items: VisualElement[]): Step[] {
  const base = reset(items);
  const steps: Step[] = [step(base, 1, S.stack.checkEmpty)];
  if (items.length === 0) {
    steps.push(step(base, 1, S.stack.emptyErr, true));
    return steps;
  }
  const top = base[base.length - 1];
  const rest = base.slice(0, -1);
  steps.push(step([...rest, { ...top, state: 'active' }], 2, S.stack.readTop(top.value)));
  steps.push(step([...rest, { ...top, state: 'exiting' }], 3, S.stack.lowerTop));
  steps.push(step(rest, 4, S.stack.popped(top.value)));
  return steps;
}
