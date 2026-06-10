import { useRef, useState } from 'react';
import type { Frame, OpKind, Operation, TabKind, VisualElement } from './types';
import { frameElements } from './types';
import { transitionMs } from './constants';
import { S } from './i18n/strings';
import { usePlayback } from './engine/usePlayback';
import { generateSteps, PSEUDO_BY_OP } from './engine/steps';
import { adjacentArrows } from './engine/steps/linkedList';
import { compileOps, parseProgram, type ParseError } from './engine/interpreter';
import { CODE_TEMPLATES, DEFAULT_PSEUDO_OP } from './data/templates';
import { initialData, randomBars } from './data/initialData';
import { TabBar } from './components/TabBar';
import { PlaybackControls } from './components/PlaybackControls';
import { StatusBar } from './components/StatusBar';
import { CodePanel } from './components/CodePanel';
import { PseudoCode } from './components/PseudoCode';
import { Legend } from './components/canvas/Legend';
import { OpToolbar } from './components/canvas/OpToolbar';
import { StackCanvas } from './components/canvas/StackCanvas';
import { QueueCanvas } from './components/canvas/QueueCanvas';
import { SortCanvas } from './components/canvas/SortCanvas';
import { LinkedListCanvas } from './components/canvas/LinkedListCanvas';

function restingFrame(tab: TabKind, els: VisualElement[]): Frame {
  switch (tab) {
    case 'stack': return { kind: 'stack', items: els };
    case 'queue': return { kind: 'queue', items: els };
    case 'sort': return { kind: 'sort', bars: els };
    case 'list': return { kind: 'list', nodes: els, arrows: adjacentArrows(els.length) };
  }
}

export default function App() {
  const [tab, setTab] = useState<TabKind>('stack');
  const [data, setData] = useState(initialData);
  const [codes, setCodes] = useState<Record<TabKind, string>>({ ...CODE_TEMPLATES });
  const [codeError, setCodeError] = useState<ParseError | null>(null);
  const [pseudoOp, setPseudoOp] = useState<OpKind>(DEFAULT_PSEUDO_OP.stack);
  const runningTabRef = useRef<TabKind>('stack');

  const pb = usePlayback(last => {
    const t = runningTabRef.current;
    setData(d => ({
      ...d,
      [t]: frameElements(last.frame).map(e => ({ ...e, state: 'default' as const })),
    }));
  });

  const canOperate = !pb.playing && (!pb.hasSteps || pb.index === 0 || pb.atEnd);

  const selectTab = (t: TabKind) => {
    if (t === tab) return;
    pb.clear();
    setCodeError(null);
    setPseudoOp(DEFAULT_PSEUDO_OP[t]);
    setTab(t);
  };

  const runOp = (op: Operation) => {
    if (!canOperate) return;
    setCodeError(null);
    setPseudoOp(op.kind);
    runningTabRef.current = tab;
    pb.load(generateSteps(data[tab], op));
  };

  const runCode = () => {
    if (!canOperate) return;
    const res = parseProgram(codes[tab], tab);
    if (!res.ok) {
      setCodeError(res.error);
      return;
    }
    setCodeError(null);
    runningTabRef.current = tab;
    pb.load(compileOps(res.ops, data[tab]));
  };

  const shuffle = (n: number) => {
    if (!canOperate) return;
    pb.clear();
    setData(d => ({ ...d, sort: randomBars(n) }));
  };

  const cur = pb.current;
  const frame = cur ? cur.frame : restingFrame(tab, data[tab]);
  const transMs = transitionMs(pb.speed);
  const editorLine = cur && cur.lineSource === 'editor' && cur.line !== undefined ? cur.line : null;
  const pseudoLine = cur && cur.lineSource === 'pseudo' && cur.line !== undefined ? cur.line : null;
  const pseudo = PSEUDO_BY_OP[pseudoOp];

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">🧮 {S.appTitle}</h1>
            <p className="text-sm text-slate-400">{S.appSubtitle}</p>
          </div>
          <TabBar tab={tab} onSelect={selectTab} />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] flex-1 items-start gap-5 p-4 lg:grid-cols-[8fr_5fr] lg:p-6">
        {/* first in DOM ⇒ right side in RTL: the visualization canvas */}
        <section className="flex flex-col gap-3">
          <OpToolbar tab={tab} enabled={canOperate} onOp={runOp} onShuffle={shuffle} />
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50">
            {frame.kind === 'stack' && <StackCanvas frame={frame} transMs={transMs} />}
            {frame.kind === 'queue' && <QueueCanvas frame={frame} transMs={transMs} />}
            {frame.kind === 'sort' && <SortCanvas frame={frame} transMs={transMs} />}
            {frame.kind === 'list' && <LinkedListCanvas frame={frame} transMs={transMs} />}
          </div>
          <Legend />
          <StatusBar step={cur} />
          <PlaybackControls pb={pb} />
        </section>

        {/* left side: the interactive code panel + pseudo-code tracker */}
        <section className="flex flex-col gap-5">
          <CodePanel
            code={codes[tab]}
            onChange={text => setCodes(c => ({ ...c, [tab]: text }))}
            onRun={runCode}
            onResetCode={() => {
              setCodes(c => ({ ...c, [tab]: CODE_TEMPLATES[tab] }));
              setCodeError(null);
            }}
            canRun={canOperate}
            running={pb.playing}
            activeLine={editorLine}
            error={codeError}
          />
          <PseudoCode title={pseudo.title} lines={pseudo.lines} activeLine={pseudoLine} />
        </section>
      </main>

      <footer className="px-4 pb-5 text-center text-xs text-slate-500">
        {S.inspiredBy} · {S.footer}
      </footer>
    </div>
  );
}
