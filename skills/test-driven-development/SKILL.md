---
name: test-driven-development
description: Use when implementing any feature or bugfix. Enforces RED-GREEN-REFACTOR cycle — no production code without a failing test first.
phases: [E, V]
---

# Test-Driven Development (TDD)

## The Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.** If code was written before a test, delete the code and start over. There are no exceptions. Violating the letter IS violating the spirit.

## RED-GREEN-REFACTOR Cycle

1. **RED**: Write one minimal failing test describing desired behavior. Run it — it MUST fail. If it passes, the test proves nothing.
2. **GREEN**: Write the MINIMUM code to make the test pass. No extras. No "while I'm here." Run the test — it MUST pass.
3. **REFACTOR**: Clean up structure while keeping tests green. Run tests after each change. If any test fails, undo immediately.

```
Write test → Run (FAIL) → Write code → Run (PASS) → Refactor → Run (PASS) → Commit
```

## Critical Prohibitions

- Never keep pre-written code as reference while writing tests
- Never rationalize skipping TDD "just this once"
- Never confuse manual testing with systematic test automation
- Never test mock behavior instead of real functionality

## Red Flags

**STOP immediately if you catch yourself:**
- Writing implementation code before a test exists
- Seeing a test pass on the first run (it tests nothing)
- Writing more than 5 lines of production code without running tests
- Saying "I'll add tests later"
- Refactoring while tests are failing
- Expressing satisfaction before running the test suite

## Integration

- **REQUIRED SUB-SKILL:** Use `verification` to confirm tests pass before declaring completion.
- **REQUIRED SUB-SKILL:** Use `systematic-debugging` when tests fail unexpectedly.

## Checklist

- [ ] Failing test written before any implementation code
- [ ] Test actually fails on first run (not a false positive)
- [ ] Minimum code written to make test pass
- [ ] Test passes after implementation
- [ ] Refactoring done only while tests are green
- [ ] Tests re-run after every refactoring step
- [ ] Commit made after each complete RED-GREEN-REFACTOR cycle
