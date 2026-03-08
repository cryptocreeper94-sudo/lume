# Getting Started with Lume

## Installation

```bash
npm install -g @lume/compiler
```

Requires **Node.js 18+**.

## Your First Program

Create a file called `hello.lume`:

```
show "Hello from Lume!"
```

Run it:

```bash
lume run hello.lume
```

Output: `Hello from Lume!`

## Variables

```
let name = "Alice"
let age = 30
show "Name: {name}, Age: {age}"
```

Lume supports **string interpolation** with `{variable}` inside strings.

## Functions

Functions are defined with `to` and support typed parameters:

```
to greet(name: text) -> text:
    return "Hello, " + name + "!"

to add(a: number, b: number) -> number:
    return a + b

show greet("World")    // Hello, World!
show add(10, 20)       // 30
```

## Control Flow

```
// If/else
if age > 18:
    show "Adult"
else:
    show "Minor"

// For loops
for i in 1 to 5:
    show i

// For-each
let items = ["apple", "banana", "cherry"]
for each item in items:
    show item

// Repeat
repeat 3 times:
    show "tick"

// Pattern matching
when status is:
    "active"  -> show "User is active"
    "banned"  -> show "User is banned"
    default   -> show "Unknown status"
```

## AI as a First-Class Keyword

```
// Ask any AI model — it's a keyword, not a library
let summary = ask gpt4 "Summarize this article: " + text
let ideas = think claude "Generate product names for: " + product
let image = generate dalle3 "A sunset over mountains"

show summary
```

Set your API key: `export OPENAI_API_KEY=your-key`

## English Mode

Write code in plain English — Lume understands 102 patterns:

```
mode: english

get the user profile from the database
show the user name on screen
if the user is not verified
    send a verification email to the user
save the activity log to the database
```

## Self-Sustaining Runtime

Lume programs can monitor, heal, optimize, and evolve themselves:

```
monitor:
    track performance
    alert when error_rate > 0.1

heal:
    on error, retry 3 times with backoff
    fallback to claude if gpt4 fails

optimize:
    cache frequently called functions
    parallelize independent operations

evolve:
    benchmark ai models weekly
    learn from usage patterns
```

## What's Next?

- Explore the [examples/](../examples/) directory
- Try `lume repl` for interactive coding
- Run `lume create "a todo app"` to scaffold a project
- Read about the [Security Layer](security.md)
