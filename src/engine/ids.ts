import type { VisualElement } from '../types';

let counter = 0;

export function nextId(): number {
  return ++counter;
}

export function makeEl(value: number): VisualElement {
  return { id: nextId(), value, state: 'default' };
}
