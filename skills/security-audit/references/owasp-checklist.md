# OWASP Checklist & Detailed Audit Steps

## Injection Audit Table

| Type | What to Look For | Fix |
|------|-----------------|-----|
| **SQL Injection** | String concatenation in queries, raw SQL with user input | Use parameterized queries / ORM methods |
| **Command Injection** | `exec()`, `spawn()`, `system()` with user input | Avoid shell commands; use libraries instead |
| **XSS (Stored)** | User input rendered in HTML without escaping | Sanitize on input, escape on output |
| **XSS (Reflected)** | Query params reflected in response body | Content-Security-Policy headers, escape output |
| **NoSQL Injection** | User input in MongoDB queries without validation | Validate types, use schema validation |
| **Template Injection** | User input in template strings | Never pass user input to template engines |

## Authentication and Session Audit

- Are passwords hashed with bcrypt/argon2 (NOT md5/sha1)?
- Are sessions invalidated on logout?
- Is session fixation prevented (regenerate ID on login)?
- Are JWTs validated properly (algorithm, expiry, issuer)?
- Is there rate limiting on login endpoints?
- Are password reset tokens single-use and time-limited?

## Authorization Audit

- Is there authorization on EVERY endpoint (not just authentication)?
- Can users access resources belonging to other users/tenants?
- Are role checks performed server-side (not just UI hiding)?
- Is the principle of least privilege followed?
- Are admin endpoints protected by additional checks?

## Sensitive Data Exposure Audit

- Are secrets hardcoded in source code? (`grep` for API keys, passwords, tokens)
- Is sensitive data logged? (passwords, tokens, PII in log output)
- Are `.env` files in `.gitignore`?
- Is data encrypted in transit (HTTPS) and at rest?
- Are error messages leaking internal details (stack traces, SQL queries)?

## Dependency Audit

```bash
# Check for known vulnerabilities
pnpm audit
npm audit

# Check for outdated packages with known CVEs
pnpm outdated
```

## Severity Categorization

| Severity | Definition | Response Time |
|----------|-----------|---------------|
| **Critical** | Active exploit possible, data breach risk | Fix immediately, block deployment |
| **High** | Exploitable with some effort, privilege escalation | Fix before next release |
| **Medium** | Requires specific conditions to exploit | Fix within sprint |
| **Low** | Theoretical risk, defense-in-depth issue | Track and fix when convenient |
| **Info** | Best practice deviation, no direct risk | Document for future improvement |

## OWASP Top 10 Quick Reference

| OWASP Category | Key Check |
|----------------|-----------|
| A01 Broken Access Control | AuthZ on every endpoint, tenant isolation |
| A02 Cryptographic Failures | HTTPS, proper hashing, no hardcoded secrets |
| A03 Injection | Parameterized queries, no shell exec with user input |
| A04 Insecure Design | Threat modeling, input validation at boundaries |
| A05 Security Misconfiguration | Default credentials, verbose errors, open CORS |
| A06 Vulnerable Components | `pnpm audit`, outdated dependencies |
| A07 Auth Failures | Rate limiting, session management, password policy |
| A08 Data Integrity Failures | Unsigned JWTs, unverified downloads, CI/CD security |
| A09 Logging Failures | No PII in logs, audit trail for sensitive operations |
| A10 SSRF | Validate URLs, block internal IPs, allowlist domains |

## Rationalization Table

| Excuse | Reality |
|--------|---------|
| "We're behind a firewall" | Firewalls don't stop insider threats or lateral movement. |
| "Nobody would find this endpoint" | Security through obscurity is not security. |
| "We'll add auth later" | Unprotected endpoints in production get exploited immediately. |
| "It's just an internal tool" | Internal tools have access to internal data. Protect them. |
| "The framework handles that" | Frameworks have defaults. Verify the defaults are secure. |
