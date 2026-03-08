# Contributing to Lume

Thanks for your interest in contributing to Lume! Here's how to get started.

## Setup

```bash
git clone https://github.com/cryptocreeper94-sudo/lume.git
cd lume
npm install
```

## Running Tests

```bash
# All unit tests
npm test

# Integration tests
node --test tests/integration/e2e.test.js

# Full CI suite
npm run test:ci
```

## Project Structure

```
bin/lume.js              CLI entry point (17 commands)
src/
  lexer.js               Tokenizer
  parser.js              Recursive descent parser → AST
  transpiler.js          AST → JavaScript
  runtime.js             AI function runtime (ask, think, generate)
  runtime/               Self-sustaining layers (monitor, healer, optimizer, evolver)
  intent-resolver/       English Mode pipeline
    index.js             Main resolver
    pattern-library.js   102 deterministic patterns
    ai-resolver.js       Layer B AI fallback
    security-layer.js    11 threat categories
    auto-correct.js      7-step tolerance chain
    app-generator.js     Full-stack scaffolding
  formatter.js           Auto-formatter
  linter.js              15 lint rules
  repl.js                Interactive REPL
  stdlib.js              Standard library (67 functions)
  error-formatter.js     Human-readable error messages
  index.js               Barrel file (npm entry point)
tests/
  unit/                  333 unit tests (milestone1-13.test.js)
  integration/           33 integration tests (e2e.test.js)
examples/                10 .lume example files
website/                 Vite + React website
docs/                    Documentation
```

## Code Style

- Use `const`/`let`, never `var`
- 4-space indentation
- JSDoc comments on all exported functions
- Run `npm run fmt` before committing

## Adding a Pattern

To add a new English Mode pattern, edit `src/intent-resolver/pattern-library.js`:

1. Add a regex + handler to the `PATTERNS` array
2. Add a test case in `tests/unit/milestone7.test.js`
3. Update the pattern count in the REPL (`.mode` message)
4. Run `npm test` to verify

## Pull Request Process

1. Fork the repo and create a feature branch
2. Write tests for your changes
3. Ensure all 366+ tests pass
4. Submit PR with a clear description

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
