import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import type { Playback } from '../engine/usePlayback';
import { SPEED_MAX, SPEED_MIN, SPEED_STEP } from '../constants';
import { S } from '../i18n/strings';

function IconButton({
  title,
  onClick,
  disabled,
  children,
  emphasis = false,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        emphasis
          ? 'bg-emerald-500 text-white hover:bg-emerald-400'
          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
      }`}
    >
      {children}
    </button>
  );
}

export function PlaybackControls({ pb }: { pb: Playback }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3">
      <div className="flex items-center gap-2">
        {/* In RTL "forward" points left, so the skip icons are mirrored */}
        <IconButton title={S.controls.stepB} onClick={pb.stepBack} disabled={!pb.hasSteps || pb.index === 0}>
          <SkipBack size={18} className="-scale-x-100" />
        </IconButton>
        {pb.playing ? (
          <IconButton title={S.controls.pause} onClick={pb.pause} emphasis>
            <Pause size={20} />
          </IconButton>
        ) : (
          <IconButton
            title={pb.atEnd ? S.controls.replay : S.controls.play}
            onClick={pb.play}
            disabled={!pb.hasSteps}
            emphasis
          >
            <Play size={20} className="-scale-x-100" />
          </IconButton>
        )}
        <IconButton title={S.controls.stepF} onClick={pb.stepForward} disabled={!pb.hasSteps || pb.atEnd}>
          <SkipForward size={18} className="-scale-x-100" />
        </IconButton>
        <IconButton title={S.controls.reset} onClick={pb.reset} disabled={!pb.hasSteps}>
          <RotateCcw size={17} />
        </IconButton>
      </div>

      <div className="flex min-w-44 flex-1 items-center gap-2 text-xs text-slate-400">
        <span>{S.controls.slow}</span>
        <input
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={SPEED_STEP}
          value={pb.speed}
          onChange={e => pb.setSpeed(Number(e.target.value))}
          className="flex-1 accent-emerald-500"
          title={S.controls.speed}
        />
        <span>{S.controls.fast}</span>
        <span className="w-10 text-center font-mono text-slate-300" dir="ltr">×{pb.speed}</span>
      </div>

      {pb.hasSteps && (
        <span className="font-mono text-xs text-slate-400">
          {S.controls.step(pb.index + 1, pb.steps.length)}
        </span>
      )}
    </div>
  );
}
