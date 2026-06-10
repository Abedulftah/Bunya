import { useEffect, useRef, useState } from 'react';
import type { Step } from '../types';
import { BASE_DELAY } from '../constants';

export interface Playback {
  steps: Step[];
  index: number;
  playing: boolean;
  speed: number;
  current: Step | null;
  atEnd: boolean;
  hasSteps: boolean;
  /** Replace the loaded steps and start playing from the first frame. */
  load(steps: Step[]): void;
  play(): void;
  pause(): void;
  stepForward(): void;
  stepBack(): void;
  /** Back to the first frame (or drop finished steps entirely). */
  reset(): void;
  /** Drop all steps (e.g. when switching tabs). */
  clear(): void;
  setSpeed(speed: number): void;
}

/**
 * Scrubbable playback over a precomputed array of immutable steps.
 * `onFinished` fires once per loaded run when the last step is first reached,
 * letting the app commit the final frame as the new resting data.
 */
export function usePlayback(onFinished: (last: Step) => void): Playback {
  const [steps, setSteps] = useState<Step[]>([]);
  const [index, setIndex] = useState(0);
  const [wantsPlay, setWantsPlay] = useState(false);
  const [speed, setSpeed] = useState(1);
  const committedRef = useRef(true);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  });

  const hasSteps = steps.length > 0;
  const atEnd = hasSteps && index >= steps.length - 1;
  const current = hasSteps ? steps[index] : null;
  const playing = wantsPlay && hasSteps && !atEnd;

  const commitIfAtEnd = (all: Step[], idx: number) => {
    if (all.length > 0 && idx >= all.length - 1 && !committedRef.current) {
      committedRef.current = true;
      onFinishedRef.current(all[all.length - 1]);
    }
  };

  // Auto-advance timer; restarts whenever speed changes, so it applies mid-run.
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      const next = Math.min(index + 1, steps.length - 1);
      setIndex(next);
      commitIfAtEnd(steps, next);
    }, BASE_DELAY / speed);
    return () => clearTimeout(t);
  }, [playing, index, speed, steps]);

  return {
    steps,
    index,
    playing,
    speed,
    current,
    atEnd,
    hasSteps,
    load(newSteps) {
      committedRef.current = false;
      setSteps(newSteps);
      setIndex(0);
      setWantsPlay(true);
      commitIfAtEnd(newSteps, 0); // single-step runs are already finished
    },
    play() {
      if (!hasSteps) return;
      if (atEnd) setIndex(0); // replay
      setWantsPlay(true);
    },
    pause() {
      setWantsPlay(false);
    },
    stepForward() {
      setWantsPlay(false);
      const next = Math.min(index + 1, steps.length - 1);
      setIndex(next);
      commitIfAtEnd(steps, next);
    },
    stepBack() {
      setWantsPlay(false);
      setIndex(i => Math.max(i - 1, 0));
    },
    reset() {
      setWantsPlay(false);
      if (committedRef.current) {
        // Run already committed — drop steps so the canvas shows resting data.
        setSteps([]);
      }
      setIndex(0);
    },
    clear() {
      setWantsPlay(false);
      setSteps([]);
      setIndex(0);
      committedRef.current = true;
    },
    setSpeed,
  };
}
