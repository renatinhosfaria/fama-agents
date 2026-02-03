---
name: implementation-readiness
description: Use when verifying that all prerequisites are met before starting implementation. Validates alignment between PRD, architecture, and stories.
phases: [P, R]
---

# Implementation Readiness - Pre-Execution Validation

## The Iron Law

**NEVER START CODING WITHOUT CONFIRMING ALL ARTIFACTS ALIGN.** Misalignment between PRD, architecture, and stories is the #1 cause of wasted implementation effort.

## Process

### Step 1: Gather Artifacts
Collect and read all planning artifacts:
1. PRD or product brief
2. Architecture/tech spec documents
3. User stories or task breakdown
4. Any existing prototype or spike results

### Step 2: Cross-Validate Requirements
For each requirement in the PRD:
- Is it covered by at least one user story?
- Is the technical approach defined in the architecture doc?
- Are acceptance criteria testable?

### Step 3: Cross-Validate Architecture
For each architectural decision:
- Does it support all PRD requirements?
- Are there stories that contradict the chosen approach?
- Are dependencies and integrations accounted for?

### Step 4: Identify Gaps
Document any:
- Requirements without stories
- Stories without architectural support
- Architectural decisions without requirement justification
- Missing acceptance criteria
- Unresolved open questions from any document

### Step 5: Readiness Verdict
Produce a readiness report:
- **READY**: All artifacts align, no blocking gaps
- **READY WITH RISKS**: Minor gaps documented, can proceed with awareness
- **NOT READY**: Blocking gaps that must be resolved before execution

## Quick Reference

| Check | Source A | Source B | Finding |
|-------|---------|---------|---------|
| Requirement coverage | PRD | Stories | Each FR has a story |
| Architecture support | Architecture | Stories | Each story is technically feasible |
| Acceptance criteria | Stories | PRD | Criteria match requirements |
| Dependency coverage | Architecture | PRD | All integrations planned |

## Checklist

- [ ] All planning artifacts have been read in full
- [ ] Every PRD requirement maps to at least one story
- [ ] Every story has a feasible architectural path
- [ ] Acceptance criteria are testable and specific
- [ ] No circular or missing dependencies
- [ ] Open questions from all documents are resolved or tracked
- [ ] Readiness verdict is documented with justification

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The PRD is clear enough" | PRDs describe what. Stories describe how. Both must align. |
| "We can figure it out during implementation" | Figuring it out during implementation means rework. Align now. |
| "The architect already approved" | Approval without cross-validation is a rubber stamp. Verify. |
| "Stories are just placeholders" | Placeholder stories produce placeholder implementations. |

## Red Flags

**STOP immediately if you catch yourself:**
- Skipping the cross-validation between any two artifact types
- Marking as READY when there are unresolved open questions
- Not reading all artifacts in full before validating
- Assuming alignment without evidence
