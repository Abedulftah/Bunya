import { useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import type { Operation, TabKind, Value } from '../../types';
import { MAX_VALUE_LEN, SORT_MAX_SIZE, SORT_MIN_SIZE } from '../../constants';
import { S } from '../../i18n/strings';

type Variant = 'add' | 'remove' | 'run';

const VARIANT_CLS: Record<Variant, string> = {
  add: 'bg-emerald-600 hover:bg-emerald-500',
  remove: 'bg-rose-600 hover:bg-rose-500',
  run: 'bg-sky-600 hover:bg-sky-500',
};

function OpButton({
  en,
  ar,
  variant,
  disabled,
  onClick,
  icon,
}: {
  en?: string;
  ar: string;
  variant: Variant;
  disabled: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${VARIANT_CLS[variant]}`}
    >
      {icon}
      {en && (
        <span className="font-mono text-xs" dir="ltr">
          {en}
        </span>
      )}
      <span>{ar}</span>
    </button>
  );
}

function NumInput({
  label,
  value,
  onChange,
  max = 99,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max?: number;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-300">
      {label}
      <input
        type="number"
        min={0}
        max={max}
        dir="ltr"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-16 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-center font-mono text-sm text-white outline-none focus:border-emerald-400"
      />
    </label>
  );
}

/** Generic value input — the structures accept any type T (numbers or text). */
function ValueInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-300">
      {label}
      <input
        type="text"
        dir="auto"
        maxLength={MAX_VALUE_LEN}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-20 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-center font-mono text-sm text-white outline-none focus:border-emerald-400"
      />
    </label>
  );
}

const isInt = (s: string, max = 99) => /^\d+$/.test(s.trim()) && parseInt(s, 10) <= max;

/** Numeric-looking input (int or decimal) becomes a number, anything else stays text — like a generic T. */
const toValue = (s: string): Value => (/^-?\d+(\.\d+)?$/.test(s.trim()) ? Number(s.trim()) : s.trim());

export function OpToolbar({
  tab,
  enabled,
  onOp,
  onShuffle,
}: {
  tab: TabKind;
  enabled: boolean;
  onOp: (op: Operation) => void;
  onShuffle: (size: number) => void;
}) {
  const [val, setVal] = useState('7');
  const [idx, setIdx] = useState('1');
  const [size, setSize] = useState(7);

  const v = () => toValue(val);
  const i = () => parseInt(idx, 10);
  const validVal = val.trim().length >= 1 && val.trim().length <= MAX_VALUE_LEN;
  const validIdx = isInt(idx, 9);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 p-3">
      {tab === 'stack' && (
        <>
          <ValueInput label={S.toolbar.value} value={val} onChange={setVal} />
          <OpButton en="push" ar="إدخال" variant="add" disabled={!enabled || !validVal}
            onClick={() => onOp({ kind: 'push', value: v(), sourceLine: 0 })} />
          <OpButton en="pop" ar="إخراج" variant="remove" disabled={!enabled}
            onClick={() => onOp({ kind: 'pop', sourceLine: 0 })} />
        </>
      )}

      {tab === 'queue' && (
        <>
          <ValueInput label={S.toolbar.value} value={val} onChange={setVal} />
          <OpButton en="enqueue" ar="إضافة" variant="add" disabled={!enabled || !validVal}
            onClick={() => onOp({ kind: 'enqueue', value: v(), sourceLine: 0 })} />
          <OpButton en="dequeue" ar="إزالة" variant="remove" disabled={!enabled}
            onClick={() => onOp({ kind: 'dequeue', sourceLine: 0 })} />
        </>
      )}

      {tab === 'sort' && (
        <>
          <label className="flex items-center gap-1.5 text-xs text-slate-300">
            {S.toolbar.size}
            <select
              value={size}
              onChange={e => {
                const n = Number(e.target.value);
                setSize(n);
                onShuffle(n);
              }}
              disabled={!enabled}
              className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 font-mono text-sm text-white outline-none focus:border-emerald-400 disabled:opacity-35"
            >
              {Array.from({ length: SORT_MAX_SIZE - SORT_MIN_SIZE + 1 }, (_, k) => SORT_MIN_SIZE + k).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <OpButton ar={S.toolbar.shuffle} variant="run" disabled={!enabled}
            icon={<Shuffle size={15} />} onClick={() => onShuffle(size)} />
          <OpButton ar={S.toolbar.startSort} variant="add" disabled={!enabled}
            icon={<Play size={15} className="-scale-x-100" />}
            onClick={() => onOp({ kind: 'bubbleSort', sourceLine: 0 })} />
        </>
      )}

      {tab === 'list' && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <ValueInput label={S.toolbar.value} value={val} onChange={setVal} />
            <OpButton en="insertHead" ar="بالبداية" variant="add" disabled={!enabled || !validVal}
              onClick={() => onOp({ kind: 'insertHead', value: v(), sourceLine: 0 })} />
            <OpButton en="insertTail" ar="بالنهاية" variant="add" disabled={!enabled || !validVal}
              onClick={() => onOp({ kind: 'insertTail', value: v(), sourceLine: 0 })} />
            <OpButton en="insertAt" ar="في موقع" variant="add" disabled={!enabled || !validVal || !validIdx}
              onClick={() => onOp({ kind: 'insertAt', index: i(), value: v(), sourceLine: 0 })} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NumInput label={S.toolbar.index} value={idx} onChange={setIdx} max={9} />
            <OpButton en="deleteHead" ar="من البداية" variant="remove" disabled={!enabled}
              onClick={() => onOp({ kind: 'deleteHead', sourceLine: 0 })} />
            <OpButton en="deleteTail" ar="من النهاية" variant="remove" disabled={!enabled}
              onClick={() => onOp({ kind: 'deleteTail', sourceLine: 0 })} />
            <OpButton en="deleteAt" ar="من موقع" variant="remove" disabled={!enabled || !validIdx}
              onClick={() => onOp({ kind: 'deleteAt', index: i(), sourceLine: 0 })} />
          </div>
        </div>
      )}
    </div>
  );
}
