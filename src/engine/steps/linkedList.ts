import type { FrameList, ListArrow, Step, VisualElement } from '../../types';
import { MAX_LIST } from '../../constants';
import { makeEl } from '../ids';
import { S } from '../../i18n/strings';

export const LIST_PSEUDO = {
  insertHead: [
    'void insertHead(int v) {',
    '  Node n = new Node(v);',
    '  n.next = head;',
    '  head = n;',
    '}',
  ],
  insertTail: [
    'void insertTail(int v) {',
    '  Node n = new Node(v);',
    '  tail.next = n;',
    '  tail = n;',
    '}',
  ],
  insertAt: [
    'void insertAt(int i, int v) {',
    '  Node cur = head;',
    '  repeat (i - 1) times:',
    '    cur = cur.next;',
    '  Node n = new Node(v);',
    '  n.next = cur.next;',
    '  cur.next = n;',
    '}',
  ],
  deleteHead: [
    'void deleteHead() {',
    '  if (head == null) error;',
    '  head = head.next;',
    '}',
  ],
  deleteTail: [
    'void deleteTail() {',
    '  if (head == null) error;',
    '  Node cur = head;',
    '  while (cur.next.next != null)',
    '    cur = cur.next;',
    '  cur.next = null;',
    '}',
  ],
  deleteAt: [
    'void deleteAt(int i) {',
    '  Node cur = head;',
    '  repeat (i - 1) times:',
    '    cur = cur.next;',
    '  cur.next = cur.next.next;',
    '}',
  ],
};

const reset = (els: VisualElement[]): VisualElement[] =>
  els.map(e => ({ ...e, state: 'default' }));

/** Arrows between every adjacent pair of a list with `len` nodes. */
export const adjacentArrows = (len: number): ListArrow[] =>
  Array.from({ length: Math.max(0, len - 1) }, (_, i) => ({ from: i, to: i + 1 }));

const notTouching = (arrows: ListArrow[], idx: number): ListArrow[] =>
  arrows.filter(a => a.from !== idx && a.to !== idx);

interface ListStepOpts {
  cursor?: number;
  error?: boolean;
}

function step(
  nodes: VisualElement[],
  arrows: ListArrow[],
  line: number,
  description: string,
  opts: ListStepOpts = {},
): Step {
  const frame: FrameList = { kind: 'list', nodes, arrows, cursorIndex: opts.cursor };
  return { frame, line, lineSource: 'pseudo', description, error: opts.error };
}

export function insertHeadSteps(nodes: VisualElement[], value: number): Step[] {
  const base = reset(nodes);
  const L = base.length;
  if (L >= MAX_LIST) {
    return [step(base, adjacentArrows(L), 1, S.list.full, { error: true })];
  }
  const el = makeEl(value);
  const withNew = (state: VisualElement['state']) => [{ ...el, state }, ...base];
  return [
    // old nodes shift; arrows exist only among them (indices 1..L)
    step(withNew('entering'), adjacentArrows(L + 1).filter(a => a.from >= 1), 1, S.list.newNode(value)),
    step(withNew('active'), adjacentArrows(L + 1), 2, S.list.pointNext),
    step(withNew('active'), adjacentArrows(L + 1), 3, S.list.updateHead),
    step(withNew('default'), adjacentArrows(L + 1), 4, S.list.inserted(value)),
  ];
}

export function insertTailSteps(nodes: VisualElement[], value: number): Step[] {
  const base = reset(nodes);
  const L = base.length;
  if (L === 0) return insertHeadSteps(nodes, value);
  if (L >= MAX_LIST) {
    return [step(base, adjacentArrows(L), 1, S.list.full, { error: true })];
  }
  const el = makeEl(value);
  const withNew = (state: VisualElement['state']) => [...base, { ...el, state }];
  return [
    step(withNew('entering'), adjacentArrows(L), 1, S.list.newNode(value)),
    step(withNew('active'), adjacentArrows(L + 1), 2, S.list.linkTailNext),
    step(withNew('active'), adjacentArrows(L + 1), 3, S.list.updateTail),
    step(withNew('default'), adjacentArrows(L + 1), 4, S.list.inserted(value)),
  ];
}

export function insertAtSteps(nodes: VisualElement[], index: number, value: number): Step[] {
  const base = reset(nodes);
  const L = base.length;
  if (index < 0 || index > L) {
    return [step(base, adjacentArrows(L), 0, S.list.badIndex(index), { error: true })];
  }
  if (L >= MAX_LIST) {
    return [step(base, adjacentArrows(L), 0, S.list.full, { error: true })];
  }
  const el = makeEl(value);
  const withNew = (state: VisualElement['state']) => [
    ...base.slice(0, index),
    { ...el, state },
    ...base.slice(index),
  ];

  if (index === 0) {
    // Inserting at the head: no traversal needed.
    return [
      step(withNew('entering'), adjacentArrows(L + 1).filter(a => a.from >= 1), 4, S.list.newNode(value)),
      step(withNew('active'), adjacentArrows(L + 1), 5, S.list.pointNext),
      step(withNew('active'), adjacentArrows(L + 1), 6, S.list.updateHead),
      step(withNew('default'), adjacentArrows(L + 1), 7, S.list.inserted(value)),
    ];
  }

  const steps: Step[] = [step(base, adjacentArrows(L), 1, S.list.cursorStart, { cursor: 0 })];
  for (let k = 1; k <= index - 1; k++) {
    steps.push(step(base, adjacentArrows(L), 3, S.list.cursorMove(k), { cursor: k }));
  }

  const cur = index - 1;
  const hasOldNext = index < L; // after insertion the old next sits at index+1
  const full = adjacentArrows(L + 1);
  const bypass: ListArrow[] = hasOldNext ? [{ from: cur, to: index + 1 }] : [];

  // new node appears in the gap; cur still points to the old next (curved bypass)
  steps.push(step(withNew('entering'), [...notTouching(full, index), ...bypass], 4, S.list.newNode(value), { cursor: cur }));
  // n.next = cur.next — the new node links forward, cur's old link still in place
  steps.push(step(
    withNew('active'),
    [...notTouching(full, index), ...(hasOldNext ? [{ from: index, to: index + 1 }] : []), ...bypass],
    5,
    S.list.pointNext,
    { cursor: cur },
  ));
  // cur.next = n — bypass disappears, chain is complete
  steps.push(step(withNew('active'), full, 6, S.list.linkPrev, { cursor: cur }));
  steps.push(step(withNew('default'), full, 7, S.list.inserted(value)));
  return steps;
}

