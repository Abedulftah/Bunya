import type { Operation, OpKind, Step, VisualElement } from '../../types';
import { makeEl } from '../ids';
import { S } from '../../i18n/strings';
import { pushSteps, popSteps, STACK_PSEUDO } from './stack';
import { enqueueSteps, dequeueSteps, QUEUE_PSEUDO } from './queue';
import { bubbleSortSteps, SORT_PSEUDO } from './bubbleSort';
import {
  insertHeadSteps,
  insertTailSteps,
  insertAtSteps,
  deleteHeadSteps,
  deleteTailSteps,
  deleteAtSteps,
  LIST_PSEUDO,
} from './linkedList';

/** Generates the animation steps for one operation, starting from resting data. */
export function generateSteps(data: VisualElement[], op: Operation): Step[] {
  switch (op.kind) {
    case 'push': return pushSteps(data, op.value);
    case 'pop': return popSteps(data);
    case 'enqueue': return enqueueSteps(data, op.value);
    case 'dequeue': return dequeueSteps(data);
    case 'bubbleSort': return bubbleSortSteps(data);
    case 'setArray': return [{
      frame: { kind: 'sort', bars: op.values.map(makeEl) },
      line: 0,
      lineSource: 'pseudo',
      description: S.sort.created,
    }];
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
  push: { title: S.ops.push, lines: STACK_PSEUDO.push },
  pop: { title: S.ops.pop, lines: STACK_PSEUDO.pop },
  enqueue: { title: S.ops.enqueue, lines: QUEUE_PSEUDO.enqueue },
  dequeue: { title: S.ops.dequeue, lines: QUEUE_PSEUDO.dequeue },
  bubbleSort: { title: S.ops.bubbleSort, lines: SORT_PSEUDO },
  setArray: { title: S.ops.setArray, lines: ['int[] arr = { ... };'] },
  insertHead: { title: S.ops.insertHead, lines: LIST_PSEUDO.insertHead },
  insertTail: { title: S.ops.insertTail, lines: LIST_PSEUDO.insertTail },
  insertAt: { title: S.ops.insertAt, lines: LIST_PSEUDO.insertAt },
  deleteHead: { title: S.ops.deleteHead, lines: LIST_PSEUDO.deleteHead },
  deleteTail: { title: S.ops.deleteTail, lines: LIST_PSEUDO.deleteTail },
  deleteAt: { title: S.ops.deleteAt, lines: LIST_PSEUDO.deleteAt },
};
