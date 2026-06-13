# بُنيَة — تصوّر هياكل البيانات والخوارزميات خطوة بخطوة

**Bunyah** is an interactive, RTL Arabic web app that visualises data structures and algorithms step-by-step, built for Arab high-school students preparing for the Israeli Bagrut matriculation exam in Computer Science. Inspired by [VisuAlgo](https://visualgo.net) (not affiliated).

> مشروع تعليمي شخصي ضمن مساق التدريب العملي في التخنيون.

---

## Table of Contents

- [Features](#features--الميزات)
- [Supported Structures](#supported-structures--الهياكل-المدعومة)
- [Code Editor & Interpreter](#code-editor--interpreter--محرر-الكود)
- [Architecture](#architecture--البنية-التقنية)
- [Run Locally](#run-locally--التشغيل-محليًا)
- [Testing](#testing--الاختبار)
- [Deployment](#deployment--النشر)
- [Tech Stack](#tech-stack)

---

## Features — الميزات

- **Arabic-first UI (RTL)** — all labels, error messages, and descriptions are in Arabic; the layout is fully right-to-left.
- **Four data structures** with dedicated animated canvases: Stack, Queue, Bubble Sort, Linked List.
- **Scrubable playback** — play, pause, step forward, step backward, adjustable speed slider, and reset. Because all animation is frame-based (not imperative), scrubbing backward is as cheap as `index--`.
- **Live code editor** with Bagrut-spec class interfaces (see below) — type code and watch it animate line-by-line with the active source line highlighted in both the editor and the pseudo-code panel.
- **Arabic error messages** — type mismatches, capacity overflows, and illegal operations surface as red steps with Arabic explanations.
- **Generic value type (like `T`)** — push integers, decimals, or Arabic strings (`push("أحمد")`). Each structure enforces a single element type; mixing types is rejected with a typed Arabic error.
- **Eastern Arabic numeral support** — `٠١٢٣٤٥٦٧٨٩` in the editor are normalised automatically.
- **Synchronized code highlight** — editor-sourced steps highlight the editor line; toolbar-sourced steps highlight the pseudo-code panel.

---

## Supported Structures — الهياكل المدعومة

### Stack — المكدس

Bagrut interface: `push(x)`, `pop()`, `top()`, `isEmpty()`

- `top()` peeks without removing (flashes the top element).
- `isEmpty()` reports true/false in the status bar.
- Declare with `Stack<int> s = new Stack<int>()` or `Stack<string>`.

### Queue — الطابور

Bagrut interface: `insert(x)`, `remove()`, `head()`, `isEmpty()`

- `enqueue` / `dequeue` are accepted as aliases in the editor.
- Canvas is intentionally LTR (rear-left, front-right) per spec.

### Bubble Sort — فرز الفقاعات

Toolbar-driven (no code editor on this tab). Animates every comparison and swap with colour-coded states (comparing / swapped / sorted).

### Linked List — القائمة الموصولة

Toolbar-driven. Supports `addFirst`, `addLast`, `addAt`, `removeFirst`, `removeLast`, `removeAt`, `search`. Head is rightmost; arrows point leftward (RTL). Bypass arcs for non-adjacent removals animate as dashed amber curves.

---

## Code Editor & Interpreter — محرر الكود

The editor is available on the **Stack** and **Queue** tabs. Write code using the Bagrut class interface and press **Run Code** (or Ctrl+Enter).

```java
Stack<int> s = new Stack<int>()
s.push(3)
s.push(7)
s.push(5)
s.pop()
s.top()
```

```java
Queue<string> q = new Queue<string>()
q.insert("أحمد")
q.insert("سارة")
q.remove()
q.head()
```

**What the interpreter does:**

1. Skips `//` comments, normalises Eastern Arabic digits.
2. Parses `ClassName<Type> varName = new ...` declarations — records the declared type and emits a `newStructure` op that resets the canvas to an empty structure of that type.
3. Translates each method call into an `Operation`, chains it through the same step generators used by the toolbar, and tags every step with `lineSource: 'editor'` so the editor highlights correctly.
4. Type-checks at both parse time (declaration vs. literal) and runtime (homogeneous structure — the first element determines T).

---

## Architecture — البنية التقنية

Everything revolves around **precomputed immutable steps** — there is no imperative animation:

```
User action (toolbar / "Run Code")
    ↓
Operation  (src/types.ts)
    ↓
Step generator  (src/engine/steps/{stack,queue,bubbleSort,linkedList}.ts)
    returns  Step[]  — each Step holds a full Frame snapshot, a pseudo-code line,
                       an Arabic description, and an optional error
    ↓
usePlayback  (src/engine/usePlayback.ts)
    owns steps / index / playing / speed
    auto-advances via setTimeout
    calls onFinished(lastStep) once → App commits frame as new resting data
    ↓
Canvas  (src/components/canvas/)
    renders steps[index].frame purely
    absolutely positions elements by array index with transition-all + stable key={el.id}
    enter/exit are element *states* (entering/exiting), not mount/unmount
```

**Key files:**

| Path | Role |
|------|------|
| `src/types.ts` | All shared types: `Operation`, `Step`, `Frame`, `Element`, `Value` |
| `src/constants.ts` | Capacities, speed knobs, `STATE_STYLES` colour map |
| `src/i18n/strings.ts` | Single source of truth for every Arabic string |
| `src/engine/steps/index.ts` | `generateSteps` dispatcher + `typeGuard` |
| `src/engine/interpreter.ts` | Bagrut code → `Operation[]` |
| `src/engine/usePlayback.ts` | Playback state machine |
| `src/App.tsx` | Root: tab routing, `canOperate` guard, `onFinished` commit |
| `src/components/canvas/` | Four pure canvas components |
| `src/components/CodePanel.tsx` | Monaco-like editor with line-highlight math |

**RTL notes:**

- `index.html` sets `dir="rtl" lang="ar"`.
- Deliberate LTR islands: the code editor (`CodePanel`), the queue canvas, sort canvas, linked-list canvas — all use `dir="ltr"` wrappers and **physical** `left`/`right` positioning (not logical CSS) to avoid direction-inheritance bugs.
- Directional icons (play/skip) are mirrored with `-scale-x-100`.

---

## Run Locally — التشغيل محليًا

```bash
npm install
npm run dev        # http://localhost:5173
```

Other commands:

```bash
npm run build      # tsc type-check + production build → dist/
npm run lint       # eslint
```

> **Note (macOS):** if npm fails with cache permission errors, add `--cache /tmp/npm-cache-vis`.

---

## Testing — الاختبار

A browser-driven smoke test exercises all four structures, the playback controls, and the interpreter end-to-end using system Chrome via Puppeteer:

```bash
# Dev server must be running first
node scripts/verify-app.mjs
```

Screenshots land in `/tmp/visverify/`. Set `APP_URL` to override the default `http://localhost:5173`.

---

## Deployment — النشر

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds and deploys to **GitHub Pages** automatically.

First-time setup: enable **Settings → Pages → Source: GitHub Actions** in the repository settings.

`vite.config.ts` reads the `BASE_PATH` env var (set by CI to `/<repo>/`); locally it defaults to `/`.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Language | TypeScript (strict) |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Testing | puppeteer-core (smoke tests) |

---

*Not affiliated with VisuAlgo. Arabic VisuAlgo (بُنيَة) is an independent educational project.*
