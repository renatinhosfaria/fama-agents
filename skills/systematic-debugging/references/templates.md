# Systematic Debugging - Templates & Reference

## Evidence Log Template

```
## Evidence Log
- Error: [exact error message or unexpected behavior]
- Location: [file:line where it manifests]
- Input: [what triggers it]
- Expected: [what should happen]
- Actual: [what actually happens]
- Stack trace: [if available]
```

## Hypothesis Template

```
## Hypothesis
- Cause: [what you believe is wrong]
- Evidence: [what supports this belief]
- Prediction: [what should happen if you're right]
- Test: [how to verify without a full fix]
- Result: [confirmed / rejected]
```

## Quick Reference Table

| Phase | Action | Output |
|-------|--------|--------|
| Investigation | Gather evidence, NO fixes | Evidence log |
| Pattern Analysis | Find working vs broken code | Differences identified |
| Hypothesis | Scientific method | Confirmed root cause |
| Implementation | Test-first fix | Passing test + minimal fix |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "I know what the bug is, let me just fix it" | You think you know. Verify first. Misdiagnosis wastes more time. |
| "It's probably just a typo" | Typos don't need debugging. If you're here, it's not a typo. |
| "Let me try a few things" | Random changes create random bugs. Diagnose systematically. |
| "The error message tells me exactly what's wrong" | Error messages describe symptoms, not causes. Investigate. |
| "I'll just revert the last change" | Reverting without understanding means the bug will return. |
| "It works on my machine" | Then the difference between environments IS the bug. Find it. |
