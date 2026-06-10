import type { FrameQueue, Step, VisualElement } from '../../types';
import { MAX_QUEUE } from '../../constants';
import { makeEl } from '../ids';
import { S } from '../../i18n/strings';

export const QUEUE_PSEUDO = {
  enqueue: [
    'void enqueue(int v) {',
    '  if (size == MAX) error;',
    '  arr[rear] = v;',
    '  rear = rear + 1;',
    '}',
  ],
  dequeue: [
    'int dequeue() {',
    '  if (size == 0) error;',
    '  int v = arr[front];',
    '  front = front + 1;',
    '  return v;',
    '}',
  ],
};

const reset = (els: VisualElement[]): VisualElement[] =>
  els.map(e => ({ ...e, state: 'default' }));

const frame = (items: VisualElement[]): FrameQueue => ({ kind: 'queue', items });

const step = (items: VisualElement[], line: number, description: string, error = false): Step =>
  ({ frame: frame(items), line, lineSource: 'pseudo', description, error });

/** items[0] is the front of the queue (drawn at the right edge). */
export function enqueueSteps(items: VisualElement[], value: number): Step[] {
  const base = reset(items);
  const steps: Step[] = [step(base, 1, S.queue.checkFull)];
  if (items.length >= MAX_QUEUE) {
    steps.push(step(base, 1, S.queue.full, true));
    return steps;
  }
  const el = makeEl(value);
  steps.push(step([...base, { ...el, state: 'entering' }], 2, S.queue.placeRear(value)));
  steps.push(step([...base, { ...el, state: 'active' }], 3, S.queue.advanceRear));
  steps.push(step([...base, el], 4, S.queue.enqueued(value)));
  return steps;
}

export function dequeueSteps(items: VisualElement[]): Step[] {
  const base = reset(items);
  const steps: Step[] = [step(base, 1, S.queue.checkEmpty)];
  if (items.length === 0) {
    steps.push(step(base, 1, S.queue.emptyErr, true));
    return steps;
  }
  const [front, ...rest] = base;
  steps.push(step([{ ...front, state: 'active' }, ...rest], 2, S.queue.readFront(front.value)));
  steps.push(step([{ ...front, state: 'exiting' }, ...rest], 3, S.queue.advanceFront));
  steps.push(step(rest, 4, S.queue.dequeued(front.value)));
  return steps;
}
