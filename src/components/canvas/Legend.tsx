import { S } from '../../i18n/strings';

const ITEMS = [
  { label: S.legend.default, cls: 'bg-slate-600' },
  { label: S.legend.entering, cls: 'bg-sky-400' },
  { label: S.legend.active, cls: 'bg-amber-400' },
  { label: S.legend.comparing, cls: 'bg-red-500' },
  { label: S.legend.swapping, cls: 'bg-orange-500' },
  { label: S.legend.sorted, cls: 'bg-emerald-500' },
];

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
      <span className="font-bold text-slate-300">{S.legend.title}</span>
      {ITEMS.map(({ label, cls }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded ${cls}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
