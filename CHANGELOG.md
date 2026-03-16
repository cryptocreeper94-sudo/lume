# Changelog

All notable changes to Lume are documented here.

## [0.8.1] — 2026-03-16

### Added
- **Comprehensive Test Expansion** — 2,093 tests (up from 1,040), 505 suites, 51 test files, 0 failures
- **33 new test files** covering every intent-resolver module (ast-differ, bundler, module-resolver, ui-registry, pattern-library-i18n, pattern-versioning, voice-config, voice-input, ai-resolver, app-generator, package-registry, and more)
- **14 new example programs** (38 total) — task-scheduler, state-machine, cache-system, event-bus, validation, logger, plugin-system, query-builder, color-system, router, observable-store, testing-framework, async-pipeline, matrix-math
- 100% module coverage of the `src/intent-resolver/` directory

### Changed
- README updated with current stats (2,093 tests, 38 examples)
- Academic brief updated with current metrics
- Changelog page updated with current test counts

---

## [0.8.0] — 2026-03-08

### Added
- **Error Formatter** — Human-readable errors with source context, "did you mean?" suggestions, and Levenshtein typo correction
- **Integration Tests** — 33 end-to-end tests covering core pipeline, English Mode, pattern coverage, `lume create`, and error handling
- **Barrel File** (`src/index.js`) — 19 named exports for `@lume/compiler` package
- **3 New Example Apps** — `todo.lume`, `calculator.lume`, `api-server.lume`
- **CI/CD Pipeline** — GitHub Actions testing on Node 18, 20, and 22
- **Pattern Library Expansion** — 102 patterns (sort, string, date, events, return, toggle, swap, ranges, etc.)
- **REPL English Mode** — `.mode` toggle with dynamic `english>` prompt
- **AI Graceful Degradation** — Returns structured hint instead of crashing when no API key
- **README** — Comprehensive docs with quick start, tutorial, and CLI reference
- **Getting Started Guide** — `docs/getting-started.md`
- `LICENSE` (MIT), `.gitignore`, `CHANGELOG.md`, `CONTRIBUTING.md`

### Changed
- Package renamed to `@lume/compiler` with comprehensive `exports` map
- DevPortal updated: 2,093 tests, 14K+ LOC, 51 test files, 25+ modules
- Playground expanded: 31 in-browser patterns, 6 example programs
- `lume compile` uses static `require` instead of dynamic `import()`
- Barrel export fixed: `resolveEnglishFile` (was broken `resolveIntent`)

### Fixed
- `lume create` now generates real code, not stub comments
- `raw:` blocks now scanned for dangerous patterns (eval, child_process, etc.)
- Nav version updated from v0.6 to v0.8
- Talking points reflect actual stats (2,093 tests, 102+ patterns)

## [0.7.0] — 2026-03-06

### Added
- **Milestone 7**: English Mode — Intent Resolver with Layer A (pattern matching) and Layer B (AI)
- **Milestone 8**: Multilingual Mode — 10 human languages supported
- **Milestone 9**: Voice-to-Code — Web Speech API + CLI `lume listen`
- **Milestone 10**: Visual Context + Full-Stack Gen — `lume create` app generator
- **Milestone 11**: Reverse Mode — `lume explain` for any JS/TS/Lume file
- **Milestone 12**: Collaborative Intent — AST-level diffing
- **Milestone 13**: Zero-Dependency Runtime — `lume compile` via Bun
- Security Layer with 11 threat categories and Guardian output scanner
- Auto-Correct with 7-step Tolerance Chain
- Compile Lock for deterministic builds

## [0.6.0] — 2026-02-28

### Added
- Milestones 1-6: Core language, AI keywords, self-sustaining runtime
- Lexer, Parser, Transpiler, Runtime (4 layers)
- Formatter, Linter, REPL, Stdlib, CLI
- 219 unit tests (initial baseline)
