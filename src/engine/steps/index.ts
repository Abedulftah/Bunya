import type { Frame, Operation, OpKind, Step, Value, VisualElement } from '../../types';
import { kindOfValue, typeNameOf } from '../../types';
import { S } from '../../i18n/strings';
import { pushSteps, popSteps, topSteps, STACK_PSEUDO } from './stack';
import { enqueueSteps, dequeueSteps, headSteps, QUEUE_PSEUDO } from './queue';
import { bubbleSortSteps, SORT_PSEUDO } from './bubbleSort';
import {
  insertHeadSteps,
  insertTailSteps,
  insertAtSteps,
  deleteHeadSteps,
  deleteTailSteps,
  deleteAtSteps,
  adjacentArrows,
  LIST_PSEUDO,
} from './linkedList';

function frameFor(op: Operation, els: VisualElement[]): Frame {
  switch (op.kind) {
    case 'push':
    case 'pop':
    case 'top':
      return { kind: 'stack', items: els };
    case 'enqueue':
    case 'dequeue':
    case 'head':
      return { kind: 'queue', items: els };
    case 'bubbleSort':
      return { kind: 'sort', bars: els };
    case 'newStructure':
    case 'isEmpty':
      return op.target === 'stack' ? { kind: 'stack', items: els } : { kind: 'queue', items: els };
    default:
      return { kind: 'list', nodes: els, arrows: adjacentArrows(els.length) };
  }
}

/**
 * A structure holds one element type, like a generic container with a fixed T.
 * T is inferred from the elements already inside; inserting a mismatching
 * value fails on the signature line (where T lives).
 */
function typeGuard(data: VisualElement[], op: Operation, value: Value): Step | null {
  if (data.length === 0) return null;
  if (kindOfValue(value) === kindOfValue(data[0].value)) return null;
  return {
    frame: frameFor(op, data),
    line: 0,
    lineSource: 'pseudo',
    description: S.errors.typeMixed(value, typeNameOf(data)),
    error: true,
  };
}

/** Generates the animation steps for one operation, starting from resting data. */
export function generateSteps(data: VisualElement[], op: Operation): Step[] {
  if (op.kind === 'push' || op.kind === 'enqueue' || op.kind === 'insertHead'
    || op.kind === 'insertTail' || op.kind === 'insertAt') {
    const mismatch = typeGuard(data, op, op.value);
    if (mismatch) return [mismatch];
  }
  switch (op.kind) {
    case 'newStructure': return [{
      frame: frameFor(op, []),
      line: 0,
      lineSource: 'pseudo',
      description: S.declCreated(op.typeParam),
    }];
    case 'push': return pushSteps(data, op.value);
    case 'pop': return popSteps(data);
    case 'top': return topSteps(data);
    case 'enqueue': return enqueueSteps(data, op.value);
    case 'dequeue': return dequeueSteps(data);
    case 'head': return headSteps(data);
    case 'isEmpty': {
      const fr = frameFor(op, data);
      return [
        { frame: fr, line: 0, lineSource: 'pseudo', description: S.isEmptyCheck },
        { frame: fr, line: 1, lineSource: 'pseudo', description: S.isEmptyResult(data.length === 0) },
      ];
    }
    case 'bubbleSort': return bubbleSortSteps(data);
    case 'insertHead': return insertHeadSteps(data, op.value);
    case 'insertTail': return insertTailSteps(data, op.value);
    case 'insertAt': return insertAtSteps(data, op.index, op.value);
    case 'deleteHead': return deleteHeadSteps(data);
    case 'deleteTail': return deleteTailSteps(data);
    case 'deleteAt': return deleteAtSteps(data, op.index);
  }
}

export interface PseudoListing {
  title: string;
  lines: string[];
}

export const PSEUDO_BY_OP: Record<OpKind, PseudoListing> = {
  newStructure: {
    title: S.ops.newStructure,
    lines: ['Stack<T> s = new Stack<T>();', 'Queue<T> q = new Queue<T>();'],
  },
  push: { title: S.ops.push, lines: STACK_PSEUDO.push },
  pop: { title: S.ops.pop, lines: STACK_PSEUDO.pop },
  top: { title: S.ops.top, lines: STACK_PSEUDO.top },
  enqueue: { title: S.ops.enqueue, lines: QUEUE_PSEUDO.insert },
  dequeue: { title: S.ops.dequeue, lines: QUEUE_PSEUDO.remove },
  head: { title: S.ops.head, lines: QUEUE_PSEUDO.head },
  isEmpty: { title: S.ops.isEmpty, lines: ['boolean isEmpty() {', '  return size == 0;', '}'] },
  bubbleSort: { title: S.ops.bubbleSort, lines: SORT_PSEUDO },
  insertHead: { title: S.ops.insertHead, lines: LIST_PSEUDO.insertHead },
  insertTail: { title: S.ops.insertTail, lines: LIST_PSEUDO.insertTail },
  insertAt: { title: S.ops.insertAt, lines: LIST_PSEUDO.insertAt },
  deleteHead: { title: S.ops.deleteHead, lines: LIST_PSEUDO.deleteHead },
  deleteTail: { title: S.ops.deleteTail, lines: LIST_PSEUDO.deleteTail },
  deleteAt: { title: S.ops.deleteAt, lines: LIST_PSEUDO.deleteAt },
};
