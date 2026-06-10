import type { FrameSort } from '../../types';
import { STATE_STYLES } from '../../constants';

const BAR_W = 36;
const SP = 46;
const H = 272;

export function SortCanvas({ frame, transMs }: { frame: FrameSort; transMs: number }) {
  const bars = frame.bars;
  const width = 28 + bars.length * SP;
  return (
    <div className="flex justify-center py-2" dir="ltr">
      <div className="relative" style={{ width, height: H }}>
        <div className="absolute inset-x-1 bottom-[30px] h-1 rounded bg-slate-600" />
        {bars.map((el, i) => (
          <div key={el.id}>
            <div
              className={`absolute rounded-t-md border-2 border-b-0 transition-all ${STATE_STYLES[el.state]}`}
              style={{
                width: BAR_W,
                left: 16 + i * SP,
                bottom: 32,
                height: 18 + el.value * 2.1,
                transitionDuration: `${transMs}ms`,
              }}
            />
            <div
              className="absolute bottom-1 text-center font-mono text-sm font-bold text-slate-300 transition-all"
              style={{ width: BAR_W, left: 16 + i * SP, transitionDuration: `${transMs}ms` }}
            >
              {el.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
