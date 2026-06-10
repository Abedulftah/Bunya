import { BarChart3, Layers, Link2, MoveHorizontal } from 'lucide-react';
import type { TabKind } from '../types';
import { S } from '../i18n/strings';

const TABS: { kind: TabKind; icon: typeof Layers }[] = [
  { kind: 'stack', icon: Layers },
  { kind: 'queue', icon: MoveHorizontal },
  { kind: 'sort', icon: BarChart3 },
  { kind: 'list', icon: Link2 },
];

export function TabBar({ tab, onSelect }: { tab: TabKind; onSelect: (t: TabKind) => void }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map(({ kind, icon: Icon }) => {
        const active = tab === kind;
        return (
          <button
            key={kind}
            onClick={() => onSelect(kind)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              active
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Icon size={18} />
            <span className="text-start leading-tight">
              {S.tabs[kind]}
              <span className="block text-[10px] font-mono font-normal opacity-75" dir="ltr">
                {S.tabsEn[kind]}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
