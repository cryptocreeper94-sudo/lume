# ✦ Lume

**The AI-Native Programming Language** — where `ask gpt4` is a keyword, not a library.

```
let answer = ask gpt4 "Summarize this article"
show answer
```

[![CI](https://github.com/cryptocreeper94-sudo/lume/actions/workflows/ci.yml/badge.svg)](https://github.com/cryptocreeper94-sudo/lume/actions/workflows/ci.yml) [![Version](https://img.shields.io/badge/version-0.9.0-blue)]() [![License](https://img.shields.io/badge/license-MIT-green)]()

---

## Quick Start

```bash
# Install
npm install -g @lume/compiler

# Run your first program
echo 'show "Hello from Lume!"' > hello.lume
lume run hello.lume

# Or use the REPL
lume repl
```

## 5 Minutes to Your First Program

**1. Variables & Output**
```
let name = "World"
let count = 42
show "Hello {name}, the answer is {count}"
```

**2. Functions**
```
to greet(name: text) -> text:
    return "Hello, " + name + "!"

show greet("Lume")
```

**3. Control Flow**
```
for i in 1 to 10:
    if i % 2 == 0:
        show i + " is even"
```

**4. AI as a Keyword**
```
let summary = ask gpt4 "Summarize: " + article
let ideas = think claude "Generate 5 product names for: " + description
show summary
```

**5. English Mode** — Write code in plain English
```
mode: english

get the user profile from the database
if the user is not verified
    send an email to the user
show the dashboard
```

**6. Verify — Natural Language Assertions**
```
let count = 10
let users = ["alice", "bob"]

verify count is 10
verify users is not empty
verify count is greater than 5
```

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI as Syntax** | `ask`, `think`, `generate` are keywords — no SDK needed |
| 🗣️ **English Mode** | Write code in plain English (114+ patterns) |
| 🌍 **Multilingual** | Write in any human language — Spanish, Japanese, Hindi... |
| 🎤 **Voice-to-Code** | Speak your code, Lume compiles it |
| 🔄 **Self-Sustaining Runtime** | Programs monitor, heal, optimize, and evolve themselves |
| 🔒 **Security Layer** | 11 threat categories, Guardian scanner, raw block protection |
| 📦 **Full-Stack Generator** | `lume create "an ecommerce store"` scaffolds entire apps |
| 🔍 **Reverse Mode** | `lume explain file.js` — any code explained in English |
| ✅ **Verify Keyword** | Natural language assertions: `verify count is 10` |
| 🚀 **Deploy Engine** | First-class deployment: `deploy to render from "main"` |
| ⚙️ **Config Language** | Type-safe config as code — replaces YAML/TOML/JSON |
| 🎓 **Education Mode** | Beginner-tuned tolerance: `draw a big red circle` |
| ♿ **Accessibility** | Complete eyes-free programming with auditory feedback |

## CLI Commands

```
lume run <file>          Run a .lume file
lume build <file>        Compile to JavaScript
lume repl                Interactive REPL
lume create <desc>       Generate a full-stack app
lume explain <file>      Explain any code in English
lume ast <file>          Show Abstract Syntax Tree
lume tokens <file>       Show token stream
lume fmt <file>          Auto-format source
lume lint <file>         Lint for errors and style
lume compile <file>      Compile to native binary (via Bun)
lume diff <a> <b>        AST-level diff between files
lume watch <file>        Watch and re-run on changes
lume test <file>         Run inline tests
lume listen              Voice-to-code (browser mic)
lume bundle <file>       Bundle for distribution
lume verify <file>       Verify compile lock
lume deploy <target>     Deploy to render/vercel/netlify
lume heal status         View self-healing status
```

## Examples

```bash
lume run examples/hello.lume        # Hello World
lume run examples/fizzbuzz.lume     # Classic FizzBuzz
lume run examples/calculator.lume   # Calculator with error handling
lume run examples/todo.lume         # Todo list app
lume run examples/discount.lume     # Pattern matching
```

## Project Stats

- **CI tested** on Node 18, 20, and 22 on every push
- **114+ patterns** in the English Mode resolver
- **15K+ lines** of source code
- **38 example programs**
- **20+ CLI commands** including `estimate` (cost analysis) and `--strict-english` (deterministic mode)
- **13 milestones** complete
- **5 vertical applications** — DevOps, Testing, Config, Education, Accessibility
- **MIT licensed**

## Documentation

- [Getting Started](docs/getting-started.md) — Your first Lume program in 5 minutes
- [English Mode](docs/patterns.md) — Writing code in plain English (102 patterns)
- [CLI Reference](docs/cli.md) — All commands and flags
- [API Reference](docs/api.md) — Programmatic usage of `@lume/compiler`
- [Voice-to-Code](docs/voice.md) — Speak your code
- [Self-Sustaining Runtime](docs/runtime.md) — How programs heal themselves
- [Security](docs/security.md) — The Guardian security layer
- [Vertical Applications](docs/verticals.md) — Deploy, Verify, Config, Education, Accessibility

## Part of the Trust Layer Ecosystem

Lume is part of the [Trust Layer](https://dwtl.io) ecosystem — connected through shared identity, shared design, and shared philosophy.

---

**Built with ❤️ by DarkWave Studios** · [lume.dev](https://lume-lang.vercel.app) · MIT License
