import { S } from '../i18n/strings';

export function PseudoCode({
  title,
  lines,
  activeLine,
}: {
  title: string;
  lines: string[];
  activeLine: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      <div className="border-b border-slate-700 px-4 py-2.5">
        <h2 className="text-sm font-bold text-white">
          {S.editor.pseudoTitle}: <span className="text-emerald-300">{title}</span>
        </h2>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-sm leading-6 text-slate-300" dir="ltr">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`-mx-1 rounded px-2 transition-colors duration-200 ${
              i === activeLine ? 'bg-amber-400/20 font-bold text-amber-200' : ''
            }`}
          >
            <span className="me-3 inline-block w-4 select-none text-end text-xs text-slate-600">{i}</span>
            {line || ' '}
          </div>
        ))}
      </pre>
    </div>
  );
}
