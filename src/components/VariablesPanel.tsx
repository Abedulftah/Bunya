import { S } from '../i18n/strings';

export function VariablesPanel({ locals }: { locals: Record<string, string> | undefined }) {
  const entries = locals ? Object.entries(locals) : [];
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-violet-700/50 bg-violet-950/40 px-4 py-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-300">
        {S.fn.localsTitle}
      </h3>
      <div className="flex flex-wrap gap-3">
        {entries.map(([name, val]) => (
          <div key={name} className="flex items-center gap-1.5 rounded-lg bg-violet-900/50 px-3 py-1.5">
            <span className="font-mono text-xs text-violet-300">{name}</span>
            <span className="text-xs text-slate-400">=</span>
            <span className="font-mono text-sm font-bold text-amber-300">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
