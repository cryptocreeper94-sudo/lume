# CLI Reference

Lume v0.8.0 — Complete command-line reference.

## Core Commands

### `lume run <file>`
Execute a `.lume` file.

```bash
lume run hello.lume
lume run examples/todo.lume
```

### `lume build <file>`
Compile `.lume` to JavaScript. Outputs `<name>.js` alongside the source file.

```bash
lume build app.lume          # → app.js
lume build app.lume --quiet  # suppress diagnostics
lume build app.lume --lang=es  # multilingual mode
```

For English Mode files, this also generates:
- `.lume/compile-lock.json` — deterministic build lock
- Security certificate header in output

### `lume repl`
Start the interactive REPL (v1.0.0).

```
lume> let x = 42
→ 42
lume> show "Hello!"
→ Hello!
```

**REPL Commands:**

| Command | Description |
|---------|-------------|
| `.help` | Show all commands |
| `.mode` | Toggle English Mode |
| `.clear` | Clear screen |
| `.ast` | Show AST for last input |
| `.tokens` | Show tokens for last input |
| `.history` | Show session history |
| `.scope` | Show persistent variables |
| `.run <file>` | Run a .lume file in session |
| `.exit` | Exit |

**Features:** Tab-autocomplete, persistent history (`~/.lume_history`), arrow-key history navigation.

---

## Developer Tools

### `lume ast <file>`
Print the Abstract Syntax Tree as JSON.

```bash
lume ast hello.lume
```

### `lume tokens <file>`
Print the raw token stream from the lexer.

```bash
lume tokens hello.lume
```

### `lume fmt <file>`
Auto-format Lume source code.

```bash
lume fmt app.lume           # format in-place
lume fmt app.lume --check   # check without modifying
lume fmt app.lume --diff    # show diff
```

### `lume lint <file>`
Lint for errors and style issues.

```bash
lume lint app.lume
```

### `lume test [file]`
Run test blocks. Without a file, scans `tests/` and `examples/` for files containing `test` or `expect`.

```bash
lume test                     # run all tests
lume test tests/math.lume     # run specific file
```

---

## English Mode & AI Commands

### `lume explain <file>`
Explain any code (Lume, JS, or TS) in plain English. Uses the Reverse Mode engine.

```bash
lume explain app.lume             # annotate each line
lume explain app.lume --summary   # high-level summary
```

### `lume listen`
Read voice transcription from stdin and convert to Lume source.

```bash
echo "create a variable called name" | lume listen
lume listen --english   # force English Mode
```

### `lume voice`
Interactive voice-to-code session with real-time feedback.

```bash
lume voice                           # batch mode
lume voice --live                    # compile each line
lume voice --output=app.lume         # save to specific file
lume voice --review                  # review before compile
lume voice --engine=whisper          # specify speech engine
```

**Voice Commands:** `compile`/`done`, `undo`, `start over`, `read it back`, `pause`, `continue`, `delete line N`.

### `lume create <description>`
Generate a full-stack application scaffold from a description.

```bash
lume create "a blog with authentication"
lume create "an ecommerce store" --preview   # preview without writing
```

---

## Build & Deploy

### `lume bundle <file>`
Bundle for distribution as a single JS file.

```bash
lume bundle app.lume
lume bundle app.lume --target=browser
lume bundle app.lume --minify
```

### `lume compile <file>`
Compile to a native binary via Bun.

```bash
lume compile app.lume
```

### `lume watch <file>`
Watch for changes and auto-run.

```bash
lume watch app.lume
lume watch app.lume --build   # auto-build instead of run
```

---

## Integrity & Security

### `lume verify <file>`
Verify a compile lock for deterministic builds.

```bash
lume verify app.js
```

### `lume canonicalize <file>`
Normalize source to canonical form.

```bash
lume canonicalize app.lume
```

---

## Project Management

### `lume init`
Create a new Lume project in the current directory.

```bash
mkdir my-app && cd my-app
lume init
```

Creates: `main.lume`, `package.json`, `README.md`.

### `lume docs <file>`
Generate documentation from source comments.

```bash
lume docs src/    # generate docs for all files
```

### `lume diff <a> <b>`
AST-level diff between two `.lume` files.

```bash
lume diff v1.lume v2.lume
```

### `lume upgrade`
Check for pattern library version updates.

```bash
lume upgrade
```

---

## Information

### `lume version`
Print version. Also responds to `--version` and `-v`.

### `lume help`
Print full help. Also responds to `--help` and `-h`.

### No arguments
Shows a friendly welcome with quick-start tips.
