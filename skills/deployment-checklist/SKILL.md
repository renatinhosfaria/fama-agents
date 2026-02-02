---
name: deployment-checklist
description: Pre-deploy validation checklist to verify build, tests, configuration, and infrastructure readiness
phases: [C]
---

# Deployment Checklist - Pre-Deploy Validation

## The Iron Law

**NEVER DEPLOY WITHOUT RUNNING THE CHECKLIST.** Every skipped check is a production incident waiting to happen.

## Process

### Step 1: Build Verification
1. Run full build: `pnpm turbo build`
2. Verify build output exists and is the expected size
3. Check for build warnings that might indicate issues

### Step 2: Test Verification
1. Run full test suite: `pnpm turbo test`
2. Verify 100% of tests pass (zero failures, zero skipped)
3. Check test coverage has not decreased

### Step 3: Configuration Audit
1. Verify environment variables are set for production
2. Check that no `.env` file contains development/staging values
3. Confirm database connection strings point to production
4. Verify API keys and secrets are production values (not hardcoded)

### Step 4: Infrastructure Readiness
1. Database migrations are ready and tested
2. Backup has been taken before migration
3. Health check endpoints are functional
4. SSL certificates are valid and not expiring soon
5. DNS records are correct

### Step 5: Rollback Plan
1. Document the current deployed version/commit
2. Verify rollback procedure is documented
3. Confirm database backup is restorable
4. Test rollback in staging if possible

## Quick Reference

| Check | Command | Expected |
|-------|---------|----------|
| Build | `pnpm turbo build` | Exit 0, no errors |
| Tests | `pnpm turbo test` | All pass |
| Lint | `pnpm turbo lint` | Exit 0 |
| Types | `pnpm turbo typecheck` | Exit 0 |
| Health | `curl /api/health` | 200 OK |

## Checklist

- [ ] Build succeeds with zero errors
- [ ] All tests pass with zero failures
- [ ] Lint and typecheck pass
- [ ] Environment variables are production-ready
- [ ] Database migrations are prepared
- [ ] Database backup has been taken
- [ ] Rollback procedure is documented
- [ ] Health check endpoint responds correctly
- [ ] SSL certificates are valid
- [ ] Monitoring and alerting are configured

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "It worked in staging" | Staging is not production. Run the checklist. |
| "It's just a small change" | Small changes cause big outages. Verify. |
| "We can always rollback" | Only if the rollback plan exists and was tested. |
| "The CI/CD pipeline checks everything" | Pipelines miss configuration and infrastructure issues. |

## Red Flags

**STOP deployment if:**
- Any test is failing or skipped
- Build produces warnings you do not understand
- Environment variables are missing or look wrong
- No database backup exists
- No rollback plan is documented
