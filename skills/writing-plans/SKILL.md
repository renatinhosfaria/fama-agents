---
name: writing-plans
description: Use when you have requirements and need to create a step-by-step implementation plan
phases: [P]
---

# Writing Plans - Bite-Sized Implementation Tasks

## The Iron Law

**EVERY TASK MUST BE COMPLETABLE IN 2-5 MINUTES.** If a task takes longer, it is too big. Break it down further. Every task must have exact file paths and complete code snippets — no hand-waving.

## Process

### Step 1: Gather Inputs

Before writing any plan, you must have:
- A design document or clear requirements
- Access to the codebase to verify file paths exist
- Understanding of existing patterns and conventions

### Step 2: Decompose into Tasks

Break the work into sequential, bite-sized tasks. Each task must be:
- **Atomic**: Does exactly one thing
- **Testable**: Has a clear pass/fail verification
- **Independent**: Can be committed on its own without breaking the build
- **Time-boxed**: 2-5 minutes to complete

### Step 3: Write Each Task

Every task follows this exact format:

```markdown
## Task N: [Clear description of what this task does]

**Files:**
- `path/to/file1.ts` (create | modify)
- `path/to/file2.test.ts` (create | modify)

**Steps:**

1. **Write failing test**
   ```typescript
   // Exact code to add to the test file
   ```

2. **Verify test fails**
   ```bash
   pnpm vitest run path/to/file2.test.ts
   # Expected: FAIL - [description of expected failure]
   ```

3. **Write implementation**
   ```typescript
   // Exact code to add to the implementation file
   ```

4. **Verify test passes**
   ```bash
   pnpm vitest run path/to/file2.test.ts
   # Expected: PASS - all tests green
   ```

5. **Commit**
   ```bash
   git add path/to/file1.ts path/to/file2.test.ts
   git commit -m "feat(scope): description"
   ```
```

### Step 4: Validate the Plan

Before outputting, verify:
- [ ] All file paths are real (check the codebase)
- [ ] Code snippets use existing patterns from the codebase
- [ ] Tasks are in dependency order (no task requires a later task)
- [ ] Each task can be committed independently
- [ ] Total plan covers all requirements from the design

### Step 5: Output the Plan

Write to `docs/plans/` using the format:

```
docs/plans/YYYY-MM-DD-<feature-name>-plan.md
```

Include a header with:
- Feature name and link to design document
- Total number of tasks
- Estimated total time
- Prerequisites (dependencies, env setup)

## Quick Reference

| Task Property | Requirement |
|---------------|-------------|
| Duration | 2-5 minutes |
| File paths | Exact, verified against codebase |
| Code snippets | Complete, copy-pasteable |
| Test step | Every task has one |
| Commit message | Conventional commit format |
| Independence | Each task can be committed alone |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "This task is simple enough without code snippets" | Simple tasks with vague descriptions get implemented wrong. Be explicit. |
| "I'll figure out the test when I get there" | If you can't write the test now, you don't understand the task. |
| "These two things need to happen together" | Break them apart. If truly coupled, the first task is the interface. |
| "File paths might change" | Verify them now. If they change, update the plan. |
| "The developer will know what I mean" | The developer is a coding agent. It knows exactly what you write. Nothing more. |

## Red Flags

**STOP immediately if you catch yourself:**
- Writing a task that takes more than 5 minutes
- Using vague descriptions like "implement the feature"
- Omitting file paths or using placeholder paths
- Skipping the test step in any task
- Writing tasks that depend on tasks later in the list
- Not verifying file paths against the actual codebase
