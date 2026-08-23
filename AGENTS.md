# Porcupine Cross — Prologue Cross event site

Static, dependency-free frontend for a cyclocross race. Vanilla ES6 modules, no
framework, no bundler. Pages: `index.html`, `photos.html`, `tech-guide.html`,
`404.html`. App bootstraps from `js/main.js`.

## Commands

| Task   | Command                                              |
| ------ | ---------------------------------------------------- |
| Dev    | `npm run dev` — http-server on :8000, cache disabled |
| Test   | `npm test` — Jest + jsdom over `tests/unit`          |
| Lint   | `npm run lint` / `npm run lint:fix`                  |
| Format | `npm run format` — Prettier                          |
| Deploy | see `DEPLOYMENT.md`                                  |

Pre-commit (Husky → `lint-staged && npm run test`) runs ESLint, Prettier and the
**full** suite. Never bypass it. Prettier rewrites CSS on commit, so an
exact-string patch against a previously-committed file often will not match —
re-read the file before editing it.

## CSS cascade — read before touching any style

Load order on every page: `style.css` (which `@import`s `css/theme.css`) →
`css/components/*` → **`css/deck.css` last**.

- `deck.css` owns the visual system: every colour and type token, the card
  surfaces, the corner indices. New styling goes there.
- `theme.css` values are fallbacks only — `deck.css` redefines all of them.
- Legacy CSS leans on `!important` and id selectors. Before adding a rule,
  check what already targets the element. Rules that have silently won:
  `#schedule::before`, `#course::before`, `nav#main-nav a:focus`.
- Never write a blanket `body > *` rule — it overrides the header's
  `position: fixed` and unpins it.
- A real mouse click leaves a link `:focus` but **not** `:focus-visible`.
  Style both or the click state falls through to the legacy menu CSS.

## Architecture

- Components communicate through `eventBus` only. No direct cross-component
  calls, no circular imports.
- Animations go through `AnimationSystem`. Always clear timers and intervals
  and remove listeners in cleanup.
- One component ships three files: `js/components/X.js`, `css/components/x.css`,
  `tests/unit/X.test.js`. All three, every time.
- `no-console` and `no-unused-vars` are ESLint errors (`console.warn/error/info`
  are allowed; `_`-prefixed args are ignored). Declare globals in
  `eslint.config.js`, never with `/* global */` comments.
- Delete deprecated code immediately. No commented-out code, no
  backwards-compatibility shims.
- Split a file when it stops being about one thing, not at a line count.

## Verifying visual work

Run `npm run dev` and check the change in a browser at desktop width and at
~390px before claiming it works. Sections start hidden until an
IntersectionObserver adds `.visible` — add that class manually when
screenshotting so the page is not caught mid-reveal.

## Shell

Git Bash on Windows. Heredocs fail unpredictably on large CSS/JS payloads —
write a script file or use the editor tool instead of piping a big heredoc.

## Where else to look

- Deploying → `DEPLOYMENT.md`
- Search/meta tags → `SEO-SETUP.md`
- Test mocking and ESLint config conventions →
  `.github/instructions/frontend-guidelines.instructions.md`

<!--
  Maintenance: this file has a ~1,200 token budget and is zero-sum. Adding a
  rule means removing one. Require evidence from at least two sessions before
  adding anything, and prefer deleting a rule that is no longer true over
  leaving it to rot — agents that meet one false instruction discount the rest.
-->
