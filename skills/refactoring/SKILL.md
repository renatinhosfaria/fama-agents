---
name: refactoring
description: Use when improving code structure without changing external behavior
phases: [E]
---

# Refactoring - Safe Structural Improvement

## The Iron Law

**NEVER REFACTOR AND ADD FEATURES SIMULTANEOUSLY.** Refactoring changes structure. Features change behavior. Mixing them makes failures impossible to diagnose. Do one or the other, never both.

## Process

1. **Ensure Tests Are Green** -- Run the full test suite. All tests must pass. If no tests exist for the target code, write tests first.
2. **Identify the Smell** -- Name the specific code smell (long method, duplicate code, large class, long parameter list, nested conditionals, magic numbers, feature envy, dead code). See references for full table.
3. **Apply Small Incremental Steps** -- Make one single change (extract, rename, move). Run tests. If tests fail, undo immediately. Commit after each successful step.
4. **Verify No Behavior Change** -- Run full test suite, lint, and typecheck. Review the diff for structural-only changes.

```bash
pnpm turbo test && pnpm turbo lint && pnpm turbo typecheck
```

## Quick Reference

```
Tests green -> Identify smell -> One small change -> Tests green -> Commit -> Repeat
```

## Checklist

- [ ] Full test suite passes before starting
- [ ] Specific code smell identified and named
- [ ] Each refactoring step is a single change
- [ ] Tests run after every step
- [ ] Failed steps undone immediately
- [ ] Each successful step committed
- [ ] Full test suite passes after completion
- [ ] Diff contains only structural changes (no behavior changes)

## Red Flags

**STOP immediately if you catch yourself:**
- Changing behavior while refactoring (adding features, fixing bugs)
- Making multiple changes between test runs
- Refactoring code that has no test coverage
- Tests are red and you are still making structural changes
- The diff contains both structural changes and new functionality
- Skipping test runs because "this change is trivial"

## References

- [Code Smells, Techniques & Examples](references/techniques.md)
