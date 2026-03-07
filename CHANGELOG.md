# Lume Changelog

## v0.1.0 — Milestone 1: Hello World (March 2026)

### Built
- **Lexer** (`src/lexer.js`) — Full tokenizer with:
  - All 50+ reserved keywords from the spec
  - String interpolation with `{expr}` segments
  - Natural language operators (`is`, `is greater than`, `is at least`, etc.)
  - Indentation tracking with INDENT/DEDENT tokens
  - Single-line, multi-line, and doc comments
  - Triple-quoted strings
  - Tab rejection with clear error message
- **Parser** (`src/parser.js`) — Recursive descent with Pratt-style precedence:
  - LetDeclaration, DefineDeclaration, ShowStatement, LogStatement, SetStatement
  - All expression types (binary, unary, member, index, call, interpolated string)
  - List and Map literals
  - Type annotations (placeholder)
  - Full operator precedence (unary > mult > add > comparison > equality > and > or)
- **Transpiler** (`src/transpiler.js`) — AST to clean JavaScript:
  - `let` → `let`, `define` → `const`, `show` → `console.log`
  - Interpolated strings → JS template literals
  - `set x to y` → `x = y`
  - All operators emit correctly with parenthesization
- **Runtime** (`src/runtime.js`) — Minimal:
  - `Result` type with `ok()`, `error()`, `unwrap()`, `match()`
  - AI call stubs (ask, think, generate) for future Milestone 3
- **CLI** (`bin/lume.js`) — Complete:
  - `lume run <file.lume>` — Compile and execute
  - `lume build <file.lume>` — Compile to .js file
  - `lume ast <file.lume>` — Print AST for debugging
  - `lume tokens <file.lume>` — Print token stream
  - `lume help` / `lume version`

### Test Results
- 32/32 tests passing
- Lexer: 11 tests
- Parser: 7 tests
- Transpiler: 5 tests
- End-to-End: 9 tests

### Target Program
```lume
let language = "Lume"
let version = 1
show "Hello from {language} v{version}"
```
**Output: `Hello from Lume v1` ✅**

### Design Decisions
1. String interpolation is handled in the lexer as INTERP_START/INTERP_EXPR/INTERP_END token
   segments, making the parser's job simple
2. Natural language operators (is, is greater than, etc.) are resolved in the lexer by
   peeking ahead for multi-word patterns, emitting standard comparison tokens
3. Indentation is tracked as explicit INDENT/DEDENT tokens in the token stream
4. The transpiler wraps binary expressions in parens for clarity in output
5. No external dependencies — pure Node.js implementation as specified
