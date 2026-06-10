import type { Step } from '../types';
import { S } from '../i18n/strings';

export function StatusBar({ step }: { step: Step | null }) {
  const error = step?.error;
  return (
    <div
      className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
        error
          ? 'border-red-500/40 bg-red-500/15 text-red-300'
          : step
            ? 'border-slate-700 bg-slate-800 text-emerald-200'
            : 'border-slate-700 bg-slate-800 text-slate-400'
      }`}
      role="status"
    >
      {step ? step.description : S.statusIdle}
    </div>
  );
}
