import { MousePointerClick } from 'lucide-react';
import { S } from '../i18n/strings';

const SUPPORTED = `Stack<int> mystack = new Stack<int>();
mystack.push(15);
mystack.pop();
myqueue.enqueue("أحمد");
myqueue.dequeue();`;

/**
 * Shown instead of the editor on tabs whose operations are not part of the
 * code engine (instruction.md defines only push/pop/enqueue/dequeue).
 */
export function CodeUnavailable() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
      <div className="border-b border-slate-700 px-4 py-2.5">
        <h2 className="text-sm font-bold text-white">{S.editor.title}</h2>
      </div>
      <div className="flex flex-col gap-3 p-4 text-sm text-slate-300">
        <p>{S.editor.codeOnlyFor}</p>
        <pre dir="ltr" className="rounded-lg bg-slate-950 p-3 font-mono text-xs leading-6 text-slate-300">
          {SUPPORTED}
        </pre>
        <p className="text-xs text-slate-400">{S.editor.anyTypeNote}</p>
        <p className="flex items-center gap-2 font-semibold text-emerald-300">
          <MousePointerClick size={16} />
          {S.editor.useButtons}
        </p>
      </div>
    </div>
  );
}
