# Brainstorming - Templates & Reference

## Approach Template Format

```
## Approach A: [Name]
- How it works: [1-2 sentences]
- Pros: [bullet list]
- Cons: [bullet list]
- Complexity: [Low / Medium / High]
- Estimated effort: [rough time]

## Approach B: [Name]
...
```

Do NOT present a "bad" option just to make the preferred one look good. Each approach must be genuinely viable.

## Design Document Output Format

Write the final agreed design to a file in `docs/plans/` using the format:
```
docs/plans/YYYY-MM-DD-<feature-name>.md
```

The document must include:
- Problem statement
- Chosen approach with rationale
- Detailed design per section
- Open questions (if any)
- Next steps (link to writing-plans skill)

## Quick Reference Table

| Phase | Action | Output |
|-------|--------|--------|
| Understand | Ask questions one at a time | Clear requirements |
| Explore | 2-3 approaches with trade-offs | Selected approach |
| Design | Section-by-section validation | Approved design |
| Document | Write to docs/plans/ | Design document file |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The solution is obvious" | Obvious solutions have hidden trade-offs. Explore alternatives. |
| "We don't have time to brainstorm" | You don't have time to rebuild after picking the wrong approach. |
| "The user already told me what to build" | Users describe problems. Your job is to explore solutions. |
| "I'll just start coding and see" | Code without design becomes technical debt. Think first. |
| "There's only one way to do this" | There are always at least two ways. Find them. |
