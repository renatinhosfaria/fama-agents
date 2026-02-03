---
name: verification
description: Use when about to claim work is complete or passing. Requires running verification commands and confirming output before any success claim. Evidence before assertions, always.
phases: [E, V, C]
---

# Verification Before Completion

## The Iron Law

**Evidence before claims, always. Run the command. Read the output. THEN claim the result.** No claim of "done", "fixed", or "passing" is valid without command output proving it.

## 5-Step Verification Gate

1. **Identify** what commands prove your assertion (build, test, lint, typecheck, runtime)
2. **Execute** the FULL command — no partial runs, no skipping steps
3. **Read** COMPLETE output including exit codes — do not skim
4. **Confirm** output matches your claim — exact numbers, not approximations
5. **Report** with evidence: "vitest run: 47 tests passed, 0 failed" — not "tests pass"

## Quick Reference

| Claim | Required Evidence |
|-------|------------------|
| "Build succeeds" | `tsc --noEmit` exits 0 |
| "Tests pass" | `vitest run` shows all green with counts |
| "No lint errors" | `eslint` exits 0 |
| "Feature works" | Actual execution output |
| "Bug is fixed" | Previously failing test now passes |

## Red Flags — STOP immediately if you:

- Use tentative language: "should work", "probably passes", "seems fine"
- Express satisfaction before running verification commands
- Plan commits or PRs without independent testing
- Rely on agent reports as proof instead of command output
- Assume tests still pass after making changes
- Declare "done" without a single command output in your response

## Never

- Never claim success based on what you *think* the output will be
- Never skip typecheck because "it's just types"
- Never batch verification — verify after each meaningful change

## Checklist

- [ ] All verification commands identified
- [ ] Each command executed and output captured
- [ ] All commands exit with success (zero errors)
- [ ] Failures fixed and re-verified before proceeding
- [ ] Completion report includes actual command outputs with numbers
- [ ] No claim made without supporting evidence
