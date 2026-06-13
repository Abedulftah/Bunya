import type { ElemState, FrameSort, Step, VisualElement } from '../../types';
import { S } from '../../i18n/strings';

export const SORT_PSEUDO = [
  'void bubbleSort(int[] arr) {',
  '  for (i = 0; i < n-1; i++)',
  '    for (j = 0; j < n-1-i; j++)',
  '      if (arr[j] > arr[j+1])',
  '        swap(arr, j, j+1);',
  '}',
];

const frame = (bars: VisualElement[]): FrameSort => ({ kind: 'sort', bars });

/** Generates the full bubble-sort trace as scrubbable frames. */
export function bubbleSortSteps(bars: VisualElement[]): Step[] {
  const work = bars.map(e => ({ ...e, state: 'default' as ElemState }));
  const n = work.length;
  let sortedFrom = n; // indices >= sortedFrom are locked in place

  const snap = (mark: (index: number) => ElemState | null): VisualElement[] =>
    work.map((e, i) => ({
      ...e,
      state: mark(i) ?? (i >= sortedFrom ? 'sorted' : 'default'),
    }));

  const steps: Step[] = [
    { frame: frame(snap(() => null)), line: 1, lineSource: 'pseudo', description: S.sort.start(n) },
  ];

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      const a = Number(work[j].value);
      const b = Number(work[j + 1].value);
      // inner for (line 2): the loop selects the pair at positions j and j+1
      steps.push({
        frame: frame(snap(k => (k === j || k === j + 1 ? 'active' : null))),
        line: 2,
        lineSource: 'pseudo',
        description: S.sort.scan(j),
      });
      // if (line 3): compare the pair
      steps.push({
        frame: frame(snap(k => (k === j || k === j + 1 ? 'comparing' : null))),
        line: 3,
        lineSource: 'pseudo',
        description: S.sort.compare(a, b),
      });
      if (a > b) {
        [work[j], work[j + 1]] = [work[j + 1], work[j]];
        steps.push({
          frame: frame(snap(k => (k === j || k === j + 1 ? 'swapping' : null))),
          line: 4,
          lineSource: 'pseudo',
          description: S.sort.swap(a, b),
        });
      }
    }
    sortedFrom = n - 1 - i;
    steps.push({
      frame: frame(snap(() => null)),
      line: 1,
      lineSource: 'pseudo',
      description: S.sort.locked(work[sortedFrom].value),
    });
  }

  sortedFrom = 0;
  steps.push({
    frame: frame(snap(() => null)),
    line: 5,
    lineSource: 'pseudo',
    description: S.sort.done,
  });
  return steps;
}
