---
name: verification
description: Use when about to claim work is complete, fixed, or passing - requires running verification commands and confirming output before making success claims
phases: [E, V, C]
---

# Verification Before Completion

## The Iron Law

**NEVER claim success without evidence.** Every assertion must be backed by a command output or test result.

## Process

### Step 1: Identify Verification Commands
Before declaring anything "done", list all commands needed to verify:
- Build: Does it compile without errors?
- Tests: Do all tests pass?
- Lint: Are there zero lint warnings?
- Types: Does typecheck pass?
- Runtime: Does the feature actually work?

### Step 2: Run Each Command
Execute every verification command. Capture the output.

### Step 3: Analyze Results
- All green? → Proceed to declare completion.
- Any red? → Fix the issue FIRST, then re-verify.

### Step 4: Report Evidence
Include actual command outputs in your completion report. Not "tests pass" but "vitest run: 47 tests passed, 0 failed".

## Quick Reference

| Claim | Required Evidence |
|-------|------------------|
| "Build succeeds" | `tsc --noEmit` exits 0 |
| "Tests pass" | `vitest run` shows all green |
| "No lint errors" | `eslint` exits 0 |
| "Feature works" | Actual execution output |
| "Bug is fixed" | Failing test now passes |

## Checklist

- [ ] All verification commands identified (build, test, lint, typecheck)
- [ ] Each command executed and output captured
- [ ] All commands exit with success (zero errors)
- [ ] Failures fixed and re-verified before proceeding
- [ ] Completion report includes actual command outputs
- [ ] No claim made without supporting evidence

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I'm confident it works" | Confidence is not evidence. Run the command. |
| "I just need to make one small change" | Small changes break things. Verify. |
| "The test was passing before" | Before is not now. Run it again. |
| "It's just a formatting change" | Formatting changes can break parsers. Verify. |

## Red Flags

**STOP immediately if you catch yourself:**
- Saying "should work" without running anything
- Skipping typecheck because "it's just types"
- Assuming tests still pass after changes
- Declaring "done" without a single command output
