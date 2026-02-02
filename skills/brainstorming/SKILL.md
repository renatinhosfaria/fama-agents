---
name: brainstorming
description: Use when starting any creative work - creating features, building components, adding functionality
phases: [P]
---

# Brainstorming - Interactive Design Refinement

## The Iron Law

**NEVER jump to implementation without exploring the design space.** The first idea is rarely the best. Every feature deserves at least 2-3 considered approaches before committing to one.

## Process

### Step 1: Understand the Idea

Ask clarifying questions **one at a time**. Do not batch questions. Each answer should inform the next question.

1. What problem does this solve? Who benefits?
2. What does success look like? What is the acceptance criteria?
3. What constraints exist (tech stack, timeline, compatibility)?
4. Are there existing patterns in the codebase to follow?

**STOP asking when you have enough context to propose approaches.** Do not interrogate — 3-5 questions is typical.

### Step 2: Explore Approaches

Present **2-3 distinct approaches** with honest trade-offs:

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

### Step 3: Present Design in Sections

Once an approach is selected, break the design into logical sections. Present **one section at a time** and ask for validation before proceeding:

1. Data model / schema changes
2. API endpoints or service interfaces
3. UI components and user flow
4. Edge cases and error handling
5. Testing strategy

For each section, wait for explicit approval before moving to the next.

### Step 4: Output the Design Document

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

## Quick Reference

| Phase | Action | Output |
|-------|--------|--------|
| Understand | Ask questions one at a time | Clear requirements |
| Explore | 2-3 approaches with trade-offs | Selected approach |
| Design | Section-by-section validation | Approved design |
| Document | Write to docs/plans/ | Design document file |

## Checklist

- [ ] Clarifying questions asked (3-5 max)
- [ ] At least 2-3 genuinely viable approaches presented
- [ ] Each approach has pros, cons, and complexity rating
- [ ] One approach selected with explicit rationale
- [ ] Design presented section-by-section with validation
- [ ] Final design document written to docs/plans/

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The solution is obvious" | Obvious solutions have hidden trade-offs. Explore alternatives. |
| "We don't have time to brainstorm" | You don't have time to rebuild after picking the wrong approach. |
| "The user already told me what to build" | Users describe problems. Your job is to explore solutions. |
| "I'll just start coding and see" | Code without design becomes technical debt. Think first. |
| "There's only one way to do this" | There are always at least two ways. Find them. |

## Red Flags

**STOP immediately if you catch yourself:**
- Jumping to code after the first idea
- Presenting only one approach
- Asking more than 5 questions before proposing anything
- Skipping section-by-section validation
- Not writing the design to a file
- Presenting a "strawman" approach just to knock it down
