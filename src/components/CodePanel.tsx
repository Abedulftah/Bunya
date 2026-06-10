import { useState } from 'react';
import { Play, Undo2 } from 'lucide-react';
import type { ParseError } from '../engine/interpreter';
import { S } from '../i18n/strings';

const LINE_H = 24; // matches leading-6
const PAD_T = 12; // matches p-3

export function CodePanel({
  code,
  onChange,
  onRun,
  onResetCode,
  canRun,
  running,
  activeLine,
  error,
}: {
  code: string;
  onChange: (text: string) => void;
  onRun: () => void;
  onResetCode: () => void;
  canRun: boolean;
  running: boolean;
  activeLine: number | null;
  error: ParseError | null;
}) {
  const [scroll, setScroll] = useState(0);
  const lines = code.split('\n');
  const errorLine = error && error.line >= 0 ? error.line : null;

  const barTop = (line: number) => PAD_T + line * LINE_H - scroll;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-4 py-2.5">
        <h2 className="text-sm font-bold text-white">{S.editor.title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onResetCode}
            disabled={running}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-35"
          >
            <Undo2 size={14} />
            {S.editor.resetCode}
          </button>
          <button
            onClick={onRun}
            disabled={!canRun}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Play size={15} className="-scale-x-100" />
            {running ? S.editor.running : S.editor.run}
          </button>
        </div>
      </div>

      <div className="flex bg-slate-950" dir="ltr" style={{ height: 264 }}>
        <div className="w-10 shrink-0 select-none overflow-hidden bg-slate-900/70 pt-3 text-end font-mono text-xs leading-6 text-slate-500">
          <div style={{ transform: `translateY(-${scroll}px)` }}>
            {lines.map((_, i) => (
              <div
                key={i}
                className={`pe-2 ${i === activeLine ? 'font-bold text-amber-300' : ''} ${i === errorLine ? 'font-bold text-red-400' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {activeLine !== null && activeLine < lines.length && (
            <div
              className="pointer-events-none absolute inset-x-0 border-s-2 border-amber-400 bg-amber-400/15 transition-all duration-200"
              style={{ top: barTop(activeLine), height: LINE_H }}
            />
          )}
          {errorLine !== null && errorLine < lines.length && (
            <div
              className="pointer-events-none absolute inset-x-0 border-s-2 border-red-500 bg-red-500/15"
              style={{ top: barTop(errorLine), height: LINE_H }}
            />
          )}
          <textarea
            value={code}
            onChange={e => onChange(e.target.value)}
            onScroll={e => setScroll(e.currentTarget.scrollTop)}
            readOnly={running}
            spellCheck={false}
            dir="ltr"
            className="absolute inset-0 resize-none overflow-auto whitespace-pre bg-transparent p-3 font-mono text-sm leading-6 text-slate-100 caret-emerald-400 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="border-t border-red-500/30 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300">
          {error.line >= 0 ? S.errors.line(error.line + 1, error.message) : error.message}
        </div>
      )}
    </div>
  );
}
