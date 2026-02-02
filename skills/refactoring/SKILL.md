---
name: refactoring
description: Use when improving code structure without changing external behavior
phases: [E]
---

# Refactoring - Safe Structural Improvement

## The Iron Law

**NEVER REFACTOR AND ADD FEATURES SIMULTANEOUSLY.** Refactoring changes structure. Features change behavior. Mixing them makes failures impossible to diagnose. Do one or the other, never both.

## Process

### Step 1: Ensure Tests Are Green

Before touching any code:

1. Run the full test suite — every test must pass
2. If tests are failing, fix them first (that is debugging, not refactoring)
3. If there are no tests for the code you want to refactor, **write tests first**

```bash
pnpm turbo test
# All tests MUST pass before proceeding
```

### Step 2: Identify the Smell

Name the specific code smell you are addressing:

| Smell | Symptom | Technique |
|-------|---------|-----------|
| **Long method** | Method > 20 lines | Extract Method |
| **Duplicate code** | Same logic in 2+ places | Extract and reuse |
| **Large class** | Class with too many responsibilities | Extract Class |
| **Long parameter list** | Function with > 3 parameters | Introduce Parameter Object |
| **Nested conditionals** | 3+ levels of if/else nesting | Guard clauses, early return |
| **Magic numbers/strings** | Hardcoded values without names | Extract Constant |
| **Feature envy** | Method uses another class more than its own | Move Method |
| **Dead code** | Unreachable or unused code | Delete it |

### Step 3: Apply Small Incremental Steps

For each refactoring move:

1. Make **one single change** (extract, rename, move, etc.)
2. Run tests — they must still pass
3. If tests fail, **undo immediately** and try a smaller step
4. Commit after each successful step

**Never combine multiple refactoring moves in a single step.**

### Step 4: Common Techniques

#### Extract Method
```
Before: One large function with mixed concerns
After:  Main function calling smaller, named functions
```

#### Rename
```
Before: const d = getData();
After:  const userProfile = fetchUserProfile();
```

#### Move
```
Before: Utility function buried in a component file
After:  Utility function in a shared utils module
```

#### Simplify Conditional
```
Before: if (x) { if (y) { if (z) { ... } } }
After:  if (!x) return; if (!y) return; if (!z) return; ...
```

#### Extract Constant
```
Before: if (retries > 3) { ... }
After:  const MAX_RETRIES = 3; if (retries > MAX_RETRIES) { ... }
```

### Step 5: Verify No Behavior Change

After all refactoring is complete:

1. Run the full test suite — all tests must still pass
2. Run lint and typecheck — no new warnings
3. If the refactoring is in an API: verify the API contract has not changed
4. Review the diff — does it only contain structural changes?

```bash
pnpm turbo test && pnpm turbo lint && pnpm turbo typecheck
```

## Quick Reference

```
Tests green → Identify smell → One small change → Tests green → Commit → Repeat
```

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I'll just add this feature while I'm refactoring" | That is how regressions are born. Separate the commits. |
| "Tests are too slow to run after every step" | Run only the relevant test file. Run the full suite after. |
| "This refactoring is too small to commit" | Small commits make safe rollbacks. Commit it. |
| "I don't need tests for this simple rename" | Renames break imports, references, and string matching. Run tests. |
| "I'll write the tests after the refactoring" | Without tests, you cannot prove behavior is unchanged. Tests first. |

## Red Flags

**STOP immediately if you catch yourself:**
- Changing behavior while refactoring (adding features, fixing bugs)
- Making multiple changes between test runs
- Refactoring code that has no test coverage
- Tests are red and you are still making structural changes
- The diff contains both structural changes and new functionality
- Skipping test runs because "this change is trivial"
