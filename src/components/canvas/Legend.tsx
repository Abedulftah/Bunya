import type { Frame } from '../../types';
import { S } from '../../i18n/strings';

type Key = 'default' | 'entering' | 'active' | 'comparing' | 'swapping' | 'sorted';

const SWATCH: Record<Key, { label: string; cls: string }> = {
  default: { label: S.legend.default, cls: 'bg-slate-600' },
  entering: { label: S.legend.entering, cls: 'bg-sky-400' },
  active: { label: S.legend.active, cls: 'bg-amber-400' },
  comparing: { label: S.legend.comparing, cls: 'bg-red-500' },
  swapping: { label: S.legend.swapping, cls: 'bg-orange-500' },
  sorted: { label: S.legend.sorted, cls: 'bg-emerald-500' },
};

/** Only the colors each structure actually produces, in order. */
const KEYS_BY_KIND: Record<Frame['kind'], Key[]> = {
  stack: ['default', 'entering', 'active'],
  queue: ['default', 'entering', 'active'],
  list: ['default', 'active'],
  sort: ['default', 'active', 'comparing', 'swapping', 'sorted'],
};

export function Legend({ kind }: { kind: Frame['kind'] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
      <span className="font-bold text-slate-300">{S.legend.title}</span>
      {KEYS_BY_KIND[kind].map((key) => {
        const { label, cls } = SWATCH[key];
        return (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded ${cls}`} />
            {label}
          </span>
        );
      })}
    </div>
  );
}
