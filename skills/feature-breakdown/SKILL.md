---
name: feature-breakdown
description: Use when a feature is too large to implement in one task and needs decomposition
phases: [P]
---

# Feature Breakdown - From Epic to Executable Tasks

## The Iron Law

**NO TASK WITHOUT A BOUNDARY.** Every task must have a clear start, a clear end, and a clear way to verify it is done. If you cannot define the boundary, the task is too vague — decompose further.

## Process

### Step 1: Identify Components

List every distinct component the feature requires:

1. **Data layer** — schema changes, migrations, seed data
2. **API layer** — new endpoints, modified endpoints, DTOs
3. **Service layer** — business logic, validation rules
4. **UI layer** — pages, components, forms, state management
5. **Infrastructure** — configuration, environment variables, third-party integrations
6. **Tests** — unit tests, integration tests, E2E scenarios

For each component, note:
- Which files will be created or modified
- Which existing patterns to follow

### Step 2: Define Boundaries

For each component, answer:
- **Input:** What does this component receive?
- **Output:** What does this component produce?
- **Contract:** What is the interface between this component and its neighbors?

```
## Component: [Name]
- Input: [what it receives]
- Output: [what it produces]
- Interface: [API contract, props, function signature]
- Files: [list of files to create/modify]
```

### Step 3: Create Dependency Graph

Map which components depend on which:

```
Schema → Migration → API Endpoint → Service Logic → UI Component → E2E Test
                                   ↗
              Shared Types --------
```

Rules for dependencies:
- No circular dependencies
- Data layer before API layer
- API layer before UI layer
- Shared types extracted early
- Tests accompany their implementation (not separate phase)

### Step 4: Order by Dependencies

Arrange tasks so that:
1. Dependencies are completed before dependents
2. Shared/foundational work comes first
3. Each task produces something testable
4. The feature is usable at the earliest possible point (vertical slice)

### Step 5: Estimate Complexity

Rate each task:

| Complexity | Definition | Time Estimate |
|------------|-----------|---------------|
| **Trivial** | Copy existing pattern, change names | 2-3 min |
| **Simple** | Straightforward implementation, clear path | 3-5 min |
| **Moderate** | Some decisions required, multiple files | 5-10 min |
| **Complex** | New pattern, edge cases, integration points | 10-15 min |

If any task is rated **Complex**, break it down further until all subtasks are Moderate or below.

### Step 6: Output the Task List

Format as a numbered list with files and acceptance criteria:

```markdown
## Feature: [Name]

Total tasks: N
Estimated time: X minutes
Dependencies: [list any prerequisites]

### Task 1: [Description]
- **Complexity:** Simple
- **Files:** `path/to/file.ts` (create)
- **Acceptance criteria:**
  - [ ] Schema exists with correct columns
  - [ ] Migration runs without errors
  - [ ] Rollback migration works

### Task 2: [Description]
- **Complexity:** Moderate
- **Depends on:** Task 1
- **Files:** `path/to/endpoint.ts` (create), `path/to/dto.ts` (create)
- **Acceptance criteria:**
  - [ ] Endpoint returns 200 with valid data
  - [ ] Endpoint returns 400 for invalid input
  - [ ] Tests cover happy path and error cases
```

Write the output to `docs/plans/` using the format:
```
docs/plans/YYYY-MM-DD-<feature-name>-breakdown.md
```

## Quick Reference

| Step | Output |
|------|--------|
| Identify Components | List of layers affected |
| Define Boundaries | Input/output/contract per component |
| Dependency Graph | Visual or textual dependency map |
| Order Tasks | Sequenced task list |
| Estimate Complexity | Time estimate per task |
| Output | Numbered task list with acceptance criteria |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "This feature is small enough to do in one task" | If it touches more than 2 files, break it down. |
| "I'll figure out the order as I go" | Unordered tasks create blocked work. Plan the order. |
| "Acceptance criteria are obvious" | Obvious to you now. Not obvious to the agent executing at 2am. Write them. |
| "Dependencies are all straightforward" | Straightforward dependencies still need explicit ordering. Document them. |
| "Estimating is waste of time" | Estimates expose tasks that are too large. The estimate is the point. |

## Red Flags

**STOP immediately if you catch yourself:**
- Creating a task that touches more than 3-4 files
- Leaving acceptance criteria blank or vague
- Having circular dependencies in the task graph
- Rating a task as "Complex" without breaking it down further
- Ordering UI tasks before their API dependencies
- Skipping the dependency graph step
