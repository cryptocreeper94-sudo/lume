# Lume — VS Code Extension

**Syntax highlighting, snippets, and language support** for the [Lume](https://lume-lang.org) AI-native programming language.

## Features

- **Syntax Highlighting** — Full TextMate grammar for `.lume` files
  - Keywords, AI model keywords (`ask`, `think`, `generate`)
  - Strings with interpolation, numbers, operators
  - Type annotations, function definitions, comments
- **19 Snippets** — Common patterns: functions, loops, AI queries, English Mode, tests
- **Smart Editing** — Auto-close brackets/strings, indent on `:` blocks, folding
- **Language Configuration** — Comment toggling, bracket matching, word boundaries

## Snippets

| Prefix | Description |
|--------|-------------|
| `to` | Function definition |
| `totype` | Function with typed params + return type |
| `if` | If block |
| `ifelse` | If-else block |
| `for` | For-each loop |
| `forrange` | Numeric range loop |
| `while` | While loop |
| `show` | Print output |
| `let` | Variable declaration |
| `ask` | Ask AI model |
| `think` | Think with AI model |
| `mode` | English Mode file header |
| `type` | Type definition |
| `test` | Test assertion block |
| `when` | Pattern matching |
| `pipe` | Pipe operator chain |
| `fetch` | HTTP fetch |
| `repeat` | Repeat N times |

## Installation

### From VSIX

```bash
cd editor/vscode
npx -y @vscode/vsce package
code --install-extension lume-language-0.8.0.vsix
```

### Manual

1. Copy the `editor/vscode` folder to `~/.vscode/extensions/lume-language`
2. Restart VS Code

## Part of the Trust Layer Ecosystem

Built by [DarkWave Studios](https://dwtl.io) · [lume-lang.org](https://lume-lang.org)
