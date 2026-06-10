import { ArrowLeft } from 'lucide-react';
import type { FrameStack } from '../../types';
import { MAX_STACK, STATE_STYLES } from '../../constants';
import { S } from '../../i18n/strings';

const SLOT = 52;
const BOX_W = 128;
const H = MAX_STACK * SLOT + 24;

export function StackCanvas({ frame, transMs }: { frame: FrameStack; transMs: number }) {
  const items = frame.items;
  return (
    <div className="flex justify-center py-4">
      <div className="relative" style={{ width: BOX_W + 110, height: H }}>
        {/* container walls: open top, closed bottom */}
        <div
          className="absolute bottom-0 left-0 rounded-b-xl border-x-4 border-b-4 border-slate-500"
          style={{ width: BOX_W, height: H }}
        />
        {items.length === 0 && (
          <div className="absolute bottom-6 left-0 text-center text-sm text-slate-500" style={{ width: BOX_W }}>
            {S.stack.empty}
          </div>
        )}
        {items.map((el, i) => {
          const dy = el.state === 'entering' ? -90 : el.state === 'exiting' ? -120 : 0;
          const faded = el.state === 'entering' || el.state === 'exiting';
          return (
            <div
              key={el.id}
              className={`absolute flex h-11 w-24 items-center justify-center rounded-lg border-2 font-bold shadow-md transition-all ${String(el.value).length <= 3 ? 'text-lg' : 'text-sm'} ${STATE_STYLES[el.state]} ${faded ? 'opacity-0' : 'opacity-100'}`}
              style={{
                bottom: 10 + i * SLOT,
                left: (BOX_W - 96) / 2,
                transform: `translateY(${dy}px)`,
                transitionDuration: `${transMs}ms`,
              }}
              dir="ltr"
            >
              {el.value}
            </div>
          );
        })}
        {items.length > 0 && (
          <div
            className="absolute flex items-center gap-1 text-xs font-bold text-amber-300 transition-all"
            style={{ bottom: 20 + (items.length - 1) * SLOT, left: BOX_W + 10, transitionDuration: `${transMs}ms` }}
          >
            <span>{S.stack.top}</span>
            <ArrowLeft size={14} />
          </div>
        )}
      </div>
    </div>
  );
}
