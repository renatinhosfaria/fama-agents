---
name: writing-plans
description: Use when you have requirements and need to create a step-by-step implementation plan
phases: [P]
---

# Writing Plans - Bite-Sized Implementation Tasks

## The Iron Law

**EVERY TASK MUST BE COMPLETABLE IN 2-5 MINUTES.** If a task takes longer, it is too big. Break it down further. Every task must have exact file paths and complete code snippets -- no hand-waving.

## Process

1. **Gather Inputs** -- Obtain a design document or clear requirements. Access the codebase to verify file paths. Understand existing patterns and conventions.
2. **Decompose into Tasks** -- Each task must be: Atomic (one thing), Testable (clear pass/fail), Independent (committable alone), Time-boxed (2-5 min).
3. **Write Each Task** -- Include: files to create/modify, failing test code, verify-fail step, implementation code, verify-pass step, commit command. See references for exact template.
4. **Validate the Plan** -- Check all file paths are real, code snippets use existing patterns, tasks are in dependency order, each task is independently committable, and total plan covers all requirements.
5. **Output the Plan** -- Write to `docs/plans/YYYY-MM-DD-<feature-name>-plan.md` with header (feature name, total tasks, estimated time, prerequisites).

## Quick Reference

| Task Property | Requirement |
|---------------|-------------|
| Duration | 2-5 minutes |
| File paths | Exact, verified against codebase |
| Code snippets | Complete, copy-pasteable |
| Test step | Every task has one |
| Commit message | Conventional commit format |
| Independence | Each task can be committed alone |

## Checklist

- [ ] Design document or requirements loaded as input
- [ ] Every task is atomic and completable in 2-5 minutes
- [ ] File paths verified against the actual codebase
- [ ] Every task has a failing test step
- [ ] Code snippets are complete and copy-pasteable
- [ ] Tasks are in dependency order
- [ ] Commit messages follow conventional commit format
- [ ] Plan written to docs/plans/

## Red Flags

**STOP immediately if you catch yourself:**
- Writing a task that takes more than 5 minutes
- Using vague descriptions like "implement the feature"
- Omitting file paths or using placeholder paths
- Skipping the test step in any task
- Writing tasks that depend on tasks later in the list
- Not verifying file paths against the actual codebase

## References

- [Detailed Task Format Template & Tables](references/task-format.md)
