---
description: 'Test and lint-config conventions for the Porcupine Cross site.'
applyTo: 'tests/**,**/*.test.js,eslint.config.js'
---

# Testing & lint config

Broad project rules live in [AGENTS.md](../../AGENTS.md). This file covers only
what you need when writing a test or touching the ESLint config, so it loads
against those files rather than everything.

## Writing tests

- Jest + jsdom. Specs live in `tests/unit`, one per component, named after it.
- Test the public API and observable behaviour, not internals. If a test knows
  about a private field, it will break on the next refactor and tell you
  nothing useful.
- Keep DOM mocking minimal. A plain element with the handful of properties the
  code reads beats a hand-built fake document.
- Browser APIs jsdom lacks are polyfilled in `tests/jest.setup.js` (currently
  just `KeyboardEvent`), wired via `setupFilesAfterEnv` in `package.json`. Add
  new polyfills there, not inline in a spec.
- Several suites log expected `console.error` output (missing mobile-menu
  elements, invalid animation names). That noise is the code under test taking
  its error path — do not silence it by changing the source.
- Coverage is collected from `script.js` and `js/**/*.js` only. CSS-only changes
  will not move it.

## ESLint config

- ESLint v9 flat config, all of it in `eslint.config.js`.
- Declare browser globals in the main config block and Jest globals in the test
  block. **Never** use `/* global */` comments in source files.
- `no-console` is an error, with `warn`, `error` and `info` allowed.
  `no-unused-vars` is an error, with `^_`-prefixed arguments ignored.
- Exclude build artefacts through the `ignores` array, not `.eslintignore`.
