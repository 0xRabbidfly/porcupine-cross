# Copilot Instructions — Porcupine Cross

Static, dependency-free frontend for the Prologue Cross event site. Vanilla ES6 modules, no framework, no bundler.

## Stack & Layout

- **Runtime**: Plain HTML/CSS/JS served statically (`http-server`), ES modules (`"type": "module"`)
- **Entry points**: [index.html](index.html), [photos.html](photos.html), [tech-guide.html](tech-guide.html), [404.html](404.html)
- **App bootstrap**: [js/main.js](js/main.js) initializes all components
- **Components**: [js/components](js/components) · **Core services**: [js/core](js/core) · **Utils**: [js/utils](js/utils)
- **Styles**: [css/theme.css](css/theme.css) then [css/components](css/components) (one file per component)
- **Tests**: [tests/unit](tests/unit) with Jest + jsdom, setup in [tests/jest.setup.js](tests/jest.setup.js)

## Commands

| Task           | Command                             |
| -------------- | ----------------------------------- |
| Dev server     | `npm run dev`                       |
| Tests          | `npm test`                          |
| Coverage       | `npm run test:coverage`             |
| Lint / fix     | `npm run lint` / `npm run lint:fix` |
| Format         | `npm run format`                    |
| Quality report | `npm run quality`                   |
| Deploy         | `npm run deploy`                    |

Pre-commit (Husky + lint-staged) runs ESLint, Prettier, and the full test suite. Never bypass it.

## Non-Negotiables

- Components communicate through the `eventBus` — no direct cross-component calls, no circular imports.
- Animations go through `AnimationSystem`; always clear timers/intervals and remove listeners in cleanup.
- Delete deprecated code immediately; no commented-out code, no backwards-compatibility shims.
- Every new component ships with a unit test in [tests/unit](tests/unit) and its own CSS file in [css/components](css/components).
- `no-console` and `no-unused-vars` are errors. Never add `/* global */` comments — declare globals in [eslint.config.js](eslint.config.js).

Full conventions live in [.github/instructions/frontend-guidelines.instructions.md](.github/instructions/frontend-guidelines.instructions.md).
