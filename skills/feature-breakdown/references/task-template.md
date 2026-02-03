# Feature Breakdown - Templates & Details

## Component Boundary Template

```
## Component: [Name]
- Input: [what it receives]
- Output: [what it produces]
- Interface: [API contract, props, function signature]
- Files: [list of files to create/modify]
```

## Dependency Graph Example

```
Schema -> Migration -> API Endpoint -> Service Logic -> UI Component -> E2E Test
                                     /
              Shared Types ----------
```

Rules for dependencies:
- No circular dependencies
- Data layer before API layer
- API layer before UI layer
- Shared types extracted early
- Tests accompany their implementation (not separate phase)

## Complexity Estimation Table

| Complexity | Definition | Time Estimate |
|------------|-----------|---------------|
| **Trivial** | Copy existing pattern, change names | 2-3 min |
| **Simple** | Straightforward implementation, clear path | 3-5 min |
| **Moderate** | Some decisions required, multiple files | 5-10 min |
| **Complex** | New pattern, edge cases, integration points | 10-15 min |

If any task is rated **Complex**, break it down further until all subtasks are Moderate or below.

## Task List Output Format

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

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "This feature is small enough to do in one task" | If it touches more than 2 files, break it down. |
| "I'll figure out the order as I go" | Unordered tasks create blocked work. Plan the order. |
| "Acceptance criteria are obvious" | Obvious to you now. Not obvious to the agent executing at 2am. Write them. |
| "Dependencies are all straightforward" | Straightforward dependencies still need explicit ordering. Document them. |
| "Estimating is waste of time" | Estimates expose tasks that are too large. The estimate is the point. |
