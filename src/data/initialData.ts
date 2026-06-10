import type { TabKind, VisualElement } from '../types';
import { makeEl } from '../engine/ids';

export function randomBars(n: number): VisualElement[] {
  return Array.from({ length: n }, () => makeEl(5 + Math.floor(Math.random() * 56)));
}

export function initialData(): Record<TabKind, VisualElement[]> {
  return {
    stack: [3, 14].map(makeEl),
    queue: [6, 2, 9].map(makeEl),
    sort: randomBars(7),
    list: [4, 17, 9].map(makeEl),
  };
}
