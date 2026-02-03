# Refactoring Techniques & Reference

## Code Smell Table

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

## Technique Examples

### Extract Method
```
Before: One large function with mixed concerns
After:  Main function calling smaller, named functions
```

### Rename
```
Before: const d = getData();
After:  const userProfile = fetchUserProfile();
```

### Move
```
Before: Utility function buried in a component file
After:  Utility function in a shared utils module
```

### Simplify Conditional
```
Before: if (x) { if (y) { if (z) { ... } } }
After:  if (!x) return; if (!y) return; if (!z) return; ...
```

### Extract Constant
```
Before: if (retries > 3) { ... }
After:  const MAX_RETRIES = 3; if (retries > MAX_RETRIES) { ... }
```

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I'll just add this feature while I'm refactoring" | That is how regressions are born. Separate the commits. |
| "Tests are too slow to run after every step" | Run only the relevant test file. Run the full suite after. |
| "This refactoring is too small to commit" | Small commits make safe rollbacks. Commit it. |
| "I don't need tests for this simple rename" | Renames break imports, references, and string matching. Run tests. |
| "I'll write the tests after the refactoring" | Without tests, you cannot prove behavior is unchanged. Tests first. |
