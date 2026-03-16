# Lume Syntax Reference

> Complete language syntax for Lume v0.8

## Variables

```lume
let name = "Alice"           // immutable binding
define count = 0              // mutable value
set count = count + 1         // reassignment (define only)
```

## Data Types

| Type | Example | Description |
|------|---------|-------------|
| `text` | `"hello"` | String with `{interpolation}` |
| `number` | `42`, `3.14` | Integer or float |
| `boolean` | `true`, `false` | Logical value |
| `null` | `null` | Absence of value |
| `list` | `[1, 2, 3]` | Ordered collection |
| `map` | `{ key: "value" }` | Key-value pairs |

### Strings

```lume
"simple string"
"interpolated: {variable}"
"""
triple-quoted
multi-line
"""
```

### Escape Sequences
`\n` newline, `\t` tab, `\\` backslash, `\"` quote, `\{` literal brace

## Functions

```lume
define greet(name):
    return "Hello, {name}!"

// Arrow functions (inline)
let double = x -> x * 2

// Default parameters
define connect(host, port default 3000):
    fetch "http://{host}:{port}"
```

## Control Flow

```lume
// Conditionals
if x is greater than 10:
    show "big"
else if x is greater than 5:
    show "medium"
else:
    show "small"

// Natural language operators
if name is "Alice":           // ==
if age is not 0:              // !=
if score is at least 90:      // >=
if count is at most 100:      // <=
if x is greater than y:       // >
if x is less than y:          // <
```

## Loops

```lume
// For-each
for each item in items:
    show item

// For range
for each i in list.range(0, 10):
    show i

// While
while running:
    process_next()

// Break / Continue
for each x in data:
    if x is null:
        continue
    if x is "stop":
        break
```

## Type Definitions

```lume
type User:
    name: text
    age: number
    email: text
    active: boolean

type ApiResponse:
    status: number
    body: any
    headers: map of text
```

## Result Types

```lume
// Functions return ok or error
define divide(a, b):
    if b is 0:
        fail "Division by zero"
    return a / b

// Pattern: maybe type
define find_user(id): maybe User
    let user = database.get(id)
    if user is null:
        return null
    return user
```

## Pipe Operator

```lume
let result = data
    |> list.filter(x -> x > 0)
    |> list.map(x -> x * 2)
    |> list.sort()
    |> list.take(10)
```

## AI Integration

```lume
let answer = ask "What is the capital of France?"
let analysis = think "Analyze this data: {data}"
let content = generate "A product description for {product}"
```

## Error Handling

```lume
try:
    let data = fetch "/api/endpoint"
    process(data)
with error:
    show "Error: {error}"
    log "Failure at {time.timestamp()}: {error}"
```

## Imports

```lume
use text from stdlib
use math from stdlib
use MyModule from "./my-module.lume"
use { specific_function } from "./utils.lume"
```

## Self-Sustaining Runtime

```lume
// Monitoring
monitor:
    interval: 5000
    alert_on:
        error_rate: 0.1

// Healable functions (auto-retry)
@healable
define fetch_data():
    return fetch "/api/data"

// Optimization hints
@optimize
define heavy_computation(input):
    // Auto-memoized by runtime
    return complex_calculation(input)
```

## Comments

```lume
// Single-line comment
/// Doc comment (attached to next declaration)
/* Block comment */
```

## Indentation

Lume uses **4-space indentation** (no tabs). Blocks are defined by indentation level, similar to Python.
