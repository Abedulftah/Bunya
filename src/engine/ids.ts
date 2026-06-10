import type { Value, VisualElement } from '../types';

let counter = 0;

export function nextId(): number {
  return ++counter;
}

export function makeEl(value: Value): VisualElement {
  return { id: nextId(), value, state: 'default' };
}
