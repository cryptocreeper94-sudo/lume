# Lume Error Codes Reference

> Complete catalog of Lume error and warning codes with explanations and fixes.

## Compiler Errors (E-series)

| Code | Name | Description | Fix |
|------|------|-------------|-----|
| `E001` | Syntax Error | Unexpected token or malformed syntax | Check for missing colons, brackets, or quotes |
| `E002` | Type Error | Type mismatch in operation | Verify operand types match the operator |
| `E003` | Security Block | Guardian Scanner blocked dangerous pattern | Remove or refactor the flagged instruction |
| `E004` | Undefined Variable | Variable used before declaration | Add `let` or `define` declaration |
| `E005` | Undefined Function | Function called but never defined | Check spelling or add function definition |
| `E006` | Import Error | Module not found or invalid import | Verify module path and export names |
| `E007` | Indentation Error | Tab characters or inconsistent spacing | Use 4-space indentation consistently |

## Warnings (W-series)

| Code | Name | Description | Fix |
|------|------|-------------|-----|
| `W001` | Unused Variable | Declared variable is never read | Remove the variable or use it |
| `W002` | Shadowed Variable | Inner scope variable shadows outer | Rename to avoid confusion |
| `W003` | Implicit Any | Type could not be inferred | Add explicit type annotation |
| `W004` | Security Warning | Potentially risky operation detected | Review and add safeguards |

## Lint Rules (L-series)

| Code | Name | Description | Fix |
|------|------|-------------|-----|
| `L001` | Tab Character | Tab used for indentation | Replace with 4 spaces |
| `L002` | Bad Indentation | Non-multiple-of-4 indentation | Adjust to 4-space increments |
| `L003` | Trailing Whitespace | Spaces at end of line | Remove trailing spaces |
| `L010` | Function Naming | camelCase function name | Use `snake_case` |
| `L011` | Variable Naming | camelCase variable name | Use `snake_case` |
| `L012` | Type Naming | Lowercase type name | Use `PascalCase` |
| `L020` | Unused Variable | Declared but never referenced | Remove or use the variable |
| `L030` | AI Result Unused | AI call result not stored | Assign to a variable |
| `L031` | Short AI Prompt | Prompt too short for good results | Write a more descriptive prompt |
| `L040` | Line Length | Line exceeds 120 characters | Break into multiple lines |
| `L041` | Blank Lines | 3+ consecutive blank lines | Reduce to 2 max |
| `L050` | Missing Colon | `if`/`for`/`while` without colon | Add `:` at end of line |
| `L051` | Assignment in Condition | Single `=` in if condition | Use `==` for comparison |

## English Mode Lint (LUME-L series)

| Code | Name | Description | Fix |
|------|------|-------------|-----|
| `LUME-L001` | Non-canonical Verb | Using synonym instead of canonical verb | Use the canonical: get, set, show, create, etc. |
| `LUME-L002` | Vague Pronoun | "it", "this", "that" without clear referent | Use specific names |
| `LUME-L003` | Unbounded Operation | "delete all" without limit | Add a filter or limit clause |
| `LUME-L004` | Non-compilable | "make it work", "fix the bug" | Write specific, actionable instructions |
| `LUME-L006` | Overly Verbose | Instruction exceeds 15 words | Break into shorter statements |
| `LUME-L007` | Missing Error Handling | Network call without try/with | Wrap in try/with block |

## Reading Error Messages

Lume error messages follow this format:

```
✖ [E001] Syntax Error at test.lume:5:10
  |
5 | if x > 5
  |          ^ Expected ':' after condition
  |
  💡 Suggestion: Add a colon at the end — `if x > 5:`
```

- **✖** = Error (compilation stops)
- **△** = Warning (compilation continues)
- **○** = Style suggestion
- **💡** = Auto-fix suggestion
