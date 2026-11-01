# Codex → Claude Code handover audit — 1 November 2026

Known: Production authentication remains **BLOCKED** (secure live-key entry, then deployment approval). Launch verdict: **NO-GO**.
This record supersedes handover claims that conflict with repository/GitHub evidence below.

## Corrections to the handover brief

| Handover claim                                    | Verified fact (GitHub API, 1 Nov 2026)                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| PR #14, #17, #21 merged                           | **Open, unmerged.** Main is `cda8773`. Merged: #1, #3–#13, #15, #16.                                                   |
| "CI passed 232 tests" as current release evidence | 232 is main `cda8773`. PR #19 head = 248; PR #17 head = 251; this branch = 268.                                        |
| Production uses Node 24                           | `engines` and CI require 24. This audit's sandbox ran Node 22.23.4; local results below are not Node 24 evidence.      |
| `neo-hireflex-hub` is part of HiredFlex           | It is Neo's Lovable personal portfolio site (TanStack Start). It is not the HiredFlex platform; no changes made there. |

Open PRs at audit time: #14 (stale outage record), #17 (CODEX-03 diagnostics), #18 (CODEX-04 requirement races), #19 (CODEX-07 Clerk proxy), #20 (CODEX-05 backup/restore rehearsal), #21 (Draft 0.3 reconciliation), #22 (R1 retention review).

## Local quality evidence (this sandbox, Node 22.23.4)

| Revision                             | Tests        | typecheck | lint | format:check      | build | verify:startup |
| ------------------------------------ | ------------ | --------- | ---- | ----------------- | ----- | -------------- |
| main `cda8773`                       | 232/232 pass | pass      | pass | **FAIL** (2 docs) | pass  | pass           |
| PR #19 head `1df822a`                | 248/248 pass | pass      | pass | pass              | pass  | pass           |
| This branch (#19 + issuer fix + #17) | 268/268 pass | pass      | pass | pass              | pass  | pass           |

`npm audit --omit=dev` on PR #19: 0 vulnerabilities. GitHub CI (Node 24 + PostgreSQL 18 `db:verify`) passed on PR #19 head (run 41183809493) and PR #17 head (run 40604141237). **This branch has no CI run yet**; `verify.yml` runs only on `main` pushes and pull requests. No local PostgreSQL is available, so `db:verify` was not run here.

## Code change: proxied-instance issuer

Clerk can stamp session tokens from a proxied instance with the proxy URL as `iss`, instead of the `clerk.<host>` Frontend API URL. The PR #19 verifier accepted only `https://clerk.hiredflex-platform.vercel.app`. If Clerk issues the proxy form, every Production session would have been rejected with 401 on first deployment. The fix (`acceptedIssuers` in `src/auth/identity.ts`) accepts exactly the two server-configured issuers **only when `CLERK_PROXY_URL` is configured**. RS256 signature against the instance JWKS, `azp`, `exp`/`nbf`, `sid` and pending-session checks are unchanged. Preview keeps one exact issuer. Tests cover: proxy issuer accepted in proxy mode; proxy issuer rejected without proxy; trailing-slash, bare-origin and attacker issuers rejected.

Which issuer form the live instance actually uses is **Unknown** until a real Production session token is observed after deployment.

## Deployment-ordering hazard (must read before any merge to main)

Vercel deploys `main` to Production. The 31 October record says the managed Clerk keys are now **Preview-only**, `CLERK_PROXY_URL` is **Production-only**, and live keys have **not** been entered. If that state still holds:

- Redeploying current `main` code → no publishable/secret key in Production → identity disabled → sign-in disappears from Production.
- Deploying PR #19/this branch → `CLERK_PROXY_URL` without keys → `readIdentityConfig` throws `Incomplete Clerk proxy configuration` → **server fails to start; whole Production site down**.

Therefore: **do not merge any PR to `main` until the owner has entered the matching live key pair (Production-only) and metadata has been re-verified.** This includes documentation-only PRs, because a main push triggers a Production build. This audit could not re-read Vercel metadata (connector lacked `hired-flex1` team authorisation), so the current environment state is Likely, not Known.

## Status not re-verified in this audit

- Live endpoints: the sandbox network policy denies `hiredflex-platform.vercel.app` (proxy 403). The last direct evidence is 31 Oct (readiness 200, protected APIs 401, dev-key mode).
- Vercel env/deployment metadata, Clerk dashboard, Neon: no access this session.
- Figma rendered comparison: not attempted; prior evidence says Make files cannot be rendered by the connector.

## Activation sequence (unchanged from PRODUCTION-AUTH-RECOVERY, with ordering made explicit)

1. Owner enters live `CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` from instance `ins_3LIjugvIJAkPTvd2QAhCCqMHtoE`, Production-only, directly in Vercel. Never in chat.
2. Re-read metadata without decryption (Production: live pair + proxy + origin; Preview: managed dev pair intact; separate Neon stores).
3. Open a PR from this branch to get Node 24 + PostgreSQL CI on the exact SHA.
4. Owner approves deployment of that exact SHA. Merge → Production deploy. No migration required.
5. Clerk dashboard: Verify proxy. Then live acceptance: readiness, live-key mode, `/__clerk` health, signup with verified email, signin/reload/signout, independent candidate/employer/recruiter accounts and cross-company isolation.
6. Rollback: Vercel instant rollback to `dpl_FLMagkJ1A5yLG3EJjeuLH8JbLbaf` (requires owner approval). Note that rollback restores dev-key mode, not a working Production login.
