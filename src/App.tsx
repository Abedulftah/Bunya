import { useMemo, useRef, useState } from 'react';
import type { Frame, OpKind, Operation, TabKind, VisualElement } from './types';
import { frameElements } from './types';
import { transitionMs } from './constants';
import { S } from './i18n/strings';
import { usePlayback } from './engine/usePlayback';
import { generateSteps, PSEUDO_BY_OP } from './engine/steps';
import { adjacentArrows } from './engine/steps/linkedList';
import { makeEl } from './engine/ids';
import type { ParseError } from './engine/interpreter';
import {
  parseFunctionDef,
  parseSignature,
  executeFunction,
  isFunctionMode,
  type FnArgs,
  type FunctionRunResult,
} from './engine/function-interpreter';
import { compareExpected, parseList, parseScalarToken, type TestResult } from './engine/expected';
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
import { VariablesPanel } from './components/VariablesPanel';

function restingFrame(tab: TabKind, els: VisualElement[]): Frame {
  switch (tab) {
    case 'stack': return { kind: 'stack', items: els };
    case 'queue': return { kind: 'queue', items: els };
    case 'sort': return { kind: 'sort', bars: els };
    case 'list': return { kind: 'list', nodes: els, arrows: adjacentArrows(els.length) };
  }
}

/** Build the argument map for parameters not bound to the on-screen canvas. */
function buildArgs(code: string, tab: TabKind, rawArgs: Record<string, string>): FnArgs {
  const sig = parseSignature(code, tab);
  const args: FnArgs = {};
  if (!sig) return args;
  for (const p of sig.params) {
    if (p.name === sig.canvasParamName) continue;
    const raw = (rawArgs[p.name] ?? '').trim();
    if (p.kind === 'scalar') {
      args[p.name] = raw === '' ? 0 : parseScalarToken(raw);
    } else {
      args[p.name] = parseList(raw).map(v => makeEl(v));
    }
  }
  return args;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<TabKind>('stack');
  const [data, setData] = useState(initialData);
  const [codes, setCodes] = useState<Record<TabKind, string>>({ ...CODE_TEMPLATES });
  const [codeError, setCodeError] = useState<ParseError | null>(null);
  const [pseudoOp, setPseudoOp] = useState<OpKind>(DEFAULT_PSEUDO_OP.stack);
  const [expectedOutputs, setExpectedOutputs] = useState<Record<TabKind, string>>({
    stack: '', queue: '', sort: '', list: '',
  });
  const [fnArgs, setFnArgs] = useState<Record<TabKind, Record<string, string>>>({
    stack: {}, queue: {}, sort: {}, list: {},
  });
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const runningTabRef = useRef<TabKind>('stack');
  // Carries one function run's outputs to onFinished (function mode only).
  const fnRunRef = useRef<{ result: FunctionRunResult; expected: string } | null>(null);

  const pb = usePlayback(last => {
    const t = runningTabRef.current;
    const run = fnRunRef.current;
    fnRunRef.current = null;

    if (run) {
      // Function mode: commit only the canvas-bound parameter's final state.
      // When nothing binds to the canvas (zero-param / local-only), leave it.
      if (run.result.canvasFinal) {
        const finalEls = run.result.canvasFinal.map(e => ({ ...e, state: 'default' as const }));
        setData(d => ({ ...d, [t]: finalEls }));
      }
      setTestResult(compareExpected(run.expected, run.result));
    } else {
      const finalEls = frameElements(last.frame).map(e => ({ ...e, state: 'default' as const }));
      setData(d => ({ ...d, [t]: finalEls }));
    }
  });

  const canOperate = !pb.playing && (!pb.hasSteps || pb.index === 0 || pb.atEnd);

  const selectTab = (t: TabKind) => {
    if (t === tab) return;
    pb.clear();
    setCodeError(null);
    setTestResult(null);
    setPseudoOp(DEFAULT_PSEUDO_OP[t]);
    setTab(t);
  };

  const runOp = (op: Operation) => {
    if (!canOperate) return;
    setCodeError(null);
    setTestResult(null);
    setPseudoOp(op.kind);
    runningTabRef.current = tab;
    fnRunRef.current = null;
    pb.load(generateSteps(data[tab], op));
  };

  const runCode = () => {
    if (!canOperate) return;
    setTestResult(null);

    const code = codes[tab];
    const res = parseFunctionDef(code);
    if (!res.ok) {
      setCodeError(res.error);
      return;
    }
    setCodeError(null);
    runningTabRef.current = tab;
    const result = executeFunction(res.fn, data[tab], tab, buildArgs(code, tab, fnArgs[tab]));
    fnRunRef.current = { result, expected: expectedOutputs[tab] };
    pb.load(result.steps);
  };

  const shuffle = (n: number) => {
    if (!canOperate) return;
    pb.clear();
    setData(d => ({ ...d, sort: randomBars(n) }));
  };

  const cur = pb.current;
  const frame = cur ? cur.frame : restingFrame(tab, data[tab]);
  const transMs = transitionMs(pb.speed);
  const editorLine = cur?.editorLine ?? null;
  const pseudoLine = cur && cur.lineSource === 'pseudo' ? (cur.line ?? null) : null;
  const pseudo = PSEUDO_BY_OP[cur?.opKind ?? pseudoOp];
  const structureName = cur?.structureName ?? null;

  // Function-mode UI is derived from the editor text, recomputed only on change.
  const fnMode = useMemo(() => isFunctionMode(codes[tab]), [codes, tab]);
  // Parameters that need a value typed in (everything except the canvas-bound one).
  const argParams = useMemo(() => {
    if (!fnMode) return [];
    const sig = parseSignature(codes[tab], tab);
    if (!sig) return [];
    return sig.params.filter(p => p.name !== sig.canvasParamName);
  }, [fnMode, codes, tab]);

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
        {/* right side: visualization canvas */}
        <section className="flex flex-col gap-3">
          <OpToolbar tab={tab} enabled={canOperate} onOp={runOp} onShuffle={shuffle} />
          <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-800/50">
            {structureName && (
              <div className="flex items-center justify-center gap-2 border-b border-slate-700 py-1.5">
                <span className="rounded-full bg-slate-700 px-3 py-0.5 font-mono text-sm font-bold text-amber-300">
                  {structureName}
                </span>
              </div>
            )}
            {frame.kind === 'stack' && <StackCanvas frame={frame} transMs={transMs} />}
            {frame.kind === 'queue' && <QueueCanvas frame={frame} transMs={transMs} />}
            {frame.kind === 'sort' && <SortCanvas frame={frame} transMs={transMs} />}
            {frame.kind === 'list' && <LinkedListCanvas frame={frame} transMs={transMs} />}
          </div>
          <Legend kind={frame.kind} />
          <StatusBar step={cur} />
          {fnMode && <VariablesPanel locals={cur?.locals} />}
          <PlaybackControls pb={pb} />
        </section>

        {/* left side: code panel + pseudo-code */}
        <section className="flex flex-col gap-5">
          <CodePanel
            code={codes[tab]}
            onChange={text => {
              setCodes(c => ({ ...c, [tab]: text }));
              setTestResult(null);
            }}
            onRun={runCode}
            onResetCode={() => {
              setCodes(c => ({ ...c, [tab]: CODE_TEMPLATES[tab] }));
              setCodeError(null);
              setTestResult(null);
            }}
            canRun={canOperate}
            running={pb.playing}
            activeLine={editorLine}
            error={codeError}
            isFnMode={fnMode}
            argParams={argParams}
            argValues={fnArgs[tab]}
            onArgChange={(name, v) => setFnArgs(a => ({ ...a, [tab]: { ...a[tab], [name]: v } }))}
            expectedOutput={expectedOutputs[tab]}
            onExpectedOutputChange={v => setExpectedOutputs(e => ({ ...e, [tab]: v }))}
            testResult={testResult}
          />
          <PseudoCode title={pseudo.title} lines={pseudo.lines} activeLine={pseudoLine} />
        </section>
      </main>

      <footer className="px-4 pb-5 text-center text-xs text-slate-500">
        {S.footer}
      </footer>
    </div>
  );
}
