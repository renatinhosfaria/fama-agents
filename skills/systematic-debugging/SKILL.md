---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior. Requires root cause investigation before any fix attempt.
phases: [E, V]
---

# Systematic Debugging - Evidence-Based Root Cause Analysis

## The Iron Law

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.** The urge to "just try something" is the enemy. Every fix attempt without understanding the root cause is a coin flip that introduces new bugs.

## 4 Mandatory Phases

1. **Investigate (NO fixes yet)** — Reproduce the bug. Get the exact error, stack trace, or unexpected output. Read the code — do not guess what it does. Trace execution from input to failure point. Collect all evidence before forming any hypothesis.

2. **Analyze Patterns** — Find similar working code in the codebase and diff it against the broken code. Check recent commits (`git log`, `git diff`). Verify if upstream dependencies changed assumptions.

3. **Hypothesize and Test** — Form a written hypothesis: "The bug occurs because X." Predict what a fix looks like. Test with a minimal isolated change (temporary log, assertion). If rejected, return to Phase 1 with new evidence.

4. **Implement** — Write a failing test that reproduces the bug. Implement the minimal fix. Confirm the test passes. Run the full test suite for regressions. Document root cause in the commit message.

## Critical Guardrail

**After 3 unsuccessful fix attempts, STOP.** Question the underlying architecture. The root cause may be a design problem, not a code problem.

## Red Flags — STOP immediately if you:

- Change code before Phase 1 is complete
- Make more than one change at a time to "see what happens"
- Ignore the stack trace or error message
- Skip reproducing the bug before attempting to fix it
- Skip the failing test in Phase 4
- Blame external dependencies without evidence

## Checklist

- [ ] Bug reproduced with exact error/behavior documented
- [ ] Evidence collected (error, location, input, expected vs actual)
- [ ] Similar working code found for comparison
- [ ] Recent changes checked (git log/diff)
- [ ] Hypothesis formed with evidence and prediction
- [ ] Hypothesis tested and confirmed/rejected
- [ ] Failing test written that reproduces the bug
- [ ] Minimal fix implemented and all tests pass

## References

- [Evidence Log, Hypothesis Template & Tables](references/templates.md)