export function deleteHeadSteps(nodes: VisualElement[]): Step[] {
  const base = reset(nodes);
  const L = base.length;
  const steps: Step[] = [step(base, adjacentArrows(L), 1, S.list.checkEmpty)];
  if (L === 0) {
    steps.push(step(base, [], 1, S.list.emptyErr, { error: true }));
    return steps;
  }
  const head = base[0];
  const mark = (state: VisualElement['state']) => [{ ...head, state }, ...base.slice(1)];
  steps.push(step(mark('active'), adjacentArrows(L), 2, S.list.headAdvance));
  steps.push(step(mark('exiting'), notTouching(adjacentArrows(L), 0), 2, S.list.removeNode(head.value)));
  steps.push(step(base.slice(1), adjacentArrows(L - 1), 3, S.list.deleted(head.value)));
  return steps;
}

export function deleteTailSteps(nodes: VisualElement[]): Step[] {
  const base = reset(nodes);
  const L = base.length;
  const steps: Step[] = [step(base, adjacentArrows(L), 1, S.list.checkEmpty)];
  if (L === 0) {
    steps.push(step(base, [], 1, S.list.emptyErr, { error: true }));
    return steps;
  }
  const tail = base[L - 1];
  if (L === 1) {
    steps.push(step([{ ...tail, state: 'active' }], [], 2, S.list.onlyNode));
    steps.push(step([{ ...tail, state: 'exiting' }], [], 5, S.list.cutTail));
    steps.push(step([], [], 6, S.list.deleted(tail.value)));
    return steps;
  }
  steps.push(step(base, adjacentArrows(L), 2, S.list.cursorStart, { cursor: 0 }));
  for (let k = 1; k <= L - 2; k++) {
    steps.push(step(base, adjacentArrows(L), 4, S.list.cursorMove(k), { cursor: k }));
  }
  const cut = adjacentArrows(L).filter(a => a.to !== L - 1);
  const mark = (state: VisualElement['state']) => [...base.slice(0, -1), { ...tail, state }];
  steps.push(step(mark('active'), cut, 5, S.list.cutTail, { cursor: L - 2 }));
  steps.push(step(mark('exiting'), cut, 5, S.list.removeNode(tail.value), { cursor: L - 2 }));
  steps.push(step(base.slice(0, -1), adjacentArrows(L - 1), 6, S.list.deleted(tail.value)));
  return steps;
}

export function deleteAtSteps(nodes: VisualElement[], index: number): Step[] {
  const base = reset(nodes);
  const L = base.length;
  if (L === 0) {
    return [
      step(base, [], 1, S.list.checkEmpty),
      step(base, [], 1, S.list.emptyErr, { error: true }),
    ];
  }
  if (index < 0 || index >= L) {
    return [step(base, adjacentArrows(L), 0, S.list.badIndex(index), { error: true })];
  }
  const victim = base[index];
  const mark = (state: VisualElement['state']) => [
    ...base.slice(0, index),
    { ...victim, state },
    ...base.slice(index + 1),
  ];
  const after = [...base.slice(0, index), ...base.slice(index + 1)];

  if (index === 0) {
    return [
      step(base, adjacentArrows(L), 1, S.list.cursorStart, { cursor: 0 }),
      step(mark('active'), adjacentArrows(L), 4, S.list.removeNode(victim.value)),
      step(mark('exiting'), notTouching(adjacentArrows(L), 0), 4, S.list.headAdvance),
      step(after, adjacentArrows(L - 1), 5, S.list.deleted(victim.value)),
    ];
  }

  const steps: Step[] = [step(base, adjacentArrows(L), 1, S.list.cursorStart, { cursor: 0 })];
  for (let k = 1; k <= index - 1; k++) {
    steps.push(step(base, adjacentArrows(L), 3, S.list.cursorMove(k), { cursor: k }));
  }
  const cur = index - 1;
  const full = adjacentArrows(L);
  const hasNext = index < L - 1;
  const bypass: ListArrow[] = hasNext ? [{ from: cur, to: index + 1 }] : [];

  steps.push(step(mark('active'), full, 4, S.list.removeNode(victim.value), { cursor: cur }));
  // cur.next jumps over the victim; the victim's own arrow is still drawn
  steps.push(step(
    mark('active'),
    [...full.filter(a => !(a.from === cur && a.to === index)), ...bypass],
    4,
    S.list.bypass,
    { cursor: cur },
  ));
  steps.push(step(mark('exiting'), [...notTouching(full, index), ...bypass], 4, S.list.removeNode(victim.value), { cursor: cur }));
  steps.push(step(after, adjacentArrows(L - 1), 5, S.list.deleted(victim.value)));
  return steps;
}
