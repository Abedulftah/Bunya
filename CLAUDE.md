# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**"Arabic VisuAlgo"** (فيجوالجو بالعربية) — an RTL Arabic React app, inspired by visualgo.net, that visualizes Stack, Queue, Bubble Sort, and Linked List step by step for Arab high-school students (Bagrut prep). Product spec: `instruction.md`. Academic context: personal project for a Technion teaching-practicum course (`הנחיות לפרויקט אישי .doc`), final report due 1.7.2026.

## Commands

- `npm run dev` — dev server (Vite)
- `npm run build` — `tsc -b` type-check + production build; `npx tsc --noEmit -p tsconfig.app.json` for check only
- `npm run lint` — eslint
- `node scripts/verify-app.mjs` — browser-driven smoke test of all four structures, the playback controls, and the interpreter (drives system Chrome via puppeteer-core; needs the dev server running; set `APP_URL` if not on :5173). Screenshots land in `/tmp/visverify/`.
- npm installs on this machine need `--cache /tmp/npm-cache-vis` (root-owned files break the default cache).

Deployment: pushing `main` to GitHub runs `.github/workflows/deploy.yml` → GitHub Pages. `vite.config.ts` reads `BASE_PATH` (set by CI to `/<repo>/`); locally it defaults to `/`.

## Architecture — the step/playback model (read this first)

Everything revolves around **precomputed immutable steps**; nothing animates imperatively:

1. A user action (toolbar button or "Run Code") produces an `Operation` (`src/types.ts`).
2. A pure **step generator** (`src/engine/steps/{stack,queue,bubbleSort,linkedList}.ts`, dispatched by `generateSteps` in `src/engine/steps/index.ts`) maps `(restingData, op) → Step[]`. Each `Step` holds a full `Frame` snapshot (every element with id/value/state), a pseudo-code line number, an Arabic `description`, and optionally `error`.
3. `usePlayback` (`src/engine/usePlayback.ts`) is the single playback engine: it owns `steps/index/playing/speed`, a `setTimeout` auto-advance, and fires `onFinished(lastStep)` **once** per run so `App` commits the last frame as the new resting data. Step-backward is just `index--` — this is why animations must be frames, not fire-and-forget CSS effects.
4. Canvases render `steps[index].frame` purely. Movement comes from absolutely positioning elements by array index with `transition-all` and **stable `key={el.id}`**; enter/exit are element *states* (`entering`/`exiting`) rendered as offset+transparent, so scrubbing in both directions stays consistent. Element colors come from `STATE_STYLES` in `src/constants.ts`.

The **interpreter** (`src/engine/interpreter.ts`) accepts the **Bagrut class interfaces**: Stack — `push`/`pop`/`top`/`isEmpty` (stack tab); Queue — `insert`/`remove`/`head`/`isEmpty` (queue tab), with `enqueue`/`dequeue` kept as aliases because instruction.md uses those spellings (internally the op kinds remain `enqueue`/`dequeue`). `top`/`head` are peeks (flash without removing); `isEmpty` reports true/false in the status bar. Sort and linked list are toolbar-driven, and on those tabs `CodeUnavailable` replaces the editor. Values are **generic like a template T** (`Value = number | string`): integers, decimals, or quoted text (Arabic works). Type rules, enforced at two levels:

- Parse time: a declaration `Stack<int> s = new ...` records the variable's type parameter; a later `s.push("x")` fails with a typed Arabic error (`matchesType`, strict about int vs double). A declaration also emits a `newStructure` op that **resets the canvas to a fresh empty structure**, so the declared T matches reality.
- Run time: every structure instance is homogeneous — `typeGuard` in `src/engine/steps/index.ts` infers T (`number` vs `text`) from the elements already present and turns a mismatching insert (toolbar **or** editor, including the linked list) into an error step on the signature line.

Parsing also skips `//` comments and normalizes Arabic-Indic digits. `compileOps` chains the same step generators op-by-op and retags every step with the editor source line (`lineSource: 'editor'`); button ops keep `lineSource: 'pseudo'`. `App.tsx` routes the highlight accordingly: editor line → `CodePanel`, pseudo line → `PseudoCode` (listing chosen via `PSEUDO_BY_OP`).

State invariant in `App.tsx`: new operations are only allowed when not playing and at index 0 or at the end (`canOperate`); switching tabs calls `pb.clear()` and abandons an uncommitted run.

## RTL specifics (easy to break)

- `index.html` sets `dir="rtl" lang="ar"`; all UI text lives in `src/i18n/strings.ts` — never hardcode Arabic strings in components.
- Two deliberate **LTR islands**: the code editor (`CodePanel`, code is Latin) and the queue canvas (spec requires rear-left / front-right). The sort and list canvases also use `dir="ltr"` wrappers with physical coordinates.
- Inside any element that carries its own `dir`, `inset-inline-*`/logical utilities resolve against *that* element's direction — this already caused a bug once (stack elements rendered outside the walls). Canvases therefore position with **physical** `left`/`right` only.
- Directional icons (play/skip) are mirrored with `-scale-x-100` so "forward" points left.
- Linked list geometry: head is rightmost, `leftOf(i)` computes positions from the right; adjacent SVG arrows are fixed-shape `<g>` elements moved via CSS `transform` (transitionable), while non-adjacent "bypass" arrows render as dashed amber curves that fade in (`animate-fadein`), keyed so they don't morph.

## Conventions

- Step generators must clone elements per frame (`reset(...)`/spread) — frames share no mutable objects.
- The editor's line-highlight math assumes `font-mono text-sm leading-6` + `p-3` (24px lines, 12px padding) in `CodePanel`; keep classes and `LINE_H`/`PAD_T` in sync.
- Capacities and speed/timing knobs live in `src/constants.ts` (`MAX_STACK/QUEUE/LIST`, `BASE_DELAY`, `transitionMs`).
