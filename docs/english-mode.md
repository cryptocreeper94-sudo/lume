# Lume English Mode — Pattern Reference

> All deterministic patterns that compile natural language to Lume code.

## Overview

English Mode allows writing Lume programs using natural language sentences. The Intent Resolver converts these sentences to AST nodes using **deterministic pattern matching** — no LLM required.

```lume
mode: english

create a user with name "Alice" and email "alice@lume.dev"
get all users where status is "active"
show the results
```

## Canonical Verbs

English Mode enforces a set of **canonical verbs** for consistency:

| Canonical | Alternatives (flagged by linter) |
|-----------|----------------------------------|
| `get` | grab, fetch, retrieve, obtain, pull |
| `set` | assign, put, place |
| `show` | display, print, output, render |
| `create` | make, build, construct, generate |
| `delete` | remove, destroy, erase, drop |
| `save` | store, persist, write, record |
| `send` | transmit, push, deliver |
| `update` | modify, change, alter, edit |
| `check` | verify, validate, confirm, test |
| `find` | search, locate, lookup, query |

## CRUD Patterns

### Create
```
create a user with name "Alice" and email "alice@lume.dev"
create new product with price 29.99
add item to the cart
```

### Read
```
get the user where id is 1
get all orders where status is "pending"
find users where age is greater than 18
```

### Update
```
update the user where id is 1 set name to "Bob"
set the status to "complete"
increment the counter by 1
```

### Delete
```
delete the user where id is 1
remove item from the list
clear the cache
```

## Conditional Patterns

```
if the user is logged in:
    show the dashboard

if the temperature is greater than 100:
    send alert

if the list is empty:
    show "no results"
```

## Loop Patterns

```
for each user in the list:
    show user.name

repeat 10 times:
    process next item

while the queue is not empty:
    process the next message
```

## Data Operations

```
sort the users by name
filter orders where total is greater than 100
group items by category
count the active users
```

## Pipe Patterns

```
get all sales
    |> filter where amount is greater than 100
    |> sort by date
    |> take the first 10
```

## AI Patterns

```
ask "What is the meaning of this text: {input}"
think "Analyze the sentiment of: {review}"
generate "A summary of: {document}"
```

## Error Handling Patterns

```
try:
    fetch data from the API
with error:
    show "Something went wrong: {error}"
```

## Linter Rules

| Code | Rule | Description |
|------|------|-------------|
| `LUME-L001` | Non-canonical verb | Use canonical verbs only |
| `LUME-L002` | Vague pronoun | "it", "this", "that" without referent |
| `LUME-L003` | Unbounded operation | "delete all" without limit |
| `LUME-L004` | Non-compilable | "make it work", "fix the bug" |
| `LUME-L006` | Overly verbose | Instructions over 15 words |
| `LUME-L007` | Missing error handling | Network ops without try/with |
