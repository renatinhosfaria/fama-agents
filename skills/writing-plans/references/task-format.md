# Writing Plans - Task Format & Reference

## Detailed Task Format Template

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

## Plan Header Format

Write to `docs/plans/` using the format:
```
docs/plans/YYYY-MM-DD-<feature-name>-plan.md
```

Include a header with:
- Feature name and link to design document
- Total number of tasks
- Estimated total time
- Prerequisites (dependencies, env setup)

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "This task is simple enough without code snippets" | Simple tasks with vague descriptions get implemented wrong. Be explicit. |
| "I'll figure out the test when I get there" | If you can't write the test now, you don't understand the task. |
| "These two things need to happen together" | Break them apart. If truly coupled, the first task is the interface. |
| "File paths might change" | Verify them now. If they change, update the plan. |
| "The developer will know what I mean" | The developer is a coding agent. It knows exactly what you write. Nothing more. |
