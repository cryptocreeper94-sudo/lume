# Contributing to Lume

> How to contribute code, tests, and documentation.

## Getting Started

```bash
git clone https://github.com/trust-layer/lume.git
cd lume
npm install
npm test
```

## Project Structure

```
lume/
├── src/
│   ├── lexer.js                 # Tokenizer (30+ token types)
│   ├── parser.js                # AST generator
│   ├── transpiler.js            # JS code generator
│   ├── linter.js                # Static analysis (L001-L051)
│   ├── error-formatter.js       # Friendly error messages
│   ├── stdlib.js                # Standard library
│   ├── intent-resolver/         # English Mode engine
│   │   ├── resolver.js          # Pattern matching
│   │   ├── voice-input.js       # Voice pipeline
│   │   └── security-layer.js    # Guardian Scanner
│   ├── runtime/                 # Self-sustaining layers
│   │   ├── monitor.js           # Layer 1: Monitoring
│   │   ├── healer.js            # Layer 2: Auto-recovery
│   │   ├── optimizer.js         # Layer 3: Tuning
│   │   └── evolver.js           # Layer 4: Learning
│   └── server/                  # Playground backend
├── tests/
│   ├── unit/                    # Unit tests (1,000+)
│   ├── milestones/              # Milestone tests
│   └── e2e/                     # End-to-end tests
├── examples/                    # 25 example programs
├── docs/                        # 13 documentation files
└── website/                     # Lume website (React)
```

## Running Tests

```bash
# All tests
npm test

# Specific test file
node --test tests/unit/lexer.test.js

# Pattern match
node --test tests/unit/security*.test.js
```

## Writing Tests

Tests use Node.js built-in test runner:

```javascript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('Feature: description', () => {
    it('does something specific', () => {
        assert.equal(actual, expected)
    })
})
```

### Test Conventions

- **File naming**: `<module>.test.js`
- **Describe blocks**: `Module: Feature` (e.g., `Lexer: Strings`)
- **Test names**: Start with verb — "tokenizes", "returns", "throws", "handles"
- **One assertion per test** when possible
- **Edge cases**: Always test empty input, null, and boundary values

## Code Style

- **4-space indentation** (no tabs)
- **snake_case** for functions and variables
- **PascalCase** for types
- **Line limit**: 120 characters
- **Comments**: Doc comments (`///`) for all exports

## Pull Request Checklist

- [ ] All existing tests pass (`npm test`)
- [ ] New features include tests
- [ ] No lint warnings (`lume lint`)
- [ ] Documentation updated for API changes
- [ ] Example program added for significant features
- [ ] Security review for any new pattern handling

## Areas Needing Help

- Additional stdlib functions
- More English Mode patterns
- Browser/Deno runtime support
- Editor / IDE integrations
- Documentation translations
