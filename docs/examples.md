# Lume Examples Guide

> Walkthrough of all 25 example programs.

## Getting Started

Run any example with:
```bash
lume run examples/<name>.lume
```

## Example Categories

### 🟢 Beginner

| Example | Description | Key Concepts |
|---------|-------------|-------------|
| `hello.lume` | Hello World | `show`, string interpolation |
| `calculator.lume` | Basic calculator | Variables, functions, operators |
| `fizzbuzz.lume` | FizzBuzz challenge | Loops, conditionals, modulo |
| `todo.lume` | Todo list app | Lists, CRUD operations |
| `discount.lume` | Price calculator | Conditionals, math operations |

### 🟡 Intermediate

| Example | Description | Key Concepts |
|---------|-------------|-------------|
| `api-server.lume` | Simple API | Routes, JSON responses |
| `english-mode.lume` | English Mode basics | Natural language patterns |
| `multilingual.lume` | Multi-language output | String operations, localization |
| `interop_demo.lume` | JavaScript interop | `use`, module integration |
| `ai_demo.lume` | AI integration | `ask`, `think`, `generate` |

### 🔴 Advanced

| Example | Description | Key Concepts |
|---------|-------------|-------------|
| `chatbot.lume` | AI chatbot with memory | Conversation history, context building |
| `web-scraper.lume` | GitHub scraper | HTTP fetch, @healable, JSON parsing |
| `rest-api.lume` | Full CRUD REST API | Routes, validation, middleware |
| `dashboard.lume` | Real-time monitoring | Data aggregation, alerts, formatting |
| `game-logic.lume` | Turn-based RPG | Combat, leveling, inventory, NPC AI |
| `data-pipeline.lume` | ETL pipeline | Extract/transform/load, validation |
| `cli-tool.lume` | CLI argument parser | Commands, flags, routing |
| `file-watcher.lume` | File system monitor | Events, pattern matching, rules |
| `auth-system.lume` | JWT auth + RBAC | Hashing, tokens, permissions |
| `self-healing.lume` | Self-sustaining runtime | @healable, monitor, heal/optimize/evolve |
| `voice-demo.lume` | Voice-to-code pipeline | Homophones, fillers, corrections |
| `english-advanced.lume` | Complex NL patterns | Pipes, events, assertions, CRUD |
| `blockchain-stamp.lume` | Trust Layer blockchain | Hashing, proof-of-work, hallmarks |

## Highlighted Examples

### Chatbot — AI with Memory

Demonstrates building an AI assistant with conversation history that maintains context across multiple turns. Shows how `ask` integrates with structured data management.

### Game Logic — Turn-Based RPG

A complete turn-based combat system with character creation, leveling, inventory management, and NPC encounters. Demonstrates complex state machines in Lume.

### Self-Healing — Runtime Demo

Shows all 4 layers of the Self-Sustaining Runtime: `@healable` auto-retry, monitoring configuration, circuit breakers, and adaptive optimization.

### Auth System — Full Authentication

Implements JWT-style tokens, password hashing, role-based access control (RBAC), session management, and account lockout — all in pure Lume.
