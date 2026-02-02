---
name: code-review
description: Use when code needs quality review against plan and coding standards
phases: [R, V]
---

# Code Review

## Process

### Step 1: Understand Context
1. Read the plan or task description — what was supposed to be built?
2. Identify the changed files (git diff or explicit file list)
3. Understand the architecture of the affected area

### Step 2: Plan Alignment Analysis
- Does the implementation match the plan/requirements?
- Are there missing features from the specification?
- Are there extra features not in the specification (scope creep)?

### Step 3: Code Quality Assessment
Review each changed file for:
- **Correctness**: Does the logic do what it claims?
- **Error handling**: Are edge cases covered?
- **Naming**: Are variables and functions clearly named?
- **Complexity**: Can anything be simplified?
- **DRY**: Is there duplication that should be extracted?
- **YAGNI**: Is there over-engineering or premature abstraction?

### Step 4: Security Review
- Input validation on system boundaries
- No hardcoded secrets or credentials
- SQL injection, XSS, command injection prevention
- Proper authentication and authorization checks

### Step 5: Architecture Review
- Does it follow existing patterns in the codebase?
- Are dependencies appropriate?
- Is the code in the right layer/module?

### Step 6: Issue Categorization

| Severity | Definition | Action |
|----------|-----------|--------|
| **Critical** | Bug, security flaw, data loss risk | Must fix before merge |
| **Important** | Design issue, missing edge case | Should fix before merge |
| **Suggestion** | Style, alternative approach, minor improvement | Consider for future |

## Output Format

For each issue found:
```
[SEVERITY] file:line - Description
  Context: What you observed
  Suggestion: How to fix it
```

## Red Flags

**STOP the review if you find:**
- Committed secrets (API keys, passwords, tokens)
- SQL injection vulnerabilities
- Disabled security checks
- Tests that are commented out or skipped
