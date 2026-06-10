import type { ElemState } from './types';

export const BASE_DELAY = 900;
export const SPEED_MIN = 0.25;
export const SPEED_MAX = 4;
export const SPEED_STEP = 0.25;

export const MAX_STACK = 8;
export const MAX_QUEUE = 7;
export const MAX_LIST = 6;
export const SORT_MIN_SIZE = 5;
export const SORT_MAX_SIZE = 10;
export const MAX_VALUE = 99;

/** Element box colors per visual state (full class names so Tailwind sees them). */
export const STATE_STYLES: Record<ElemState, string> = {
  default: 'bg-slate-600 border-slate-400 text-white',
  active: 'bg-amber-400 border-amber-200 text-slate-900',
  comparing: 'bg-red-500 border-red-300 text-white',
  swapping: 'bg-orange-500 border-orange-300 text-white',
  sorted: 'bg-emerald-500 border-emerald-300 text-white',
  entering: 'bg-sky-400 border-sky-200 text-slate-900',
  exiting: 'bg-slate-600 border-slate-400 text-white',
};

/** Transition duration for canvas movements, scaled to playback speed. */
export function transitionMs(speed: number): number {
  return Math.round(Math.min(600, Math.max(120, (BASE_DELAY / speed) * 0.55)));
}
