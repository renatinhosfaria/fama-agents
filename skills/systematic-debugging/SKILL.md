---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
phases: [E, V]
---

# Systematic Debugging - Evidence-Based Root Cause Analysis

## The Iron Law

**NO FIXES WITHOUT DIAGNOSIS.** The urge to "just try something" is the enemy. Every fix attempt without understanding the root cause is a coin flip that can introduce new bugs.

## Process

### Phase 1: Root Cause Investigation

**Goal: Gather evidence. NO FIXES YET.**

1. **Reproduce the bug** — get the exact error message, stack trace, or unexpected output
2. **Identify the scope** — which files, functions, and data are involved?
3. **Read the relevant code** — do not guess what it does. Read it.
4. **Trace the execution path** — from input to the point of failure
5. **Collect all evidence** before forming any hypothesis

```
## Evidence Log
- Error: [exact error message or unexpected behavior]
- Location: [file:line where it manifests]
- Input: [what triggers it]
- Expected: [what should happen]
- Actual: [what actually happens]
- Stack trace: [if available]
```

### Phase 2: Pattern Analysis

**Goal: Find working examples to contrast with the failure.**

1. **Find similar code that works** — same pattern used elsewhere in the codebase
2. **Diff the working code against the broken code** — what is different?
3. **Check recent changes** — did a recent commit introduce the issue? (`git log`, `git diff`)
4. **Check dependencies** — did an upstream change break an assumption?

### Phase 3: Hypothesis and Testing

**Goal: Apply the scientific method.**

1. **Form a hypothesis** — "The bug occurs because X"
2. **Predict what a fix would look like** — "If my hypothesis is correct, changing Y should fix it"
3. **Test the hypothesis** — add a temporary log, assertion, or minimal change to verify
4. **Confirm or reject** — if rejected, return to Phase 1 with new evidence

```
## Hypothesis
- Cause: [what you believe is wrong]
- Evidence: [what supports this belief]
- Prediction: [what should happen if you're right]
- Test: [how to verify without a full fix]
- Result: [confirmed / rejected]
```

### Phase 4: Implementation

**Goal: Fix with confidence.**

1. **Write a test that reproduces the bug** — this test must FAIL before the fix
2. **Implement the minimal fix** — change as little as possible
3. **Run the reproducing test** — it must PASS now
4. **Run the full test suite** — no regressions
5. **Document what caused the bug** in the commit message

## Quick Reference

| Phase | Action | Output |
|-------|--------|--------|
| Investigation | Gather evidence, NO fixes | Evidence log |
| Pattern Analysis | Find working vs broken code | Differences identified |
| Hypothesis | Scientific method | Confirmed root cause |
| Implementation | Test-first fix | Passing test + minimal fix |

## Checklist

- [ ] Bug reproduced with exact error/behavior documented
- [ ] Evidence log filled (error, location, input, expected, actual)
- [ ] Similar working code found for comparison
- [ ] Recent changes checked (git log/diff)
- [ ] Hypothesis formed with evidence and prediction
- [ ] Hypothesis tested and confirmed/rejected
- [ ] Failing test written that reproduces the bug
- [ ] Minimal fix implemented and all tests pass

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I know what the bug is, let me just fix it" | You think you know. Verify first. Misdiagnosis wastes more time. |
| "It's probably just a typo" | Typos don't need debugging. If you're here, it's not a typo. |
| "Let me try a few things" | Random changes create random bugs. Diagnose systematically. |
| "The error message tells me exactly what's wrong" | Error messages describe symptoms, not causes. Investigate. |
| "I'll just revert the last change" | Reverting without understanding means the bug will return. |
| "It works on my machine" | Then the difference between environments IS the bug. Find it. |

## Red Flags

**STOP immediately if you catch yourself:**
- Changing code before Phase 1 is complete
- Making more than one change at a time to "see what happens"
- Ignoring the stack trace or error message
- Not reproducing the bug before attempting to fix it
- Skipping the failing test in Phase 4
- Blaming external dependencies without evidence
