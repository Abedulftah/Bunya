import { MoveRight } from 'lucide-react';
import type { FrameQueue } from '../../types';
import { MAX_QUEUE, STATE_STYLES } from '../../constants';
import { S } from '../../i18n/strings';

const ITEM_W = 72;
const SP = 86;
const INNER_W = 28 + MAX_QUEUE * SP;
const H = 172;

/**
 * LTR island inside the RTL page: the spec mandates rear on the left and
 * front (the exit) on the right. items[0] is the front, drawn at the right edge.
 */
export function QueueCanvas({ frame, transMs }: { frame: FrameQueue; transMs: number }) {
  const items = frame.items;
  return (
    <div className="flex justify-center py-2" dir="ltr">
      <div className="relative" style={{ width: INNER_W, height: H }}>
        {/* open-ended track */}
        <div className="absolute inset-x-0 border-y-4 border-slate-500" style={{ top: 46, height: 84 }} />
        <span className="absolute left-3 top-2 text-xs font-bold text-sky-300">{S.queue.rear}</span>
        <span className="absolute right-3 top-2 text-xs font-bold text-amber-300">{S.queue.front}</span>
        <span className="absolute bottom-2 right-3 flex items-center gap-1 text-xs text-slate-400">
          {S.queue.exitDir}
          <MoveRight size={14} />
        </span>
        {items.length === 0 && (
          <div className="absolute inset-x-0 top-[72px] text-center text-sm text-slate-500">
            {S.queue.empty}
          </div>
        )}
        {items.map((el, i) => {
          const dx = el.state === 'entering' ? -80 : el.state === 'exiting' ? 100 : 0;
          const faded = el.state === 'entering' || el.state === 'exiting';
          return (
            <div
              key={el.id}
              className={`absolute flex h-16 items-center justify-center rounded-lg border-2 font-bold shadow-md transition-all ${String(el.value).length <= 3 ? 'text-lg' : 'text-sm'} ${STATE_STYLES[el.state]} ${faded ? 'opacity-0' : 'opacity-100'}`}
              style={{
                width: ITEM_W,
                top: 56,
                right: 18 + i * SP,
                transform: `translateX(${dx}px)`,
                transitionDuration: `${transMs}ms`,
              }}
            >
              {el.value}
            </div>
          );
        })}
      </div>
    </div>
  );
}
