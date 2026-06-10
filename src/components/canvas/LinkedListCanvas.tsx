import { ArrowDown, ArrowUp } from 'lucide-react';
import type { FrameList } from '../../types';
import { MAX_LIST, STATE_STYLES } from '../../constants';
import { S } from '../../i18n/strings';

const NODE_W = 84;
const NODE_H = 52;
const SP = 116; // distance between node left edges; gap between nodes = SP - NODE_W
const R0 = 14;
const INNER_W = 2 * R0 + NODE_W + (MAX_LIST - 1) * SP;
const H = 208;
const Y_TOP = 84;
const Y_MID = Y_TOP + NODE_H / 2;
const GAP = SP - NODE_W;

/** Head is drawn on the RIGHT; the list flows leftward (Arabic reading order). */
const leftOf = (i: number) => INNER_W - R0 - NODE_W - i * SP;

export function LinkedListCanvas({ frame, transMs }: { frame: FrameList; transMs: number }) {
  const { nodes, arrows, cursorIndex } = frame;
  const dur = `${transMs}ms`;
  return (
    <div className="flex justify-center py-2">
      <div className="relative" style={{ width: INNER_W, height: H }} dir="ltr">
        <svg className="pointer-events-none absolute inset-0" width={INNER_W} height={H}>
          <defs>
            <marker id="ll-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L8,4.5 L0,9 z" fill="#94a3b8" />
            </marker>
            <marker id="ll-arrow-amber" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
              <path d="M0,0 L8,4.5 L0,9 z" fill="#fbbf24" />
            </marker>
          </defs>
          {arrows.map(a =>
            a.to === a.from + 1 ? (
              <g
                key={`adj-${a.from}`}
                className="transition-transform"
                style={{
                  transform: `translate(${leftOf(a.to) + NODE_W}px, ${Y_MID}px)`,
                  transitionDuration: dur,
                }}
              >
                <line x1={GAP - 3} y1={0} x2={9} y2={0} stroke="#94a3b8" strokeWidth={2.5} markerEnd="url(#ll-arrow)" />
              </g>
            ) : (
              <path
                key={`byp-${a.from}-${a.to}`}
                className="animate-fadein"
                d={`M ${leftOf(a.from) + 13} ${Y_TOP - 2}
                    Q ${(leftOf(a.from) + leftOf(a.to) + NODE_W) / 2} ${Y_TOP - 56}
                    ${leftOf(a.to) + NODE_W + 5} ${Y_TOP + 8}`}
                fill="none"
                stroke="#fbbf24"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                markerEnd="url(#ll-arrow-amber)"
              />
            ),
          )}
        </svg>

        {nodes.length === 0 && (
          <div className="absolute inset-x-0 text-center text-sm text-slate-500" style={{ top: Y_MID - 10 }}>
            {S.list.empty}
          </div>
        )}

        {nodes.map((el, i) => {
          const dy = el.state === 'entering' ? -84 : el.state === 'exiting' ? 90 : 0;
          const faded = el.state === 'entering' || el.state === 'exiting';
          return (
            <div
              key={el.id}
              className={`absolute flex overflow-hidden rounded-lg border-2 shadow-md transition-all ${STATE_STYLES[el.state]} ${faded ? 'opacity-40' : 'opacity-100'} ${cursorIndex === i ? 'ring-4 ring-amber-300/70' : ''}`}
              style={{
                width: NODE_W,
                height: NODE_H,
                left: leftOf(i),
                top: Y_TOP,
                transform: `translateY(${dy}px)`,
                transitionDuration: dur,
              }}
            >
              <span className="flex w-[26px] items-center justify-center border-r border-black/25 bg-black/25 font-mono text-sm">
                {i === nodes.length - 1 ? '∅' : '•'}
              </span>
              <span className="flex flex-1 items-center justify-center text-lg font-bold">{el.value}</span>
            </div>
          );
        })}

        {nodes.length > 0 && (
          <div
            className="absolute flex flex-col items-center font-mono text-xs font-bold text-emerald-300 transition-all"
            style={{ top: 8, left: leftOf(0) + NODE_W / 2 - 22, width: 44, transitionDuration: dur }}
          >
            head
            <ArrowDown size={13} />
          </div>
        )}
        {nodes.length > 0 && (
          <div
            className="absolute flex flex-col items-center font-mono text-xs font-bold text-sky-300 transition-all"
            style={{ top: 36, left: leftOf(nodes.length - 1) + NODE_W / 2 - 22, width: 44, transitionDuration: dur }}
          >
            tail
            <ArrowDown size={13} />
          </div>
        )}
        {cursorIndex !== undefined && nodes[cursorIndex] && (
          <div
            className="absolute flex flex-col items-center font-mono text-xs font-bold text-amber-300 transition-all"
            style={{
              top: Y_TOP + NODE_H + 8,
              left: leftOf(cursorIndex) + NODE_W / 2 - 22,
              width: 44,
              transitionDuration: dur,
            }}
          >
            <ArrowUp size={13} />
            cur
          </div>
        )}
      </div>
    </div>
  );
}
