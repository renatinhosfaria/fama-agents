---
name: documentation-review
description: Use when reviewing documentation for accuracy, completeness, and clarity before publication. Covers README, API docs, architecture decisions, and user guides.
phases: [C]
---

# Documentation Review - Completeness Assessment

## The Iron Law

**UNDOCUMENTED FEATURES DO NOT EXIST.** If it is not in the documentation, users will not find it, developers will not maintain it, and the next person will rewrite it.

## Process

### Step 1: Inventory Documentation
List all documentation that should exist:
1. README.md — project overview, setup, usage
2. API documentation — endpoints, request/response formats
3. Architecture decisions — ADRs or ARCHITECTURE.md
4. Configuration guide — environment variables, settings
5. Contributing guide — how to contribute, code standards
6. Deployment guide — how to deploy, infrastructure requirements

### Step 2: Completeness Check
For each document, verify:
- Does it exist?
- Is it up to date with the current codebase?
- Does it cover all relevant topics?
- Are code examples accurate and runnable?
- Are links valid (no broken links)?

### Step 3: Accuracy Validation
For each code example in documentation:
1. Read the actual source code it references
2. Verify the example matches current behavior
3. Flag any discrepancies

### Step 4: Gap Report
Document:
- Missing documents
- Outdated sections
- Inaccurate code examples
- Missing topics within existing documents
- Broken links

## Quick Reference

| Document | Must Cover |
|----------|-----------|
| README | Install, setup, usage, contributing |
| API docs | Every endpoint, auth, errors |
| Architecture | Key decisions, trade-offs, diagrams |
| Config | Every env var with description and default |
| Deploy | Step-by-step, requirements, rollback |

## Checklist

- [ ] README exists and covers setup through usage
- [ ] API documentation covers all endpoints
- [ ] Architecture decisions are documented
- [ ] Configuration guide lists all environment variables
- [ ] Code examples in docs are accurate and runnable
- [ ] No broken links in documentation
- [ ] Documentation reflects the current state of the codebase
- [ ] Contributing guide exists with code standards

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The code is self-documenting" | Code documents how. Docs document why and how to use. |
| "We'll update docs in the next sprint" | Outdated docs are worse than no docs. Update now. |
| "Nobody reads the docs" | They will when they are onboarding or debugging at 3am. |
| "The API is intuitive" | Intuitive to the author. Not to the consumer. |

## Red Flags

**STOP if you catch yourself:**
- Marking documentation as complete without reading the source code
- Ignoring code examples that might be outdated
- Skipping the link validation step
- Not checking for newly added features that lack documentation
