---
name: feature-breakdown
description: Use when a feature is too large to implement in one task and needs decomposition
phases: [P]
---

# Feature Breakdown - From Epic to Executable Tasks

## The Iron Law

**NO TASK WITHOUT A BOUNDARY.** Every task must have a clear start, a clear end, and a clear way to verify it is done. If you cannot define the boundary, the task is too vague -- decompose further.

## Process

1. **Identify Components** -- List every layer the feature touches: data, API, service, UI, infrastructure, tests. Note which files will be created or modified.
2. **Define Boundaries** -- For each component, specify input, output, and interface contract.
3. **Create Dependency Graph** -- Map which components depend on which. No circular dependencies allowed.
4. **Order by Dependencies** -- Arrange tasks so dependencies complete before dependents. Prioritize vertical slices for earliest usability.
5. **Estimate Complexity** -- Rate each task (Trivial/Simple/Moderate/Complex). Break down any Complex task further. See references for estimation table.
6. **Output the Task List** -- Format as numbered list with files and acceptance criteria. Write to `docs/plans/`.

## Quick Reference

| Step | Output |
|------|--------|
| Identify Components | List of layers affected |
| Define Boundaries | Input/output/contract per component |
| Dependency Graph | Visual or textual dependency map |
| Order Tasks | Sequenced task list |
| Estimate Complexity | Time estimate per task |
| Output | Numbered task list with acceptance criteria |

## Checklist

- [ ] All affected layers identified (data, API, service, UI, infra, tests)
- [ ] Boundaries defined for each component (input/output/contract)
- [ ] Dependency graph created with no circular dependencies
- [ ] Tasks ordered by dependencies
- [ ] Every task rated for complexity (no Complex tasks remaining)
- [ ] Acceptance criteria written for every task
- [ ] Output written to docs/plans/

## Red Flags

**STOP immediately if you catch yourself:**
- Creating a task that touches more than 3-4 files
- Leaving acceptance criteria blank or vague
- Having circular dependencies in the task graph
- Rating a task as "Complex" without breaking it down further
- Ordering UI tasks before their API dependencies
- Skipping the dependency graph step

## References

- [Task Template, Complexity Table & Examples](references/task-template.md)
