---
name: executing-plans
description: Use when executing implementation plans with independent tasks in the current session
phases: [E]
---

# Executing Plans - Disciplined Task Execution

## The Iron Law

**FOLLOW THE PLAN. DO NOT IMPROVISE.** If the plan is wrong, stop and fix the plan first. Never silently deviate -- deviations compound into bugs.

## Process

1. **Load the Plan** -- Read the plan file from `docs/plans/`. Count total tasks. Track all tasks using `TodoWrite`.
2. **Review Critically** -- Verify file paths are still valid, dependencies haven't changed, and no conflicts exist with recent changes. If issues found: STOP and report.
3. **Execute in Batches** -- Execute tasks in batches of 3. After each batch run full verification: `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo build && pnpm turbo test`. Report progress and ask whether to continue.
4. **Per-Task TDD Cycle** -- For each task: mark in_progress, write failing test, verify it fails, write implementation, verify it passes, run lint/typecheck, commit, mark completed. See references for detailed steps.
5. **Handle Blockers** -- STOP execution immediately. Document what went wrong. Report with full context. Suggest whether to fix plan, fix blocker, or skip with justification.
6. **Report** -- After each batch provide progress report (completed/total, status, issues, next batch).

## Checklist

- [ ] Plan loaded from docs/plans/ into TodoWrite
- [ ] Plan reviewed for stale file paths and dependencies
- [ ] Tasks executed in batches of 3
- [ ] Verification suite run after each batch
- [ ] Each task follows TDD cycle (test first, then implement)
- [ ] Each task committed individually
- [ ] Blockers reported immediately (no silent skipping)
- [ ] Progress report generated after each batch

## Red Flags

**STOP immediately if you catch yourself:**
- Executing without loading the plan into TodoWrite
- Skipping a blocked task to continue with the next one
- Writing code that is not in the plan
- Committing multiple tasks in a single commit
- Not running verification after a batch
- Deviating from the plan without updating it first

## References

- [TDD Cycle Details, Report Template & Tables](references/execution-details.md)
