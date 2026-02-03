---
name: release-notes
description: Use when generating release notes from completed work. Extracts changes from commits and PRs, categorizes, and formats for stakeholders.
phases: [C]
---

# Release Notes - Changelog Generation

## The Iron Law

**EVERY RELEASE MUST HAVE RELEASE NOTES.** Users, stakeholders, and future developers need to know what changed, why, and what to watch for.

## Process

### Step 1: Gather Changes
1. List all commits since last release: `git log <last-tag>..HEAD --oneline`
2. List all merged PRs if available
3. Identify the scope: features, fixes, breaking changes, dependencies

### Step 2: Categorize Changes

| Category | Prefix | Description |
|----------|--------|-------------|
| Features | feat | New functionality |
| Bug Fixes | fix | Corrected behavior |
| Breaking Changes | BREAKING | Incompatible changes |
| Performance | perf | Speed/resource improvements |
| Documentation | docs | Documentation updates |
| Dependencies | chore(deps) | Updated dependencies |
| Internal | refactor/chore | Non-user-facing changes |

### Step 3: Write Release Notes

Structure:
```
## [version] - YYYY-MM-DD

### Breaking Changes
- Description of breaking change and migration path

### Features
- Description of new feature (#PR)

### Bug Fixes
- Description of fix (#PR)

### Performance
- Description of improvement

### Internal
- Non-user-facing changes (summarized)
```

### Step 4: Highlight Migration Steps
For any breaking change, provide:
1. What changed
2. Why it changed
3. Step-by-step migration instructions
4. Before/after code examples

## Quick Reference

| Section | Include When |
|---------|-------------|
| Breaking Changes | Always if any exist |
| Features | Always |
| Bug Fixes | Always |
| Performance | When measurable |
| Internal | Summarize briefly |

## Checklist

- [ ] All commits since last release have been reviewed
- [ ] Changes are categorized correctly
- [ ] Breaking changes include migration instructions
- [ ] Feature descriptions are user-facing (not technical jargon)
- [ ] Bug fixes reference the issue or symptom that was resolved
- [ ] Version number follows semver

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "The commit messages are enough" | Commit messages are for developers. Release notes are for users. |
| "Nobody reads release notes" | They read them when something breaks. Make them findable. |
| "We'll write them later" | Later never comes. Write them now while context is fresh. |

## Red Flags

**STOP if you catch yourself:**
- Copying commit messages verbatim as release notes
- Omitting breaking changes
- Writing release notes without reviewing all commits
- Using internal jargon in user-facing descriptions
