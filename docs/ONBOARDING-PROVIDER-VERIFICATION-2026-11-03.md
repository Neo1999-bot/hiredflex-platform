# Onboarding provider failure/refusal verification — 3 November 2026

Known: bounded code correction and synthetic signed-request verification. Live Production authentication remains blocked. No production/provider configuration, account, privilege or database was changed.

## Findings before editing

Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. Existing PR #25 owns startup-order correction and current incident/release-gate documentation; do not duplicate or merge that work here. PRs #18/#20/#21/#22 also remain separate scoped changes. The current same-origin onboarding route already verifies signed sessions, requires an empty request body and a verified primary email, and creates Candidate only through its existing transaction. Email-only identity attachment remains forbidden.

New tests on unchanged main reproduced four provider failure cases returning generic 500: network rejection, malformed JSON, invalid address collection and malformed verified-primary email. A separate targeted reproduction showed a primary email with `verification: null` also returned 500. The installed official `@clerk/backend` 3.26.4 definition at `dist/api/resources/JSON.d.ts`, EmailAddressJSON, explicitly permits `verification: VerificationJSON | null`. This is a valid unverified state, not proof of verification or a reason to dereference a missing record.

## Bounded correction

- Handle null verification safely as unverified: 403 VERIFIED_EMAIL_REQUIRED; a verified secondary cannot replace the primary.
- Bound only provider transport/JSON/required-profile-shape processing. Network/HTTP/JSON/malformed required data becomes sanitised 503 IDENTITY_UNAVAILABLE without leaking provider errors or contents into the response/error log. Existing ten-second timeout remains. Redirects are refused rather than followed by the profile fetch.
- Preserve missing-primary refusal, normal primary-email lowercasing and display-name fallback. No name/qualification/verification claim is invented.
- Leave database transactions and their errors outside the provider catch. Existing duplicate-account 409 ACCOUNT_REQUIRES_SUPPORT, ownership, role provisioning, lifecycle and history behaviour remain unchanged.

This is not a complete provider-payload schema, successful account-creation proof or new identity provider. Other optional provider fields remain outside this bounded validation. No retries, uploads, notifications, matching changes or new application states were introduced.

## Verification and limits

`src/auth/onboarding-provider.test.ts` uses real ephemeral RS256 signatures/JWKS, the normal JWT verifier and the real HTTP onboarding handler, **without** a synthetic principal resolver. Only the exact JWKS/profile provider destinations are intercepted; unexpected outbound destinations fail. Provider values, subjects and credentials are fictional. Database reads are mocked as an unmapped identity, and transaction calls are monitored; no actual database is queried by these cases.

Twelve cases cover null verification, unverified primary versus verified secondary, missing primary, provider HTTP/redirect/network/JSON failures, malformed address collection/verified-primary value, unsigned onboarding, role-injection body and preserved duplicate-account 409. Refusals/provider failures must make no transaction call, copy no secret marker into response/error logs, and enforce no-follow redirects. The verified-primary duplicate case reaches only a mocked failing transaction to prove the provider catch does not swallow the support conflict; it does not prove actual SQL uniqueness or persisted onboarding.

Full local/CI quality and disposable PostgreSQL results belong to the exact feature head. Existing PostgreSQL workflow/isolation tests remain separate from these mocked-provider tests. No live email verification, cookies, Clerk signup/signout/session persistence or independent-role browser acceptance is claimed.

## Fresh operational evidence

3 November names/types/scopes-only inspection still shows Production proxy/origin/database configured with no Production live publishable/secret pair; managed development keys remain Preview-only. Public homepage and readiness returned HTTP 500 FUNCTION_INVOCATION_FAILED; the session read encountered URLError, so its current HTTP status is not claimed. No configuration or recovery deployment was attempted; no completed migration was repeated. Existing secure key entry and exact recovery deployment approval (or separate rollback approval) remain the operational blocker. This code correction alone does not restore Production.

Saved Draft 0.3 was read again in full, version 1, modified 27 October UTC. Conditional governance approval does not establish an effective policy or permit real intake/deletion. This change edits no policy text or operational records.

## Figma-to-application traceability

| Existing target                        | Route / API                                          | Actual evidence                                                                                                      |
| -------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Sign-in / candidate account onboarding | `/#workspace`; signed `POST /auth/onboard`           | Synthetic normal-JWT requests verify refusal and retryable provider-failure states, not live signup or visual parity |
| Existing identity/session boundary     | `GET /auth/session`; database-owned role assignments | No role or privilege granted; unmapped signed identities cannot submit client roles                                  |

The exact [HiredFlex Make prototype](https://www.figma.com/make/xNiwwAOZfsOz5tjWHEDmeK/HiredFlex-%E2%80%94-Stage-1-COMPLETE-%E2%80%94-26-Sep-2026) again returned twelve source/asset links without rendered screens. Make screenshot rendering remains unsupported; zero rendered screens/source contents inspected, zero designs changed. Existing [Phase 6 map](PHASE-6.md) remains comparison targets, not verified frame identities. Visual discrepancies are Unknown. Completed prototype Stages 1–2 remain preserved; no two-way synchronisation claimed.

## Bounded acceptance

Accept for review only after all twelve focused cases, full quality checks and fresh disposable PostgreSQL CI pass on the exact feature SHA. Stop at that criterion. Production recovery and full verified-email/independent-account acceptance remain separate; do not merge any pending PR into the Production-linked main branch while credentials are incomplete.
