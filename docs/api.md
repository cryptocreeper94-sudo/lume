# API Reference

`@lume/compiler` — Programmatic API for embedding Lume in your own tools.

```bash
npm install @lume/compiler
```

---

## Quick Start

```javascript
import { compile } from '@lume/compiler'

const js = compile('show "Hello from Lume!"')
console.log(js)  // → console.log("Hello from Lume!");
```

---

## Core Pipeline

### `tokenize(source, filename?)`

Tokenize Lume source code into a token stream.

```javascript
import { tokenize } from '@lume/compiler'
const tokens = tokenize('let x = 42', 'input.lume')
// → [Token(LET), Token(IDENTIFIER, 'x'), Token(EQUALS), Token(NUMBER, 42), ...]
```

### `parse(tokens, filename?)`

Parse a token stream into an Abstract Syntax Tree.

```javascript
import { parse } from '@lume/compiler'
const ast = parse(tokens, 'input.lume')
// → { type: 'Program', body: [...] }
```

### `transpile(ast, filename?)`

Transpile an AST to JavaScript.

```javascript
import { transpile } from '@lume/compiler'
const js = transpile(ast, 'input.lume')
```

### `compile(source, filename?)`

One-step compilation: source → JavaScript. Automatically detects English Mode.

```javascript
import { compile } from '@lume/compiler'
const js = compile('let x = 42\nshow x')
```

---

## Intent Resolver (English Mode)

### `resolveEnglishFile(source, options?)`

Resolve an English Mode source file to an AST.

```javascript
import { resolveEnglishFile } from '@lume/compiler'
const result = await resolveEnglishFile('mode: english\nget the user', {
    filename: 'app.lume',
    model: 'gpt-4o-mini',
})
// result.ast, result.diagnostics, result.stats, result.certificate
```

### `matchPattern(input)`

Test a single English sentence against the pattern library.

```javascript
import { matchPattern } from '@lume/compiler'
const result = matchPattern('show the dashboard')
// → { matched: true, ast: { type: 'ShowStatement', value: 'dashboard' }, ... }
```

### `autoCorrect(input)`

Apply the 7-step tolerance chain to correct common input mistakes.

```javascript
import { autoCorrect } from '@lume/compiler'
const result = autoCorrect('shwo the results')
// → { corrected: 'show the results', corrections: [...] }
```

---

## Security

### `checkSecurity(input, config?)`

Check a single input line for security threats (11 categories).

```javascript
import { checkSecurity } from '@lume/compiler'
const result = checkSecurity('delete all files from the server')
// → { safe: false, blocked: true, threats: [...] }
```

### `scanGeneratedCode(js, config?)`

Scan compiled JavaScript output for dangerous patterns.

```javascript
import { scanGeneratedCode } from '@lume/compiler'
const result = scanGeneratedCode('eval("dangerous")')
// → { safe: false, blocked: true, threats: [...] }
```

### `checkAIRateLimit(source, config?)`

Check for excessive AI call usage in a source file.

```javascript
import { checkAIRateLimit } from '@lume/compiler'
const result = checkAIRateLimit(source, { aiCallLimit: 5 })
// → { withinLimit: false, count: 12, limit: 5 }
```

### `fullSecurityAudit(source, compiledJs, config?)`

Run all three security layers (input, output, rate limit) in one call.

```javascript
import { fullSecurityAudit } from '@lume/compiler'
const audit = fullSecurityAudit(source, compiledJs)
// → { safe, blocked, inputThreats, outputThreats, rateLimit, summary }
```

### `scanASTNode(node, config?)`

Check a single AST node for security issues (Guardian live scanner).

---

## Formatting & Linting

### `format(source)`

Auto-format Lume source code. Returns formatted string.

### `lint(source, filename?)`

Lint source code and return findings array.

---

## Language Detection

### `detectLanguage(input)`

Detect the human language of input text (for multilingual mode).

```javascript
import { detectLanguage } from '@lume/compiler'
const lang = detectLanguage('crear una variable')
// → { language: 'es', confidence: 0.95 }
```

---

## Additional Exports

| Export | Module | Description |
|--------|--------|-------------|
| `NodeType` | `parser.js` | Enum of all AST node types |
| `patterns` | `pattern-library.js` | Raw pattern array (102 entries) |
| `stdlib` | `stdlib.js` | Standard library functions |
| `processTranscription` | `voice-input.js` | Voice transcription processing |
| `parseAppDescription` | `app-generator.js` | Parse app descriptions |
| `generateProjectStructure` | `app-generator.js` | Generate project scaffolds |
| `explainCode` | `explainer.js` | Explain code in English |
| `diffASTs` | `ast-differ.js` | AST-level diff |
| `createBundle` | `bundler.js` | Bundle creation |
| `formatError` | `error-formatter.js` | Human-readable error formatting |
| `didYouMean` | `error-formatter.js` | "Did you mean?" suggestions |

---

## Sub-package Imports

```javascript
import { tokenize } from '@lume/compiler/lexer'
import { parse } from '@lume/compiler/parser'
import { transpile } from '@lume/compiler/transpiler'
import { resolveEnglishFile } from '@lume/compiler/intent-resolver'
import { stdlib } from '@lume/compiler/stdlib'
import { format } from '@lume/compiler/formatter'
import { lint } from '@lume/compiler/linter'
```
