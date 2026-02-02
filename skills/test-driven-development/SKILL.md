---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
phases: [E, V]
---

# Test-Driven Development (TDD)

## The Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.** Violating the letter IS violating the spirit.

## Red-Green-Refactor Cycle

### RED: Write a Failing Test
1. Write the simplest test that describes the desired behavior
2. Run it — it MUST fail
3. If it passes, the test proves nothing. Write a better test.

### GREEN: Make It Pass
1. Write the MINIMUM code to make the test pass
2. No extra features. No "while I'm here" improvements.
3. Run the test — it MUST pass now.

### REFACTOR: Clean Up
1. Improve code structure while keeping tests green
2. Run tests after each change
3. If any test fails, undo the refactoring step

## Quick Reference

```
Write test → Run (FAIL) → Write code → Run (PASS) → Refactor → Run (PASS) → Commit
```

## Checklist

- [ ] Failing test written before any implementation code
- [ ] Test actually fails on first run (not a false positive)
- [ ] Minimum code written to make test pass
- [ ] Test passes after implementation
- [ ] Refactoring done only while tests are green
- [ ] Tests re-run after every refactoring step
- [ ] Commit made after each complete Red-Green-Refactor cycle

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. The test takes 30 seconds to write. |
| "I'll write the test after" | Tests written after pass immediately — they prove nothing. |
| "I already know what the code should look like" | Then the test will be easy to write first. Do it. |
| "Testing this would be too complex" | Complex code untested is a liability. Simplify or test. |
| "It's just a one-line change" | One-line changes cause production incidents. Test it. |
| "I need to prototype first" | Prototypes become production code. Start with a test. |

## Red Flags

**STOP immediately if you catch yourself:**
- Writing implementation code before a test exists
- Seeing a test pass on the first run (it tests nothing)
- Writing more than 5 lines of production code without running tests
- Saying "I'll add tests later"
- Refactoring while tests are failing

## Integration

- **REQUIRED SUB-SKILL:** Use `verification` to confirm tests pass before declaring completion.
- Use with `systematic-debugging` when tests fail unexpectedly.
