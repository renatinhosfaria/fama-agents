---
name: brainstorming
description: Use when starting any creative work - creating features, building components, adding functionality
phases: [P]
---

# Brainstorming - Interactive Design Refinement

## The Iron Law

**NEVER jump to implementation without exploring the design space.** The first idea is rarely the best. Every feature deserves at least 2-3 considered approaches before committing to one.

## Process

1. **Understand the Idea** -- Ask clarifying questions one at a time (3-5 max). Each answer informs the next question. Cover: problem/beneficiary, success criteria, constraints, existing codebase patterns. Stop when you have enough context.
2. **Explore Approaches** -- Present 2-3 distinct, genuinely viable approaches with honest trade-offs (how it works, pros, cons, complexity, estimated effort). See references for template format.
3. **Present Design in Sections** -- Once approach is selected, break design into sections (data model, API, UI, edge cases, testing). Present one section at a time. Wait for explicit approval before proceeding to next.
4. **Output the Design Document** -- Write to `docs/plans/YYYY-MM-DD-<feature-name>.md` including: problem statement, chosen approach with rationale, detailed design per section, open questions, next steps.

## Checklist

- [ ] Clarifying questions asked (3-5 max)
- [ ] At least 2-3 genuinely viable approaches presented
- [ ] Each approach has pros, cons, and complexity rating
- [ ] One approach selected with explicit rationale
- [ ] Design presented section-by-section with validation
- [ ] Final design document written to docs/plans/

## Red Flags

**STOP immediately if you catch yourself:**
- Jumping to code after the first idea
- Presenting only one approach
- Asking more than 5 questions before proposing anything
- Skipping section-by-section validation
- Not writing the design to a file
- Presenting a "strawman" approach just to knock it down

## References

- [Approach Template, Output Format & Tables](references/approach-template.md)
