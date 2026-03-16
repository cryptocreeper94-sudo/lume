# Lume Standard Library Reference

> All built-in modules and their functions.

## Importing

```lume
use text from stdlib
use math from stdlib
use list from stdlib
use time from stdlib
use convert from stdlib
```

---

## `text` Module

| Function | Signature | Description |
|----------|-----------|-------------|
| `upper` | `(s) → text` | Convert to uppercase |
| `lower` | `(s) → text` | Convert to lowercase |
| `trim` | `(s) → text` | Strip whitespace |
| `split` | `(s, sep) → list` | Split by separator |
| `join` | `(arr, sep?) → text` | Join with separator (default: `", "`) |
| `replace` | `(s, old, new) → text` | Replace all occurrences |
| `contains` | `(s, sub) → boolean` | Check substring |
| `starts_with` | `(s, prefix) → boolean` | Check prefix |
| `ends_with` | `(s, suffix) → boolean` | Check suffix |
| `length` | `(s) → number` | String length |
| `reverse` | `(s) → text` | Reverse string |
| `repeat` | `(s, n) → text` | Repeat n times |
| `pad_left` | `(s, len, ch?) → text` | Pad left (default: space) |
| `pad_right` | `(s, len, ch?) → text` | Pad right (default: space) |
| `slice` | `(s, start, end) → text` | Substring extraction |
| `chars` | `(s) → list` | Split into characters |

---

## `math` Module

| Function | Signature | Description |
|----------|-----------|-------------|
| `abs` | `(n) → number` | Absolute value |
| `ceil` | `(n) → number` | Round up |
| `floor` | `(n) → number` | Round down |
| `round` | `(n) → number` | Round to nearest |
| `min` | `(...nums) → number` | Minimum value |
| `max` | `(...nums) → number` | Maximum value |
| `pow` | `(base, exp) → number` | Exponentiation |
| `sqrt` | `(n) → number` | Square root |
| `log` | `(n) → number` | Natural logarithm |
| `sin` | `(n) → number` | Sine (radians) |
| `cos` | `(n) → number` | Cosine (radians) |
| `tan` | `(n) → number` | Tangent (radians) |
| `random` | `() → number` | Random float [0, 1) |
| `random_int` | `(min, max) → number` | Random integer [min, max] |
| `clamp` | `(n, min, max) → number` | Constrain to range |
| `lerp` | `(a, b, t) → number` | Linear interpolation |
| `sum` | `(arr) → number` | Sum of array |
| `average` | `(arr) → number` | Average of array |

**Constants:** `math.pi` (3.14159...), `math.e` (2.71828...)

---

## `list` Module

| Function | Signature | Description |
|----------|-----------|-------------|
| `first` | `(arr) → any` | First element |
| `last` | `(arr) → any` | Last element |
| `rest` | `(arr) → list` | All except first |
| `take` | `(arr, n) → list` | First n elements |
| `drop` | `(arr, n) → list` | Skip first n |
| `map` | `(arr, fn) → list` | Transform each element |
| `filter` | `(arr, fn) → list` | Keep matching elements |
| `reduce` | `(arr, fn, init) → any` | Accumulate values |
| `find` | `(arr, fn) → any` | First match or null |
| `contains` | `(arr, val) → boolean` | Check membership |
| `unique` | `(arr) → list` | Remove duplicates |
| `flat` | `(arr) → list` | Flatten one level |
| `sort` | `(arr, fn?) → list` | Sorted copy |
| `reverse` | `(arr) → list` | Reversed copy |
| `zip` | `(a, b) → list` | Pair elements |
| `range` | `(start, end, step?) → list` | Generate range |
| `chunk` | `(arr, size) → list` | Split into chunks |
| `group_by` | `(arr, fn) → map` | Group by key function |
| `count` | `(arr) → number` | Array length |
| `empty` | `(arr) → boolean` | Check if empty |

---

## `time` Module

| Function | Signature | Description |
|----------|-----------|-------------|
| `now` | `() → number` | Current timestamp (ms) |
| `today` | `() → text` | Today's date (YYYY-MM-DD) |
| `timestamp` | `() → text` | ISO 8601 timestamp |
| `format` | `(ms, fmt) → text` | Format timestamp ("iso", "date") |
| `elapsed` | `(start) → number` | Milliseconds since start |
| `sleep` | `(ms) → Promise` | Async pause |

---

## `convert` Module

| Function | Signature | Description |
|----------|-----------|-------------|
| `to_number` | `(val) → number` | Convert to number |
| `to_text` | `(val) → text` | Convert to string |
| `to_boolean` | `(val) → boolean` | Convert to boolean |
| `to_json` | `(val) → text` | Serialize to JSON |
| `from_json` | `(s) → any` | Parse JSON string |
