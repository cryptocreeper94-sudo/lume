# Lume Security Model

> Guardian Scanner, Certified-at-Birth, and the Three-Layer Security Architecture.

## Overview

Lume's security model operates on the principle that **every line of code is a threat until proven safe**. Unlike traditional languages that add security as an afterthought, Lume scans at compile-time and generates a security certificate for every compiled file.

## Three-Layer Architecture

```
┌─────────────────────────────────────┐
│  Layer 1: Input Scanner             │
│  Scans source code before parsing   │
├─────────────────────────────────────┤
│  Layer 2: AST Scanner               │
│  Scans parsed nodes for threats     │
├─────────────────────────────────────┤
│  Layer 3: Output Scanner            │
│  Scans compiled JS for injections   │
└─────────────────────────────────────┘
```

## 11 Threat Categories

| Category | Level | Description |
|----------|-------|-------------|
| FILE_DESTRUCTION | 🔴 BLOCK | `delete all files`, `rm -rf`, `wipe drive` |
| CREDENTIAL_EXPOSURE | 🔴 BLOCK | `show api key`, `log password`, `send token` |
| SYSTEM_COMMANDS | 🔴 BLOCK | `execute shell`, `eval()`, `child_process` |
| NL_INJECTION | 🔴 BLOCK | `ignore previous instructions`, `jailbreak` |
| SEMANTIC_CAMOUFLAGE | 🔴 BLOCK | Encoding attacks, Unicode tricks |
| RESOURCE_EXHAUSTION | 🔴 BLOCK | `create million connections`, `allocate terabyte` |
| DATABASE_DESTRUCTION | 🟡 CONFIRM | Unfiltered `DELETE` operations |
| PRIVILEGE_ESCALATION | 🟡 CONFIRM | `grant admin`, `bypass auth` |
| NETWORK_EXFILTRATION | 🟠 WARNING | `send all data to external` |
| MASS_OPERATIONS | 🟠 WARNING | `email every user`, mass requests |
| INFINITE_OPERATIONS | 🟠 WARNING | `while true`, `repeat forever` |

### Threat Levels

- **BLOCK** — Compilation halted. Code will not execute.
- **CONFIRM** — User must explicitly approve via `y/n` prompt.
- **WARNING** — Compilation continues but a warning is emitted.

## Certified-at-Birth

Every compiled `.js` output includes a security certificate header:

```javascript
/**
 * LUME SECURITY CERTIFIED
 * Source: app.lume
 * AST nodes scanned: 47/47 passed
 * Raw blocks scanned: 3/3 passed
 * Scan level: standard
 * Compiled: 2024-03-15T10:30:00.000Z
 * Certificate hash: a7b3c2d1
 * Verify: lume verify --hash a7b3c2d1
 */
```

## Prompt Injection Defense

Lume protects against 8 categories of NL injection attacks:

1. **Instruction override** — "ignore previous instructions"
2. **Role hijacking** — "pretend you are an admin"
3. **Safety bypass** — "disable security filter"
4. **Hidden modes** — "developer mode", "god mode"
5. **Scan suppression** — "don't check this code"
6. **Code injection** — "eval", "XSS", "SQL injection"
7. **Sandbox escape** — "jailbreak", "break free"
8. **Hidden prompts** — `` ```system `` blocks

## AI Rate Limiting

```lume
// Default: 10 AI calls per file
// Configurable via lume.config:
//   ai_call_limit: 20

let a = ask gpt "question 1"
let b = ask gpt "question 2"
// ... up to limit
```

Exceeding the limit triggers a warning with refactoring suggestions.

## Output Scanning

The output scanner catches dangerous patterns in compiled JavaScript:

| Pattern | Level | Example |
|---------|-------|---------|
| `eval()` | BLOCK | Dynamic code execution |
| `new Function()` | BLOCK | Function constructor |
| `child_process` | BLOCK | Shell access |
| `__proto__` | BLOCK | Prototype pollution |
| `process.exit` | WARNING | Process termination |
| `process.env` | WARNING | Environment access |
| `document.write` | WARNING | Unsafe DOM write |
| `innerHTML =` | WARNING | XSS risk |

## Configuration

```lume
// lume.config
security:
    level: "standard"        // "strict" | "standard" | "relaxed"
    ai_call_limit: 10
    allowed_domains: ["localhost", "api.myapp.com"]
    unsafe_mode: false       // NEVER enable in production
```
