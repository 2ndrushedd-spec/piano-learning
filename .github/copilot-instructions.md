<!-- Copilot / AI agent instructions for the piano-learning repo -->

# Copilot instructions — piano-learning

Purpose: quick, practical guidance for AI coding agents to be productive in this repo.

1. Big picture

- This is a small single-page React app bootstrapped with Create React App (`react-scripts`).
- Routing: `src/App.js` defines routes using `react-router-dom` — root (`/`) -> `src/pages/InstrumentSelect.jsx`, `/piano` -> `src/pages/PianoModule.jsx`.
- UI surface: pages live in `src/pages/`, reusable pieces live in `src/components/` (e.g. `VirtualPiano.jsx`). Styles are plain CSS files colocated with components (e.g. `VirtualPiano.css`).
- No backend: state persistence is local-only via `localStorage` (key: `pianoProgress`), and audio functionality uses the browser Web Audio API (`window.AudioContext`).

2. Key files and why they matter

- `package.json` — run scripts: `npm start`, `npm test`, `npm run build` (standard CRA). Use `npm.start` to run locally.
- `src/App.js` — central router; add new pages here for new routes.
- `src/pages/InstrumentSelect.jsx` — entry view that navigates to the piano module.
- `src/pages/PianoModule.jsx` — main module: manages lesson/game progress, persists to `localStorage`, toggles the floating piano.
- `src/components/VirtualPiano.jsx` — Web Audio API example: creates an `AudioContext`, oscillators and gain nodes; user interactions handled with mouse and touch events. When changing audio code, preserve `AudioContext` reuse via `useRef` and the `activeNotesRef` pattern to avoid duplicate oscillators.

3. Project-specific conventions & patterns

- Functional React components and hooks only (no class components). Prefer `useState`, `useEffect`, `useRef`.
- Colocate CSS: component `Foo.jsx` typically has `Foo.css` in same folder and imports it (`import './Foo.css'`). Follow that pattern for new components.
- Local state persistence: use `localStorage` keys and `useEffect` to load/save in `PianoModule.jsx`. When adding persisted state, follow the same JSON stringify/parse pattern.
- Event handling in `VirtualPiano.jsx`: components use `onMouseDown`, `onMouseUp`, `onMouseLeave`, and `onTouchStart`/`onTouchEnd` together to support mouse and touch. Keep both for mobile support.

4. Integration points & external dependencies

- `react`, `react-dom`, `react-router-dom`, `react-scripts` (see `package.json`).
- External assets: `InstrumentSelect.jsx` references external icon URLs — no local image bundling required currently.
- Browser APIs: `localStorage` and Web Audio API (`AudioContext`) are used; changes to these must consider browser compatibility and user interaction policies (AudioContext often requires a user gesture to resume on some browsers).

5. Common edits and examples

- Add a route: update `src/App.js` and add a new file under `src/pages/`.
  Example: to add `/settings`, create `src/pages/Settings.jsx` and add <code>&lt;Route path="/settings" element={&lt;Settings /&gt;} /&gt;</code>.
- Persist new progress flags: extend the `progress` object in `PianoModule.jsx` and keep the `localStorage` key `pianoProgress` consistent.
- Modify audio behavior: reuse `audioCtxRef` from `VirtualPiano.jsx` and keep `activeNotesRef` to track running oscillators; stop notes by ramping gain then stopping oscillator (see existing `stopNote` implementation).

6. Build / run / test

- Start development server: `npm install` (once) then `npm start` (runs CRA dev server on localhost:3000).
- Run tests: `npm test` (uses `react-scripts` jest runner).
- Build production bundle: `npm run build`.

7. Constraints & cautions

- Do NOT `eject` from `react-scripts` unless explicitly asked (project expects CRA defaults).
- Audio: changes that recreate `AudioContext` on every render or on mount without user gesture can be blocked by browsers; follow the `useRef` pattern in `VirtualPiano.jsx`.
- Keep styling simple and colocated; avoid introducing CSS-in-JS unless a clear migration is requested.

8. PR guidance for AI edits

- Small, focused changes. Update or add a test only if it's directly related to the change.
- When touching persisted schema (the `pianoProgress` object), keep backward-compatible defaults for older saved data.

9. Useful search examples

- Find routes: search for `Route` in `src/App.js`.
- Find persistence: search for `localStorage.getItem("pianoProgress")` or `localStorage.setItem("pianoProgress"`.
- Find audio code: open `src/components/VirtualPiano.jsx`.

If anything in this summary is unclear or you'd like more detail on specific areas (tests, component conventions, or audio behavior), tell me what to expand. I'll iterate on this file.
