# Executing Plans - Detailed Reference

## Per-Task TDD Cycle

For each individual task:

1. **Mark task as `in_progress`** in TodoWrite
2. **Write the failing test** (from the plan)
3. **Run the test** — confirm it fails as expected
4. **Write the implementation** (from the plan)
5. **Run the test** — confirm it passes
6. **Run lint and typecheck** on the changed files
7. **Commit** with the message from the plan
8. **Mark task as `completed`** in TodoWrite

## Progress Report Template

```
## Progress Report
- Tasks completed: X / Y
- Current task: [description]
- Status: [continuing | blocked | complete]
- Issues: [list any deviations or problems]
- Next batch: Tasks N through M
```

## Quick Reference Table

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
