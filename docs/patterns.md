# Pattern Library Reference

The Lume Pattern Library is the core of **English Mode** — Layer A of the Intent Resolver. It converts natural English sentences into AST nodes without needing an AI model.

**102 patterns** organized by category.

---

## Data Access

| Pattern | Example | AST Node |
|---------|---------|----------|
| get/fetch/retrieve/load X from Y | `get the user from the database` | `VariableAccess { target, source }` |
| find/look up/access X | `find the active users` | `VariableAccess { target }` |

## Output

| Pattern | Example | AST Node |
|---------|---------|----------|
| show/display/render/print X | `show the dashboard` | `ShowStatement { value }` |
| show X on/in Y | `display the chart on screen` | `ShowStatement { value, target }` |
| alert/notify/toast X | `alert the session expired` | `ShowStatement { value, target: "alert" }` |

## CRUD Operations

| Pattern | Example | AST Node |
|---------|---------|----------|
| create/make/build X | `create a new user` | `CreateOperation { target }` |
| create X with fields | `create a post with title, body` | `CreateOperation { target, fields }` |
| update/modify/change X to Y | `update the status to active` | `UpdateOperation { target, value }` |
| save/store/persist X to Y | `save the record to the database` | `StoreOperation { value, target }` |
| delete/remove/destroy X | `delete the old records` | `DeleteOperation { target }` |

## Variables

| Pattern | Example | AST Node |
|---------|---------|----------|
| set/let/define X to Y | `set the count to 0` | `VariableDeclaration { name, value }` |
| set X as Y | `let the name be "Alice"` | `VariableDeclaration { name, value }` |

## Math

| Pattern | Example | AST Node |
|---------|---------|----------|
| add X to Y | `add 10 to the total` | `BinaryExpression { op: "+", left, right }` |
| subtract X from Y | `subtract 5 from the balance` | `BinaryExpression { op: "-", left, right }` |
| multiply X by Y | `multiply the quantity by 3` | `BinaryExpression { op: "*", left, right }` |
| increment/increase X | `increment the counter` | `IncrementOperation { target, amount }` |
| increment X by N | `increase the score by 10` | `IncrementOperation { target, amount }` |
| decrement/decrease X | `decrement the retry count` | `DecrementOperation { target, amount }` |

## Control Flow

| Pattern | Example | AST Node |
|---------|---------|----------|
| if/when/check if X | `if the user is verified` | `IfStatement { condition }` |
| if X then Y | `if empty then show an error` | `IfStatement { condition, body }` |
| for each X in Y | `for each item in the list` | `ForEachLoop { item, collection }` |
| while/as long as X | `while there are items left` | `WhileLoop { condition }` |
| repeat N times | `repeat 5 times` | `RepeatLoop { count }` |

## Data Operations

| Pattern | Example | AST Node |
|---------|---------|----------|
| sort X by Y asc/desc | `sort the users by name ascending` | `SortOperation { target, key, dir }` |
| swap X and Y | `swap the first and last elements` | `SwapOperation { left, right }` |
| toggle X | `toggle the dark mode` | `ToggleOperation { target }` |
| reset/clear/empty X | `reset the search form` | `ResetOperation { target }` |
| trim X | `trim the user input` | `CallExpression { callee: "trim" }` |

## Communication

| Pattern | Example | AST Node |
|---------|---------|----------|
| send/fire/dispatch X to Y | `send the notification to the user` | `SendOperation { payload, target }` |
| return/yield X | `return the sorted list` | `ReturnStatement { value }` |

## Timing

| Pattern | Example | AST Node |
|---------|---------|----------|
| wait/delay/sleep N units | `wait 2 seconds` | `DelayStatement { duration }` |

## AI Integration

| Pattern | Example | AST Node |
|---------|---------|----------|
| ask the ai/gpt/model to X | `ask the ai to summarize the report` | `AskExpression { prompt }` |

## Monitoring

| Pattern | Example | AST Node |
|---------|---------|----------|
| monitor/track/watch X | `monitor the server health` | `MonitorBlock { target }` |

## Navigation

| Pattern | Example | AST Node |
|---------|---------|----------|
| redirect/navigate/go to X | `redirect the user to /dashboard` | `NavigateOperation { target }` |

## Ranges

| Pattern | Example | AST Node |
|---------|---------|----------|
| from N to M | `from 1 to 100` | `RangeExpression { start, end }` |

## Error Handling

| Pattern | Example | AST Node |
|---------|---------|----------|
| throw/raise an error: X | `throw an error: not found` | `ThrowStatement { message }` |
| try to X or fail with Y | `try to connect or fail with timeout` | `TryBlock { action, fallback }` |

---

## How It Works

1. Each input line is tested against patterns in order
2. First match wins — the sentence is converted to an AST node
3. Unmatched lines fall through to **Layer B** (AI resolver)
4. The **Tolerance Chain** (7 steps) attempts auto-correction before AI fallback

## Adding Custom Patterns

Patterns are defined in `src/intent-resolver/pattern-library.js`. Each pattern has:

```javascript
{
    match: /regex/i,           // regex to match input
    type: 'NodeType',          // AST node type
    extract: (groups) => ({    // extract fields from regex groups
        type: 'NodeType',
        field: groups[1],
    })
}
```
