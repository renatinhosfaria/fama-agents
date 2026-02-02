---
name: executing-plans
description: Use when executing implementation plans with independent tasks in the current session
phases: [E]
---

# Executing Plans - Disciplined Task Execution

## The Iron Law

**FOLLOW THE PLAN. DO NOT IMPROVISE.** If the plan is wrong, stop and fix the plan first. Never silently deviate — deviations compound into bugs.

## Process

### Step 1: Load the Plan

1. Read the plan file from `docs/plans/`
2. Count total tasks and identify the current starting point
3. Track all tasks using `TodoWrite` — one todo per task

### Step 2: Review Critically

Before executing anything, scan the plan for issues:
- Are file paths still valid?
- Have any dependencies changed since the plan was written?
- Are there conflicts with recent changes in the codebase?

If issues are found: **STOP.** Report the issues. Do not proceed with a stale plan.

### Step 3: Execute in Batches

Execute tasks in batches of **3 tasks** (default). After each batch:

1. Run the full verification suite: `pnpm turbo lint && pnpm turbo typecheck && pnpm turbo build && pnpm turbo test`
2. Report progress: completed / total, any issues encountered
3. Ask whether to continue with the next batch

### Step 4: Per-Task TDD Cycle

For each individual task:

1. **Mark task as `in_progress`** in TodoWrite
2. **Write the failing test** (from the plan)
3. **Run the test** — confirm it fails as expected
4. **Write the implementation** (from the plan)
5. **Run the test** — confirm it passes
6. **Run lint and typecheck** on the changed files
7. **Commit** with the message from the plan
8. **Mark task as `completed`** in TodoWrite

### Step 5: Handle Blockers

If a task cannot be completed:

1. **STOP execution immediately** — do not skip and continue
2. Document what went wrong and why
3. Report the blocker with full context (error messages, file states)
4. Suggest whether to: fix the plan, fix the blocker, or skip with justification

### Step 6: Report

After each batch (or when stopped), provide:

```
## Progress Report
- Tasks completed: X / Y
- Current task: [description]
- Status: [continuing | blocked | complete]
- Issues: [list any deviations or problems]
- Next batch: Tasks N through M
```

## Quick Reference

| Action | Default | Override |
|--------|---------|----------|
| Batch size | 3 tasks | User can specify |
| Verification | After each batch | After each task if fragile |
| Blocker handling | Stop immediately | Never skip silently |
| Commit granularity | Per task | Per task (non-negotiable) |
| TodoWrite tracking | Required | Required (non-negotiable) |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I'll just do a quick fix outside the plan" | Quick fixes outside the plan are untracked regressions. Update the plan. |
| "This task is blocked but I can skip ahead" | Skipping creates hidden dependencies. Stop and resolve. |
| "I'll commit all tasks at once" | Atomic commits enable atomic rollbacks. Commit per task. |
| "The plan says X but Y is clearly better" | Update the plan first. Then execute the updated plan. |
| "Tests are passing, no need to run the full suite" | Integration failures hide between individual test runs. Run the suite. |

## Red Flags

**STOP immediately if you catch yourself:**
- Executing without loading the plan into TodoWrite
- Skipping a blocked task to continue with the next one
- Writing code that is not in the plan
- Committing multiple tasks in a single commit
- Not running verification after a batch
- Deviating from the plan without updating it first
