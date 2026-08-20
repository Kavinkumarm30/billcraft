# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in BillCraft, please report it privately to **kavinkumar.m30@gmail.com** rather than opening a public issue.

---

## Fixed Vulnerabilities

### [CRITICAL] Admin Privilege Escalation — All Users Receiving Admin Access
**Severity:** Critical  
**Affected components:** Android app (`LoginActivity.java`), Server auth middleware (`src/middleware/auth.ts`)  
**Fixed in:** August 2026  

#### Description

Three compounding bugs caused every user of the Android application to be granted super-admin privileges, regardless of their actual role in the database.

#### Root Causes & Fixes

| # | Location | Bug | Fix |
|---|----------|-----|-----|
| 1 | `LoginActivity.java` | `btnQuickAccess` button wired to `performDirectLogin()` with owner's email — any user could tap it to instantly get admin credentials | Removed the button's click listener entirely |
| 2 | `LoginActivity.java` | All Google Sign-In failure paths (network error, missing ID token, API exception) silently fell back to `performDirectLogin()`, which hardcoded `role = "ADMIN"` and injected `demo_token_authenticated` | Replaced all fallbacks with user-facing error toasts; errors no longer escalate privileges |
| 3 | `LoginActivity.java` | `performDirectLogin()` hardcoded `role = "ADMIN"`, `subscriptionStatus = "ACTIVE"`, and the owner's email as fallback for all users | Renamed to `saveLocalUserAndProceed()`, which uses the real user's name/email, defaults role to `"EMPLOYEE"` and subscription to `"TRIAL"` |
| 4 | `LoginActivity.java` | `syncUserWithBackend()` fell back to `performDirectLogin()` on any non-200 response or network failure, including 401/403 | Now handles 401/403 by clearing the session and showing an "access denied" error; server errors use `saveLocalUserAndProceed()` |
| 5 | `src/middleware/auth.ts` | Token bypass matched **any** token starting with `demo_token` or `mobile_token`, granting super-admin identity to crafted tokens like `Bearer mobile_token_attacker` | Bypass now requires **exact equality** with `demo_token_authenticated`; all other `demo_token_*` and `mobile_token_*` prefixes return `401 Unauthorized` |

#### Impact

Before fix: Any user who opened the Android app received admin-level access, regardless of their actual database role. An attacker could also craft a `Bearer mobile_token_anything` HTTP request to the server API and get full super-admin access to all endpoints.

After fix: Only Firebase-authenticated users receive their correct role from the database. The server's demo token bypass is limited to a single exact-match string for owner use only.
