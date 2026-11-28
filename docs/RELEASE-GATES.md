## Latest evidence refresh — 28 November 2026

This snapshot supersedes only the observations it explicitly updates. It records fresh GitHub, CI, Vercel, runtime-telemetry, saved-project and Figma-access checks. The only writes are documentation-only commits to `docs/RELEASE-GATES.md` on the existing PR #25 development branch. No secrets were decrypted; no Vercel settings, production resources, live records, roles, migrations or repository protections were changed. GitHub branch pushes triggered normal Preview builds; no Production deployment was promoted, rolled back or manually redeployed.

### Repository, active work and Phase 5/6 reconciliation

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`; PR #1 is closed and merged at `2eb6661b15cbc31887b233250a7eb50dd33be22b`.
- PR #25 remains open and unmerged on `fix/startup-identity-validation-2026-11-02`. The code head reviewed at the start of this run was `4d7260d491839252ae64b5fa372fe02524025246`; a later documentation-only evidence refresh was committed on the same branch. The application correction reads Clerk identity configuration before constructing the database client in both `src/app.ts` and `src/server.ts`; main still constructs the database client first. It fails closed and does not repair an invalid live key or restore Production by itself.
- PR #26 remains open and unmerged at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`. Its signed synthetic PostgreSQL tests cover verified-primary-email onboarding, persisted Candidate creation, duplicate-email refusal/no linking, rollback, suspension/role denial, and independent Employer/Recruiter company and vacancy-assignment isolation. These are CI/SQL-backed synthetic results, not live Clerk/browser sessions.
- PR #1 is historical and merged. The `phase-5-postgres-verification` branch still exists at `41ef602ef20ad15b5045cbe5c3cfaf9b59c340a0`; it is historical verification work, not the active Phase 6 branch.
- Open PRs observed: #14, #18, #20, #21, #22, #25, #26, #27 and #28. PRs #18/#20/#21 have older-base integration issues; #22 is stacked on #21. PR #27 (Speed Insights) and #28 (Web Analytics) add optional instrumentation/dependencies and are not required by the approved MVP; leave them out of the release path pending a separate product/privacy decision.
- Phase 5 documentation is partially reconciled on main: its introduction already identifies Phase 5 as historical, but its generic “Deployment sequence” heading remains. PR #25 makes the supersession explicit. Phase 6's route/API table is an application mapping, not verified Figma frame/node evidence. PR #25 and #26 both touch `docs/PHASE-6.md`; reconcile that shared document during review rather than duplicating it.

### Automated verification — exact feature heads

- The preceding PR #25 code head `4d7260d` has successful GitHub Actions run [45951194444](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/45951194444), job `140347205689`. Inspected logs confirm 21 test files, TypeScript, build, packaged startup, lint, format and disposable PostgreSQL 18.7 verification passed. The startup verifier explicitly passed missing/incomplete proxy-key and malformed publishable-key cases without leaking synthetic markers. The PostgreSQL log records migration/rerun, constraint, rollback, isolation and application-lifecycle PASS. This is CI evidence for that code head, not a live database or provider test; the later documentation-only update has a separate CI run.
- PR #26 exact head `3ac6c647` has successful [run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357), job `127745773095`. Inspected logs confirm 284 tests across 21 files, PostgreSQL 18.6, signed synthetic onboarding, persisted account/role denial, Employer/Recruiter company-and-assignment isolation, and the retained lifecycle verification passed.
- Non-failing maintenance warnings remain: an esbuild install script is outside the package allow-scripts list, and GitHub Actions v4 steps target Node 20 while the runner forces Node 24. They should be reviewed separately; they did not fail these runs.

### Vercel, environment inventory and runtime evidence

- Main Vercel project `hiredflex-platform` reports Node `24.x`. Its latest observed Production deployment is `dpl_FNynyLhkrr6QAVNtK3X7Y8MDdkj3`, target Production, READY, built from main `aa8026e`. READY is provider deployment metadata, not a successful readiness or authentication check.
- The preceding branch Preview in the main project is `dpl_7vk6TwmTDEAVCaznW89sY9wB1WG4`, READY at code head `4d7260d`, target null (Preview). The later documentation-only update queued a separate Preview build; no application code changed. The main project reports SSO protection for non-custom deployment URLs.
- The separate `hiredflex-platform-ptor` project reports Node `26.x`, while repository `package.json` requires `>=24 <25`. Its latest Preview deployment `dpl_E1z9Vr9zC6UTjJw5qMqChUoR7WNX` reports READY, but its read-only environment inventory returned only Production-target Clerk entries; one variable name itself is publishable-key-shaped. No Preview-target Clerk pair was returned. Values were not decrypted. This project is not a valid authenticated acceptance environment until its owner reviews the configuration and Node-version mismatch.
- Main-project environment inventory (decryption disabled) contains the expected Production names `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL`; Preview also has Clerk secret/publishable-key names. Names and targets do not prove values are valid or correspond to the intended Clerk instance.
- The 7-day runtime-error aggregate reports 46 `Invalid Clerk publishable key` events across 21 users, first seen 15 November and last seen 24 November, on deployment `dpl_8DDz71DEgb6qzvF2xV9XCSUzMtWp`. The 24-hour aggregate currently returns no error groups. This does not prove the site is healthy: raw log retrieval beyond one hour is unavailable on the current Hobby retention window, and direct read-only requests to Production and the protected Preview readiness URLs were inaccessible through the available web path. No authenticated HTTP readiness or browser journey was established.
- No environment values were decrypted, no Vercel variables were edited, and no temporary share/bypass link was created. Branch commits triggered Preview builds only; no Production promotion, rollback or manual redeployment occurred.

### Figma Make inspection status

- The Figma Make URL was opened in the embedded Figma host view. Figma session creation rejects Make files as unsupported; the design-context reader requires its design-to-code guidance, but the installed skill registry returned no available skills. The generic metadata/screenshot readers do not support Make files.
- Therefore zero actual frames, screens, nodes, tokens or interactions were inspected; zero Figma designs were changed. The repository's route/API mapping remains application evidence only. Visual parity and design discrepancies remain UNKNOWN, not passed or failed. A supported Make-compatible read/export path or a standard Figma Design-file copy with accessible node references is required before visual comparison.

### Release position

- Synthetic CI evidence now covers persisted onboarding and cross-role/company/assignment isolation, but live Clerk sign-in, verified-email delivery, browser cookie/session persistence/refresh, sign-out and independent live Candidate/Employer/Recruiter journeys remain NOT VERIFIED.
- The main Production deployment is READY metadata only; the invalid-publishable-key runtime evidence and inaccessible authenticated readiness keep the release NO-GO. PR #25's startup-order fix is useful but does not replace correct Production identity configuration and explicit deployment approval.
- Backup/restore ownership and capacity acceptance, mobile/accessibility QA, privacy/support ownership and effective retention-policy approval remain separate launch gates. Draft 0.3 is not effective and does not authorise candidate intake or automated deletion.
- Interviews, offers, CV uploads, notifications, billing, automated screening and optional redesign remain deferred. Matching remains informational; search remains independent; the application lifecycle and accepted prototype Stages 1–2 are preserved.

---

## Latest evidence refresh — 27 November 2026

This snapshot supersedes only the older repository, deployment, configuration and verification observations it explicitly updates. It records a fresh read-only review of main, open PRs, exact-head CI logs, Vercel deployment/project metadata, environment-variable names/targets with decryption disabled, runtime telemetry, saved HiredFlex decisions and the Figma Make access attempt. The only write in this run is this release-evidence update on the existing PR #25 branch. No environment values were decrypted; no Vercel settings, secrets, deployment targets, repository visibility/protection, live data or Production state were changed. No merge, migration, share link, SSO bypass, paid resource or external communication occurred.

### Repository, current code and review state

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. PR #25 remains open, unmerged and mergeable against main at `d1f2d6e856aa1f9cc7072a59df0c2726e21c90bf` (`fix/startup-identity-validation-2026-11-02`). Compare reports 78 commits ahead, none behind, and 14 changed files. Its startup correction reads/validates Clerk identity configuration before constructing the database client in both `src/app.ts` and `src/server.ts`; main still constructs the database client before identity validation. This correction remains unmerged.
- PR #26 remains open, unmerged and mergeable against main at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0` (`fix/onboarding-provider-failures-2026-11-03`). Compare reports 4 commits ahead, none behind, and 6 changed files. It handles nullable Clerk email-verification data and requires the verified primary email for persisted Candidate onboarding. It remains unmerged.
- Neither PR has a submitted human review. Both PRs modify `docs/PHASE-6.md`, so that documentation overlap must be reconciled during owner review. Their principal code changes are separate: PR #25 changes startup ordering; PR #26 changes identity/onboarding verification.
- Current open PRs include #14, #18, #20, #21, #22, #25 and #26. PRs #18, #20 and #21 are non-mergeable against older bases; #22 is stacked on #21. PR #1 is closed and merged. `phase-5-postgres-verification` remains a historical branch at `41ef602ef20ad15b5045cbe5c3cfaf9b59c340a0`.
- Phase 5 reconciliation is **partial on main, more explicit on PR #25**. Main's `docs/PHASE-5.md` already opens by calling Phase 5 historical and warning not to rebuild Phase 6 workspaces, but it retains the generic `## Deployment sequence` heading. PR #25 renames that heading to `Historical deployment sequence (superseded by Phase 6)` and adds the 8/12 November Phase 5/6 evidence boundary. Do not describe main as wholly unreconciled, and do not treat the old sequence as missing implementation.
- Phase 6's route/API table remains an application wiring map. Its flow labels are comparison targets, not verified Figma frame names or node mappings. PR #26 adds persisted signed-onboarding and company/assignment-isolation evidence to the Phase 6 record; it does not establish live Clerk browser acceptance.

### Exact-head automated verification

- PR #25 exact-head GitHub Actions [run 45768341026](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/45768341026), job `139734638893`, completed successfully for head `d1f2d6e` on 26 November. Inspected job steps show `npm ci`, typecheck, build, packaged startup verification, lint, format check, unit tests and `db:verify` all succeeded. Logs confirm **276 tests across 21 files**, the startup-validation PASS line, and the PostgreSQL 18.7 disposable lifecycle/rollback/isolation PASS line.
- PR #26 exact-head [run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357), job `127745773095`, completed successfully on 6 November for head `3ac6c647`. Logs confirm **284 tests across 21 files**, PostgreSQL 18.6, signed persisted-onboarding PASS, persisted account-suspension/Candidate-role-denial PASS, separate signed Employer/Recruiter company-and-vacancy-assignment isolation PASS, and the retained application-lifecycle PASS. This is exact-head historical evidence, not a new 27 November run.
- PR #25 CI warnings are non-failing: the `esbuild@0.28.2` install script is not covered by the package allow-scripts list, and GitHub Actions still uses actions targeting Node 20 while the runner forces Node 24. These are maintenance/security-review items, not evidence of an exploitable vulnerability.
- These checks are synthetic CI evidence. They do not prove real Clerk email delivery, browser cookies/session refresh, token revocation, sign-out, live independent user journeys or Production acceptance.

### Vercel deployment, access and configuration observations

- Current Production deployment `dpl_FNynyLhkrr6QAVNtK3X7Y8MDdkj3` reports READY for unchanged main `aa8026e`, target Production. The isolated `hiredflex-platform-ptor` deployment `dpl_4DYzfLPHmd52X8338DBBm35sbdND` reports READY for PR #25 head `d1f2d6e`, target `null` (Preview, not Production).
- Both the Production project and isolated Preview project report SSO protection enabled for `all_except_custom_domains`. Direct read-only retrieval of the Preview and public Production URLs through the available web path returned inaccessible/internal-error results. No share link was created and no SSO protection was bypassed; authenticated browser acceptance remains blocked.
- The 24-hour runtime-error aggregate returned no errors for either project. The latest 30-minute warning/error/fatal log queries returned no records. Quiet telemetry and READY deployment metadata do not prove successful HTTP readiness or sign-in.
- A fresh project-level environment inventory used `decrypt=false`. On the main `hiredflex-platform` project, the expected `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL` names are present in Production scope; the Clerk pair, `AUTH_ALLOWED_ORIGINS` and database URL names are also present in Preview scope. This supersedes older snapshots that reported the expected Production key names absent. **No values were decrypted or validated**, so issuer, key-pair correspondence, proxy-domain correctness and actual runtime use remain unverified.
- The separate `hiredflex-platform-ptor` project inventory returned only a `CLERK_PUBLISHABLE_KEY` entry in that project's Production target; it did not return a complete Clerk pair in its Preview target. Do not infer that the PR Preview deployment has a working Clerk session configuration from READY metadata alone. No environment change was made.
- Project metadata reports Node `24.x` for `hiredflex-platform` and `26.x` for `hiredflex-platform-ptor`; repository `package.json` constrains Node to `>=24 <25`. This is a confirmed project-setting/package-engine mismatch to resolve or explicitly explain before treating the isolated Preview as representative acceptance evidence. No Vercel setting was changed.

### Figma Make inspection status

- The embedded Figma host view opened for the supplied Make file. Required Figma session creation rejected the file as unsupported for sessions (supported types returned: Design, FigJam, Slides and Figspec).
- The skill registry returned no installed skills or guidance URI. `get_design_context` requires `figma-design-to-code` guidance before use, and no supported resource-reading path was available; it was not called without that prerequisite. The separate metadata and screenshot tools do not support Make files.
- **Screens/frames inspected: 0; interactions inspected: 0; variables/tokens inspected: 0; Figma changes: 0.** Visual parity and design discrepancies remain **Unknown**. Preserve accepted prototype Stages 1–2; the route/API table remains an application map, not a Figma frame map.

### Saved product decisions and release boundary

- The saved Master Product Specification records Stage 1 as complete and Stage 2 Operations/Recruiter core as complete. The approved ADR keeps search separate from matching, prohibits matching-based search ranking, and makes matching informational rather than a hiring decision. The approved application lifecycle and vacancy-level recruiter ownership remain intact.
- Candidate Data Retention Policy Draft 0.3 remains **not effective**, with no effective date assigned and the approval record still pending. It does not certify compliance, establish HiredFlex's legal status, activate candidate intake or authorise automated deletion. Responsible-party/Information-Officer and legal-scope decisions remain open.
- Interviews, offers, CV/document uploads, notifications, billing, automated screening and optional redesign remain deferred.

### Current must-fix release acceptance

1. Owner review of PR #25 and #26, including their overlapping Phase 6 documentation; neither is merged or human-reviewed.
2. Resolve the isolated Preview's incomplete Preview-target Clerk inventory and Node 26.x versus package Node 24 constraint before using it for authenticated acceptance.
3. Obtain an authorized authenticated browser path to the protected Preview and synthetic accounts for verified-email onboarding, returning sign-in, session persistence/refresh, sign-out and protected-route denial.
4. Complete independent Candidate, Employer and Recruiter browser journeys with company and vacancy-assignment isolation; synthetic SQL/HTTP CI is not a browser substitute.
5. Verify Production health and authentication through a separately approved release procedure; no Production change is authorized by this evidence update.
6. Complete Figma screen/flow comparison when supported Make inspection guidance or a rendered/exported reference is available.
7. Complete privacy/retention ownership, backup/restore responsibility, mobile/accessibility and browser network/error acceptance before real candidate intake.

**Release verdict: NO-GO.** Backend and disposable PostgreSQL verification are strong, but the relevant fixes remain on open branches; protected authenticated browser journeys are not verified; the isolated Preview configuration has unresolved environment/runtime discrepancies; Figma visual parity is unknown; and governance/operational acceptance remains open.

## Latest evidence refresh — 26 November 2026

This snapshot supersedes earlier observations where it states a newer result. Scope was read-only inspection of the repository, PRs, exact-head CI, Vercel deployment metadata/runtime telemetry, saved product decisions and Figma access. The only write in this run is this documentation update on the existing PR #25 development branch. No merge, Production deployment/configuration change, credential read, live migration, real-data test, share link, protection bypass, paid resource or external communication was performed.

### Repository, current code and review state

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. The repository is public and the branch endpoint reports `main` as `protected:false`; the connected integration cannot certify any additional protection rules. No repository visibility or protection setting was changed.
- PR #25 remains open, unmerged and mergeable against unchanged main at `80d3a27a88429ad1cde7486506bb53e642c076b8` (`fix/startup-identity-validation-2026-11-02`). Its existing code correction reads/validates Clerk identity configuration before constructing the database client in both server entrypoints. Main `src/app.ts` still constructs the database client before calling `readIdentityConfig()`; the correction is not on main.
- PR #26 remains open, unmerged and mergeable against unchanged main at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0` (`fix/onboarding-provider-failures-2026-11-03`). Main `src/auth/identity.ts` still types Clerk email verification as non-null; PR #26 allows a null verification record and enforces verified-primary-email onboarding. Its signed synthetic PostgreSQL checks cover Candidate creation and independent Candidate/Employer/Recruiter company/assignment isolation. These changes remain on the open PR, not main.
- No submitted human review was returned for PR #25 or #26. PR #1 is closed and merged; `phase-5-postgres-verification` remains historical at `41ef602ef20ad15b5045cbe5c3cfaf9b59c340a0`.
- The Phase 5/Phase 6 reconciliation already exists on PR #25's branch: `docs/PHASE-5.md` labels its former deployment sequence historical/superseded by Phase 6 and records the 8/12 November evidence boundary. Main's Phase 5 file still shows the older unlabelled deployment sequence. PR #25's Phase 6 file retains the route/API mapping and Figma limitations; PR #26 adds signed-onboarding/role-isolation verification to Phase 6. This is existing work split across two open PRs, not a new task to duplicate.

### Exact-head automated verification

- Exact-head GitHub Actions [run 45559055348](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/45559055348) completed successfully for PR #25 head `80d3a27a88429ad1cde7486506bb53e642c076b8`.
- Inspected job `139018062760` shows `npm ci`, typecheck, build, packaged startup verification, lint, format check, unit tests and `db:verify` all completed successfully. The test log records **276 tests passed across 21 files**.
- The disposable PostgreSQL 18.7 gate records PASS for fresh/rerun migrations, normalization/constraints, transaction rollback, forced HTTP submission/recruiter-review/withdrawal history-write failure rollback and retries, active-application uniqueness, reapplication history, vacancy locking, concurrent submissions, candidate/company isolation, closed-vacancy refusal, null legacy matching and the approved HTTP lifecycle. This is synthetic CI evidence, not live Clerk/browser acceptance.
- CI emitted non-failing warnings for deprecated `punycode` and `url.parse()` usage, an `esbuild@0.28.2` install script not covered by the package allow-scripts list, and GitHub actions still targeting Node 20 while being forced to Node 24. They are follow-up maintenance/security-review items, not a failed gate or proof of an exploitable vulnerability.
- PR #26's previously recorded exact-head [CI run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) remains the existing 284-test/21-file synthetic signed-onboarding and company/assignment-isolation evidence. No new PR #26 run was triggered by this documentation update.

### Vercel Preview and Production observations

- The isolated `hiredflex-platform-ptor` project is `prj_gSTKRF9rh4aas32wRKTBf6NgPKUh`, reports `live:false`, and its latest deployment `dpl_2Q1G7SkTXRMw4iSg59YM3HwVe7sh` is READY for PR #25 commit `80d3a27` with target `null` (Preview, not Production). SSO protection is enabled for `all_except_custom_domains`.
- The isolated Preview's last-24-hour runtime-error aggregate returned no errors; its deployment-scoped 30-minute runtime-log query returned no records. These telemetry results do not prove the app was reached or that authentication works.
- The `hiredflex-platform` project has Production deployment `dpl_FNynyLhkrr6QAVNtK3X7Y8MDdkj3` READY on unchanged main `aa8026e`. Its last-24-hour runtime-error aggregate returned no errors and the 30-minute warning/error/fatal log query returned no records. READY metadata and quiet telemetry are not proof of successful sign-in, session refresh, sign-out or role isolation.
- SSO protection remains enabled for `all_except_custom_domains` on both projects. Direct read-only web retrieval of the isolated Preview homepage, `/health/ready` and `/health/live` was inaccessible. No Vercel share link was created because that would expose a protected deployment; no protection was bypassed. Browser acceptance remains blocked by the absence of an authorized authenticated browser path.

### Figma Make inspection status

- The embedded Figma host view opened and the connected account check returned a Starter plan with a View seat. No editing permission is assumed.
- The Figma tool contract says `get_design_context` can accept a Make file using node `0:1`, but it requires `figma-design-to-code` guidance first. The available skill registry returned **no installed skills or skill URI**, so that tool was not called without its required guidance. The separate metadata and screenshot tools explicitly do not support Make files.
- **Screens/frames inspected: 0; interactions inspected: 0; variables/tokens inspected: 0; Figma changes: 0.** The route/API table remains an application wiring map, not a verified frame mapping. Visual parity and design discrepancies remain **Unknown**. Preserve accepted prototype Stages 1–2.

### Saved product decisions and release boundary

- The saved Master Product Specification and approved Phase 3 ADRs continue to govern: Stage 1/2 remain preserved; search stays independent of matching; matching remains informational and does not make hiring decisions; the approved application lifecycle and vacancy-level recruiter ownership remain intact.
- Candidate Data Retention Policy Draft 0.3 remains not effective, with no effective date; it does not authorise candidate intake, automated deletion or a compliance claim. Responsible-party/Information-Officer ownership and legal scope remain owner/legal decisions.
- Interviews, offers, CV/document uploads, notifications, billing, automated screening and optional redesign remain deferred.

### Current must-fix release acceptance

1. Owner review and normal integration of the existing PR #25 startup correction and PR #26 onboarding/provider correction; neither is merged and no human review submission is recorded.
2. Authorized authenticated Preview browser acceptance with synthetic accounts: verified-primary-email signup/onboarding, returning sign-in, session persistence/refresh, sign-out and protected-route denial.
3. Independent Candidate, Employer and Recruiter browser journeys, including company and vacancy-assignment isolation. Synthetic SQL/HTTP CI does not replace browser acceptance.
4. Production authentication/health acceptance only through a separately approved release procedure; no Production change is authorized by this evidence update.
5. Privacy/retention ownership, backup/restore responsibility, mobile/accessibility and browser network/error acceptance before real candidate intake.
6. Figma Make screen/flow comparison after the required design guidance or a supported rendered/exported reference becomes available.
7. Owner confirmation that public repository visibility is intentional and an owner-verified branch-protection/ruleset policy.

**Release verdict: NO-GO.** PR #25's exact-head CI and isolated Preview deployment are green, and the Phase 5/6 reconciliation is prepared on the PR branch. The PRs remain unmerged, the main branch still contains the identified startup/onboarding code differences, authenticated browser journeys remain unverified, and Figma visual parity is unknown.

---

## Latest evidence refresh — 25 November 2026

This snapshot supersedes earlier status observations where it states a newer result. It records read-only repository, CI, Vercel, saved-project-document and Figma access checks. It does not authorise a merge, Production change, credential/configuration change, migration, live-data test, SSO bypass, paid resource or business/legal commitment.

### Repository and review state

- Repository `Neo1999-bot/hiredflex-platform` remains public. Main is `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`; no main-branch write was made.
- The branch listing reports `main` as `protected:false`. The branch-protection read returned HTTP 403 through the connected integration and the rulesets query returned no rulesets. Enforcement therefore cannot be certified; no protection was bypassed or changed.
- PR #25 remains open, unmerged and mergeable at `4ac574ccc2d7f548f1adbdc22dc167bbd4f8272c`. Its exact-head [CI run 45339562217](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/45339562217) passed: Node 24 install, typecheck, build, packaged startup verification, ESLint, Prettier, 276 tests across 21 files and disposable PostgreSQL 18.7 verification. The startup-identity validation and release-evidence updates remain on this PR branch, not main.
- PR #26 remains open, unmerged and mergeable at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`. Its exact-head [CI run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) passed: 284 tests across 21 files plus disposable PostgreSQL 18 verification. It covers nullable Clerk email verification, verified-primary-email enforcement, provider-failure handling, synthetic signed onboarding and persisted Candidate/Employer/Recruiter company/assignment isolation. The corresponding nullable-verification defect remains present on main until an authorised review/integration.
- No human review submission is recorded for PR #25 or #26. Vercel bot preview comments are not code reviews.
- PR #1 is closed and merged; `phase-5-postgres-verification` remains a historical branch. Phase 5 is explicitly historical and Phase 6 is the current web/identity increment. The latest cross-document reconciliation and 24 November evidence are on PR #25, not yet on main.
- PRs #14, #18, #20, #21 and #22 remain existing workstreams; do not duplicate their Production-acceptance, publication-race, backup/restore or retention-governance tasks. Vercel-generated PRs #27 and #28 are optional analytics/insights work, outside the approved MVP; PR #28's exact-head CI failed its formatting check and was not changed.

### Vercel and Production observations

- Latest Production deployment [dpl_FNynyLhkrr6QAVNtK3X7Y8MDdkj3](https://vercel.com/hired-flex1/hiredflex-platform/FNynyLhkrr6QAVNtK3X7Y8MDdkj3) reports READY from unchanged main `aa8026e`. It is not running the unmerged PR #25/#26 changes.
- Latest PR #25 Preview [dpl_3QLo2KLH1fx4gGg4VAXJ98Kc7JJX](https://vercel.com/hired-flex1/hiredflex-platform/3QLo2KLH1fx4gGg4VAXJ98Kc7JJX) reports READY for `4ac574c`. This is Preview build metadata, not authenticated browser acceptance.
- The Vercel project reports SSO protection enabled for all non-custom domains. No share link was created, no access control was weakened and no protected route was bypassed.
- The fresh 24-hour Production runtime-error aggregate returned no error groups. A 30-minute Production query for warning/error/fatal logs returned no entries. This is a positive telemetry observation only: it does not prove that a real user signed in, that Clerk sessions refresh correctly, or that sign-out revokes access.
- No environment values were decrypted or retrieved. No Production setting, secret, provider configuration, deployment, database, migration or role was changed.

### Figma and design comparison

- The supplied HiredFlex prototype is a Figma Make file. Opening the embedded Figma host view succeeded, but Figma session creation explicitly returned that Make files are unsupported. The metadata and screenshot endpoints also do not support `/make/` files.
- The design-context tool requires `figma-design-to-code` guidance before use; the installed skill registry returned no available skills/skill URI. The public web reader also could not access the Make URL. The connected Figma account has a View seat on the Starter plan; no editing permission is assumed.
- **Frames/screens inspected: 0. Interactions inspected: 0. Variables/tokens inspected: 0. Figma changes: 0.** Visual parity and design discrepancies remain Unknown. The Phase 6 route/API table is an application wiring map, not a verified Figma frame mapping or automatic synchronization.
- Preserve accepted prototype Stages 1–2. No redesign, rebuild, publication or Figma modification was attempted.

### Saved product decisions and scope

- The saved Master Product Specification remains the product source of truth. Matching stays informational, vacancy search stays independent, and the approved application lifecycle remains intact.
- Candidate Data Retention Policy Draft 0.3 remains not effective, has no effective date and does not certify POPIA compliance. The responsible-party/Information-Officer arrangement and legal scope still require owner/legal confirmation. It does not authorise real candidate intake or automated deletion.
- Interviews, offers, CV/document uploads, notifications, billing, automated screening and optional redesign remain deferred.

### Current must-fix release acceptance

1. Review and integrate the existing PR #25 startup correction and PR #26 onboarding/provider correction through the normal owner-controlled workflow; neither is merged.
2. Complete authenticated browser acceptance on an authorised protected Preview using synthetic accounts: sign-in, verified-primary-email onboarding, session persistence/refresh, sign-out, and independent Candidate, Employer and Recruiter journeys.
3. Verify persisted company and recruiter-assignment isolation in those browser sessions; synthetic PostgreSQL CI is not a substitute for browser acceptance.
4. Complete Production health/auth acceptance only after explicit owner approval for any Production recovery action. READY deployment metadata and an empty recent error aggregate are not sign-in evidence.
5. Resolve privacy/retention ownership and provider/backup responsibilities before real candidate intake; complete backup/restore, mobile/accessibility and browser network/error acceptance.
6. Complete the Figma screen/flow comparison when a supported Make-file inspection path and required design guidance are available.
7. Confirm whether public repository visibility is intentional and establish an owner-verified branch protection/ruleset policy before treating repository governance as complete.

**Release verdict: NO-GO.** Backend CI is strong, and the recent Production telemetry is quieter, but the PR fixes remain unmerged and live browser/authentication acceptance is still absent. No real candidate data, live migration, Production change or external communication was performed in this refresh.

---

## Latest evidence refresh — 17 November 2026

This snapshot supersedes the 16 November observations above. It records exact-head CI, current branch/deployment metadata and read-only runtime/configuration evidence. It does not authorise a merge, Production change, rollback, migration, live-data test or public release.

### Repository and automated verification

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. PR #25 remains open/unmerged on `fix/startup-identity-validation-2026-11-02`, based on unchanged main. The code-bearing startup identity-validation regression remains in the PR's earlier code commit; this evidence refresh changes documentation only.
- The preceding PR #25 head `02eea2bf8ffded242c48b2c4b406802fb18eeb4e` passed exact-head GitHub Actions [run 43817000361](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43817000361), job `133131218367`. Inspected steps show Node 24 install, typecheck, build, packaged startup verification, lint, Prettier check, **276 tests across 21 files**, and `db:verify` all passed. The disposable PostgreSQL service was 18.7; its PASS line confirms migration/rerun, normalization/constraints, rollback, forced submission/recruiter-review/withdrawal history-write failure rollback and retries, active-application uniqueness, reapplication history, vacancy locking, concurrent HTTP submissions, candidate/company isolation, closed-vacancy refusal, null legacy matching and the retained HTTP lifecycle.
- The same `npm ci` step reported **9 moderate severity vulnerabilities**. The workflow log does not identify package/advisory names or production-versus-development impact. No `npm audit`, dependency upgrade or lockfile change was run. Keep this as an unclassified security-review item, not a confirmed exploitable production defect.
- PR #26 remains open/unmerged at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`; its exact-head CI [run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) passed 284 tests across 21 files, including signed synthetic onboarding and persisted Candidate/Employer/Recruiter company/assignment isolation. This is existing CI evidence, not a new live-browser run.
- PR #1 is closed and merged at `2eb6661b15cbc31887b233250a7eb50dd33be22b`; the historical `phase-5-postgres-verification` branch still exists. In the PR #25 branch, `docs/PHASE-5.md` explicitly labels its deployment sequence historical/superseded by Phase 6. PR #22 remains stacked on PR #21; PRs #21, #20, #18 and #14 remain open against older/non-mergeable bases. Do not duplicate their governance, retention, backup/restore or publication-race work.

### Vercel and runtime evidence

- Preview deployment [dpl_7nmjcXuWWYYbeKAjJ1b8HTJE8sgk](https://vercel.com/hired-flex1/hiredflex-platform/7nmjcXuWWYYbeKAjJ1b8HTJE8sgk) reports READY for the preceding head `02eea2b`. This is Preview build metadata, not authenticated browser acceptance. The 17 November documentation update was committed as `04b9a73957ecfaf9c4feaa2b6093dc2181d1f0e3`; its exact-head CI run `44031684003` was in progress and its Preview deployment `dpl_81R7snrk2nThncSAgxpaQgRVvGaQ` was BUILDING when checked.
- The latest Production deployment record [dpl_4tGdASYAtWv2zWnZjzg4fmaZaZLp](https://vercel.com/hired-flex1/hiredflex-platform/4tGdASYAtWv2zWnZjzg4fmaZaZLp) reports READY at unchanged main `aa8026e`. READY does not establish successful function startup or sign-in.
- A fresh names/types/targets-only environment inventory with decryption disabled confirms Production-scoped `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` entries, alongside `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL`. The managed `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` pair remains Preview-scoped. No values were decrypted or copied.
- The last-24-hour runtime-error aggregate returned **no error groups**. The seven-day aggregate still contains **21 Invalid Clerk publishable key** occurrences affecting 8 users (last seen 15 November 2026 07:34:08Z) and **12 Incomplete Clerk proxy configuration** occurrences affecting 9 users (last seen 15 November 2026 07:22:49Z). The absence of new errors in the shorter window is not proof of recovery or successful sign-in; no fresh HTTP request could be completed through the available reader.
- Project SSO protection remains enabled for `all_except_custom_domains`. Direct read-only web requests to the exact Preview and Production `/health/ready` endpoints were inaccessible. No share link, protection bypass, SSO change, Production configuration edit or deployment was attempted.

### Figma and product-governance boundaries

- The embedded Figma host surface was opened for the supplied file key, but required file-session creation rejected the `/make/` file as unsupported. The available skill registry returned no installed Figma guidance, and the direct web reader could not access the URL. **No frames, screens, interactions, variables or design tokens were rendered or inspected; no Figma edits were made.** Visual parity remains Unknown. The existing Phase 6 route/API map remains an application wiring map, not a verified Figma frame map.
- The saved Master Product Specification remains the product source of truth. Accepted prototype Stages 1–2 remain preserved and are distinct from engineering Phase 6. Draft 0.3 remains not effective and does not authorise candidate intake or automated deletion.
- Informational matching, independent vacancy search and the existing application lifecycle remain unchanged. Interviews, offers, CV uploads, notifications, billing and automated screening remain deferred.

**Release verdict: NO-GO.** The Production Clerk publishable key remains rejected by runtime validation despite the Production key entries being present. Live sign-in/session/sign-out and independent Candidate/Employer/Recruiter browser journeys remain unverified behind the protected Preview. Backup/restore, privacy/retention, mobile/accessibility and actual Figma comparison remain open. This evidence refresh does not authorise merging PR #25/#26, changing Production, bypassing SSO, provisioning paid resources or accepting real candidate data.

## Latest evidence refresh — 16 November 2026

This snapshot supersedes the 14 November observations below. It records a bounded synthetic startup-regression test and a read-only Production/Preview refresh. It does not authorise a merge, Production deployment, rollback, credential change, migration or live-data test.

### Source and automated verification

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. PR #25 remains open and unmerged on `fix/startup-identity-validation-2026-11-02`, based on unchanged main.
- Commit `21d901e7aa9a55d540a8b7e0510f426547946dd9` adds a synthetic malformed Clerk publishable-key case to the packaged-startup verifier. It requires the fixed `Invalid Clerk publishable key` diagnostic and confirms the synthetic secret marker is not echoed. This verifies fail-closed startup handling only; it does not validate or repair the real Production key.
- [GitHub Actions run 43816733057](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43816733057) **PASSED** for the exact commit. Node 24 `npm ci`, typecheck, build, packaged-startup verification, lint, format, **276 tests in 21 files**, and `npm run db:verify` all passed. The disposable PostgreSQL service was **18.7**. The verifier passed fresh migrations/rerun, normalization/constraints, rollback, forced submission/recruiter-review/withdrawal history-write rollback and retries, active-application uniqueness, reapplication history, vacancy locking, concurrent HTTP submissions, candidate/company isolation, closed-vacancy refusal, null legacy matching and the retained HTTP lifecycle.
- [Vercel Preview deployment dpl_BzLc4FsGRrQJoe3uEzuKkZ7fv2SS](https://vercel.com/hired-flex1/hiredflex-platform/BzLc4FsGRrQJoe3uEzuKkZ7fv2SS) reports READY for the exact commit. It is a Preview deployment, not Production acceptance. Project SSO protection remains enabled for non-custom domains; no protection setting was changed.
- `npm ci` reported **9 moderate severity vulnerabilities**. This run did not execute `npm audit` or identify affected package/advisory names; production-versus-development impact remains unclassified. No dependency or lockfile change was made.

### Current Production configuration and runtime evidence

- Names/types/targets-only Vercel inventory with decryption disabled now shows Production entries for `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (both Sensitive; created at 2026-11-15 07:29:25Z and 07:30:04Z respectively). Production also has `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL`. The managed `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` entries remain Preview-scoped. No values were decrypted or copied; `hiddenProductionEnvCount` is zero. Team-level shared variables are not enumerable through the available project connector.
- Canonical Production deployment `dpl_4tGdASYAtWv2zWnZjzg4fmaZaZLp` reports READY at unchanged main `aa8026e`. READY metadata is not application acceptance.
- The latest 24-hour Vercel runtime aggregate reports **21** `Invalid Clerk publishable key` occurrences affecting **8** users on `/`, first seen 2026-11-15 07:23:00Z and last seen 07:34:08Z on that Production deployment. One older `Incomplete Clerk proxy configuration` occurrence remains in the window. This shows the Production key entries exist but the deployed application rejects the publishable key format; it does not establish which credential characters or provider setting are wrong. Do not weaken validation or inspect/decrypt the values to guess a fix.
- A direct public `/health/ready` fetch through the available web reader was unavailable. No HTTP status is claimed. The observed runtime exception and READY provider metadata must not be described as a successful or repaired sign-in deployment.
- No Production environment variable, credential, provider setting, deployment, database or role was modified. No migration, rollback or live-data mutation was performed.

### Figma and governance boundaries

- The supplied Figma URL remains a Make file. Figma session creation explicitly rejects Make files; the available skill registry returned no installed guidance; the direct web reader could not access the URL. **Zero screens/frames/interactions/design tokens were inspected and zero Figma edits were made.** The Phase 6 route/API map remains comparison targets, not verified frame-to-route parity. Visual discrepancies remain Unknown.
- The saved Master Product Specification remains the product source of truth and records accepted prototype Stages 1–2; those stages were not rebuilt. The saved Candidate Data Retention Policy Draft 0.3 remains not effective, has no effective date and does not authorise real intake or automated deletion.
- Informational matching, independent vacancy search and the existing application lifecycle remain preserved. Interviews, offers, CV uploads, notifications, billing and automated screening remain deferred.

**Release verdict: NO-GO.** Production Clerk configuration remains invalid; protected live sign-in/session and independent Candidate/Employer/Recruiter browser journeys remain unverified; backup/restore, privacy/retention, mobile/accessibility and actual Figma comparison remain open. Do not merge PR #25/#26 or promote Production on the strength of this CI/Preview result.

## Latest evidence refresh — 14 November 2026

This dated snapshot supersedes the 11 November observations above. It is a read-only evidence refresh plus the exact-head CI result; it does not authorise a merge, deployment, rollback, credential change or live-data test.

### Source and automated verification

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. PR #25 remains open and unmerged. The verified code baseline below was `c83bf2cbf379979a7599823dde24c25e0a80e07b`; later commits on the same PR branch are documentation-only release-evidence updates, still based on unchanged main. The current PR head must be read from live GitHub metadata rather than inferred from this historical code baseline. The branch includes the startup-order correction and the Phase 5 historical-sequence label.
- [GitHub Actions run 43377719765](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43377719765), job `131728009776`, **PASSED** for the `c83bf2c` code baseline on 13 November. It completed `npm ci`, typecheck, build, packaged-startup verification, lint, format, all **276 tests in 21 files**, and `npm run db:verify` against disposable PostgreSQL **18.7**. Subsequent documentation-only commits on the PR branch are not covered by this run; the current PR head requires its own CI result before merge. No passing result for a later documentation-only head is claimed here.
- The PostgreSQL gate recorded PASS for migrations/rerun, normalization and constraints, transaction rollback, forced HTTP history-write failure rollback for submission/recruiter review/withdrawal with clean retries, active-application uniqueness, reapplication history, vacancy locking, concurrent submissions, candidate/company isolation, closed-vacancy refusal, legacy-match handling and the retained HTTP lifecycle workflow. Expected synthetic constraint/trigger errors in the disposable database are part of those negative assertions, not a production incident.
- Vercel Preview `dpl_DaLdUngQdtpFJAU7x9HTGTD8xGAv` reports READY for the `c83bf2c` baseline. Subsequent documentation-only commits generated newer Preview deployments; at the time of this snapshot the latest branch deployment was queued/building, so exact-current-head Preview readiness is pending. A read-only `GET /health/ready` attempt against the earlier protected Preview was blocked with `401 deployment_authentication_required` after redirect. No protection bypass was attempted; Preview route-level acceptance is **BLOCKED**, not passed.
- PR #26 remains open at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`. Its exact-head [CI run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) passed 284 tests/21 files and disposable PostgreSQL 18.6 verification for synthetic signed onboarding, persisted Candidate separation, Candidate-only assignment, account suspension/role-removal denial, and separate Employer/Recruiter company and vacancy-assignment isolation. These are synthetic SQL/JWT checks, not live Clerk signup, browser cookies, sign-out or live-role acceptance.

### Current Production configuration and runtime evidence

- Canonical Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` reports READY at main `aa8026e`. Provider READY metadata is not application readiness.
- A names/types/targets-only project environment inventory with decryption disabled finds Production `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL`; no Production `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY`. The managed development publishable/secret pair remains Preview-only. `hiddenProductionEnvCount` is zero and there are no custom environments. Team-level shared variables are not enumerable through the available project connector, so their absence is not asserted.
- The seven-day Vercel runtime aggregate contains 11 `Incomplete Clerk proxy configuration` occurrences affecting 9 users, last seen `2026-11-13T23:08:18Z` on the canonical Production deployment. This confirms the live identity configuration remains incomplete.
- The only verified attached project domain returned is `hiredflex-platform.vercel.app`; no custom domain is attached. Public access/SSO policy and hosting-plan eligibility remain owner decisions or unverified provider facts.

### Design and governance boundaries

- The supplied Figma URL is a Make file. The Figma session-opening tool rejects Make files (it supports Design, FigJam, Slides and Figspec); no screen, frame, interaction or design token was rendered or inspected, and no design was changed. The Phase 6 route/API map remains a comparison target, not verified frame-to-route parity. Visual discrepancies remain **Unknown**.
- Saved Candidate Data Retention Policy Draft 0.3 remains not effective, with no effective date. It does not authorise real candidate intake, automated deletion or a legal-compliance claim.
- Prototype Stages 1–2, informational matching, independent vacancy search and the existing application lifecycle remain preserved. Interviews, offers, CV uploads, notifications, billing and automated screening remain deferred.

**Release verdict: NO-GO.** Production live Clerk keys, an approved recovery deployment, successful protected-preview route access, real browser sign-in/session and independent role acceptance, privacy/retention decisions, recovery/backup evidence, mobile/accessibility acceptance and actual Figma visual comparison remain open. Do not merge PR #25 or #26 into Production-linked main until the credential and release-approval gates are resolved.

# HiredFlex release gates — 25 October 2026

## Latest evidence refresh — 11 November 2026

[Detailed 11 November Production, CI, Figma and hosting evidence](PRODUCTION-INCIDENT-2026-11-02.md#evidence-refresh--11-november-2026) supersedes the earlier dated counts and configuration observations below.

- Main remains `aa8026e`; Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` reports READY, but direct public root/readiness requests were unavailable and live authentication is not accepted.
- Project-level Production has `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS`, and `DATABASE_URL`, but no live Clerk publishable/secret pair. Managed development keys remain Preview-only; `hiddenProductionEnvCount` is zero. Team-level shared variables cannot be enumerated by the available connector.
- PR #25 remains open; the latest completed CI before this 11 November documentation-only refresh was [run 42970540874](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42970540874) on code/docs head `b435bcc`. It passed 276 tests/21 files, all Node 24 quality/startup checks and disposable PostgreSQL 18 verification. Its READY Preview is historical for `b435bcc`; the final documentation-only head requires its own CI and Preview result. PR #26 is open at `3ac6c64`; [CI 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) passed 284 tests/21 files and the synthetic signed-onboarding and persisted role-isolation checks.
- Vercel's latest runtime-error aggregate records one incomplete-proxy error/one user in 24 hours and 26 errors/18 users in seven days, last seen 10 November at 08:09:58 UTC. This is not proof of recovery. SSO protection remains enabled for all non-custom domains; only Vercel-managed domains are attached and no custom domain is present.
- The Vercel team plan is not exposed by project metadata. If the account is on Hobby, Vercel's terms restrict it to personal/non-commercial use; confirm plan eligibility or an approved host before a commercial pilot. No upgrade or purchase was made.
- Figma Make inspection remains blocked: embedded thread opened, but no rendered screens or interactions were returned and no designs changed. Saved Draft 0.3 remains not effective and does not authorise intake or automated deletion.

**Release verdict: NO-GO.** Keep candidate intake paused pending secure Production Clerk configuration, owner-approved public-access/domain and hosting-plan decisions, separately approved recovery deployment, live browser/session/role acceptance, and remaining privacy/recovery/mobile/accessibility/design gates. No Production merge/deploy/rollback or migration is authorised by this evidence refresh.

## Historical evidence refresh — 10 November 2026

[Detailed 10 November incident and configuration evidence](PRODUCTION-INCIDENT-2026-11-02.md#evidence-refresh--10-november-2026) supersedes earlier dated counts and deployment observations.

- Main is `aa8026e`. PR #25 is open at `dbfafa0`; [CI 42574037573](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42574037573) passed 276 tests/21 files and all Node 24 quality/startup/PostgreSQL 18 gates. Its exact-head Preview `dpl_8h2mEhqWyadBJiGxnkZ7iA2FwLbg` is READY. PR #26 is open at `3ac6c64`; [CI 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) passed 284 tests/21 files and all quality/startup/PostgreSQL 18 gates, including synthetic onboarding and persisted Candidate/Employer/Recruiter isolation.
- Main still contains the startup-order defect in `src/app.ts` and `src/server.ts`: database-client construction occurs before identity configuration is validated. PR #25 moves identity validation before database-client construction and preserves fail-closed behaviour; it remains unmerged.
- Production still lacks the Clerk live-key pair. The seven-day runtime aggregate has 29 incomplete-proxy errors affecting 21 users, last observed 8 November; the 24-hour aggregate has no clusters, which is not proof of recovery.
- Vercel project SSO protection is enabled for all non-custom domains; only Vercel-managed default domains are attached and no custom domain is present. Confirm the intended public-access/domain policy before launch. No protection bypass, share link or domain/configuration change was made.
- Figma Make inspection remains blocked: embedded thread opened, but session creation rejects Make; no actual screens or interactions were inspected and no designs changed. Phase 6 preserves the exact limitation and existing flow/API mapping.
- Production deployment metadata READY and Preview build READY do not establish public HTTP reachability or live authentication. No Production merge/deploy/rollback or migration is authorised by this evidence refresh.

**Release verdict: NO-GO.** Keep candidate intake paused pending secure Production Clerk configuration, owner-approved public-access/domain decision, separately approved recovery deployment, real browser session/role acceptance, and remaining privacy/recovery/mobile/accessibility/design gates.

## Latest evidence refresh — 9 November 2026

[Detailed read-only incident evidence](PRODUCTION-INCIDENT-2026-11-02.md#evidence-refresh--9-november-2026) records the current source, environment scopes, Preview build metadata and verification limits.

- Main remains `aa8026e`; canonical Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` reports READY, but no live authentication acceptance is established.
- Production still lacks `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`. The managed development key pair remains Preview-only. Hidden Production environment count is zero; custom environments are empty. Team-level shared variables cannot be enumerated by the available connector.
- PR #25 is open at `d7870e0`; [CI run 42573738602](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42573738602) passed 276 tests/21 files and every quality, startup and PostgreSQL gate. The latest READY Vercel Preview is from `4d0611e`, one documentation-only whitespace commit behind the current head; no exact-head Preview record was listed at this check.
- PR #26 is open at `3ac6c64`; [CI run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) passed 284 tests/21 files and every quality, startup and PostgreSQL gate, including synthetic onboarding and company/assignment isolation. Its exact-head Preview deployment is READY.
- Preview build readiness is not HTTP route acceptance: direct browser reads of Preview root/readiness were unavailable. The rolling seven-day Production error aggregate still reports 59 incomplete-proxy errors/32 users, last seen 8 November; the 24-hour error aggregate returned no clusters but does not establish recovery.
- The supplied Figma Make file remains unrenderable through the available inspection endpoints; no actual screens or designs were changed.

**Release verdict remains NO-GO.** Secure entry of the matching intended-Production Clerk key pair, verification of exact Production scopes, a separately approved recovery deployment, and real browser sign-in/session plus independent Candidate/Employer/Recruiter acceptance are still required. Do not merge or deploy based solely on these CI/Preview results.

## Latest evidence refresh — 8 November 2026

[Production incident record and dated evidence](PRODUCTION-INCIDENT-2026-11-02.md) now includes an 8 November refresh. Vercel's seven-day aggregate reports 79 occurrences affecting 39 users of `Incomplete Clerk proxy configuration`, last seen 8 November 2026 at 00:13:50 UTC on the current Production deployment. The 30-minute runtime-log query returned no records, but the available Hobby log retention is one hour; this is not evidence of recovery. Direct public endpoint reads were unavailable today, so the latest direct HTTP evidence remains the 6 November HTTP 500 report for the homepage and readiness endpoint.

Names/types/targets-only project environment inspection, with decryption disabled, finds Production `CLERK_PROXY_URL` and `AUTH_ALLOWED_ORIGINS` set to the expected Vercel origin/proxy path, Production Neon/database variable names present, and no Production Clerk publishable or secret key. Vercel reports `hiddenProductionEnvCount: 0`. The managed development keys remain Preview-only; custom environments are empty. The only verified project domain is `hiredflex-platform.vercel.app`. The available connector cannot list team-level shared variables, so an unattached shared variable cannot be ruled out by this project-level inventory.

PR #25 remains open and unmerged; its startup-order correction has prior passing CI at head `0dbcc9c` (276 tests and PostgreSQL 18 verification), while its current documentation-only evidence refresh requires its own fresh CI result. PR #26 remains open and unmerged at head `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`; [CI run 42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) passed 284 tests and disposable PostgreSQL 18 signed-onboarding and role-isolation checks. These are automated/synthetic results, not live Clerk sign-in, browser session handling or independent live-role acceptance. Do not merge, deploy or roll back until the Production credentials are securely entered and the exact recovery release is separately approved.

Release remains blocked. This review preserves the approved Phase 3/4 lifecycle and Phase 5/6 scope. Interviews, offers, uploads, messaging, billing and automated screening remain outside this release.

## Current Production incident — 2 November 2026

[Current incident evidence and guarded recovery choices](PRODUCTION-INCIDENT-2026-11-02.md) supersede the earlier readiness-200 and open-PR snapshots. Main is `aa8026e`; PRs #17/#19/#23/#24 are reported merged outside this run. Canonical deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` is READY but root and protected requests return HTTP 500. Runtime logs confirm Incomplete Clerk proxy configuration: Production proxy is configured while the live-key pair is absent. Do not infer a database failure, rerun migrations, mark Production accepted, merge another PR or deploy/rollback without the required approval. Secure credential entry and a separately approved recovery deployment remain blocking.

The bounded code follow-up validates identity before database-client construction and adds regression checks; it preserves fail-closed behaviour and does not restore the deployed site. Other release/privacy/design/provider gates remain open. Previous accepted Preview journeys are preserved as dated evidence, not reclassified as failed or rebuilt.

## Production authentication recovery — 28 October 2026

[Current provider/configuration audit and controlled activation plan](PRODUCTION-AUTH-RECOVERY-2026-10-28.md) supersedes historical missing-database conclusions below. Deployment dpl_FLMagkJ1A5yLG3EJjeuLH8JbLbaf at main cda8773 now returns readiness 200. The intended live Clerk instance remains incomplete and its provider-domain proxy is Unverified. This PR prepares opt-in Fastify proxy support; no configuration, secret, role, schema or production deployment was changed. CODEX-07 live role acceptance and launch requirements remain blocked. Public launch verdict: **NOT READY**.

## CODEX-03 production diagnostics — 28 October 2026

[Current diagnostic evidence and recovery sequence](CODEX-03-PRODUCTION-DIAGNOSTICS-2026-10-28.md) records production at main cda8773. The authenticated Vercel readiness fetch returned HTTP 500 and deployment-scoped logs show DATABASE_URL is required. Expected DATABASE_URL and AUTH_ALLOWED_ORIGINS remain Preview-only; prefixed Neon integration variables do not satisfy the runtime contract. No credentials, production settings, migrations or role grants were changed. Offline preflight and sanitised startup/readiness diagnostics are separate from production acceptance. Production database/Clerk/role acceptance remains BLOCKED or NOT TESTED, as detailed in that report. Older 302 observations and preview checks below remain dated evidence, not current production acceptance.

## Existing-task audit continuation — 25 October 2026

[Current scoped audit](AUDIT-2026-10-25.md) supersedes older pending-PR statements: PR #12 is merged at main `f9bbe39`, and Vercel reports deployment `dpl_EYyL44atn2gbDHvNsJ86xABJHP5g` READY. Fresh `/health/ready` access encountered Vercel Authentication (302); current production DB/auth acceptance remains unverified. No open PRs were returned before preparing this audit's policy-copy fix. Ready metadata does not close the remaining checks below.

The bounded fix reconciles the public Services/Support pages with the existing free-candidate-services rule. It changes no fees, eligibility, lifecycle, schema or third-party configuration. No provider registration, availability confirmation or real intake is inferred from owner approval or merged documents.

## GitHub merge and candidate-readiness follow-up — 25 October 2026

GitHub now confirms PR #1 merged to main at `2eb6661b15cbc31887b233250a7eb50dd33be22b`; PRs #8–11 are merged. Neo confirmed the actions and instructed continued bounded development. The old statements below that PR #1 remains open/main is unchanged are historical and superseded. The last development head `41ef602` passed CI run 40200173842; fresh feature revisions require their own checks.

Vercel metadata reports production deployment `dpl_B4frxhqpQzhT8Sks8Nt17qzbZY9V` READY at the new main SHA. An unauthenticated GET to its `/health/ready` encountered Vercel Authentication (HTTP 302), so this run has not verified production database readiness, live sign-in or candidate-data behavior. No protection was weakened, share link created, environment changed or migration run. A merged PR and Ready build do not establish every unchecked operational gate; do not claim registrations, provider configuration, team availability or legal-service terms without their actual evidence.

Next bounded application increment: `/#profile` reads the existing authenticated `/candidate/profile` and `/candidate/skills` endpoints. It shows saved account details, declared skills, an actionable empty state and a checklist that explicitly labels document verification Not checked. No invented score, document upload, verified-candidate badge, schema change or application eligibility threshold is introduced. Existing apply/search/matching and lifecycle behavior remains intact. Current feature tests and render evidence belong to its PR, not the older baseline checks below.

## Owner acceptance and menu follow-up — 25 October 2026

Neo reported that the guided new-candidate-account test succeeded and added skills were still present after signing back in. No email address, token, screenshot or candidate record was requested or inspected for that report. Do not infer that unmentioned isolation/duplicate-email checks passed.

Neo also reported that the open header Menu remained expanded when navigating to My workspace. This was reproduced in local Chromium against development head `2066e08`. The targeted fix closes the native disclosure on internal-link activation (including the current route) and at the start of route rendering, preserving native summary keyboard operation and route focus behavior. Completed prototype Stages 1–2 and all API/lifecycle behavior are unchanged.

Local Chromium verification of the fix covers mobile/desktop navigation outside the menu, menu links, same-route links, keyboard activation, browser Back and native toggling. This is public local UI evidence, not new live-provider or database verification. The owner-reported preview result predates this menu fix; fresh deployment evidence belongs to the fix PR.

## Expanded delivery mandate

The owner added six workstreams on 25 October 2026: application completion, domain/publishing, business-registration preparation, ThothFlex, partner development and gated TVET adoption. They are tracked in [THOTHOS-OPERATING-MANDATE.md](THOTHOS-OPERATING-MANDATE.md); domain tool results are in [DOMAIN-SHORTLIST.md](DOMAIN-SHORTLIST.md). This is additive scope for planned increments and preserves the current release boundaries and unchecked gates below. It does not mean Airtable, WhatsApp integration, CV tracking, ThothFlex, registration, outreach or the college pilot is complete.

## Current release checklist

This is the authoritative checklist after the live preview acceptance run on 25 October 2026. The dated sections below preserve earlier evidence and are historical snapshots.

- [x] CI quality gates: 205 tests, TypeScript, build, lint, format, packaged startup and disposable PostgreSQL 18 verification. [Run 40152052945](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/40152052945) passed for code/documentation head `00485d5`.
- [x] Live preview readiness and configured exact preview origin.
- [x] Actual preview database PostgreSQL 18.6, four migration-journal entries; server max_connections reports 112. This is not a capacity/load-test guarantee.
- [x] Existing-account Clerk sign-in, reload persistence and sign-out.
- [x] Candidate, company-scoped Employer and company-scoped Recruiter navigation and API access.
- [x] Employer creates a DRAFT and saves REQUIRED/PREFERRED structured requirements.
- [x] Recruiter assignment persists; DRAFT → OPEN publication locks the requirement-editing UI.
- [x] Published vacancy appears in candidate discovery.
- [x] Candidate skill addition and removal; the test-added skill was removed afterwards, restoring the original empty skill profile.
- [x] Live match display: one of two structured requirements gives 50%, with the matched Technical Support skill and deliberately missing Preview Missing Skill listed separately; informational wording remains visible.
- [x] Application submission creates Applied and initial history.
- [x] Active duplicate submission is rejected with the explanatory UI message.
- [x] Assigned recruiter transitions Applied → Reviewing → Shortlisted; candidate sees all history events.
- [x] Candidate withdrawal yields terminal Withdrawn and preserves history.
- [x] Reapplication creates a new application while preserving the withdrawn record.
- [x] Recruiter rejection yields terminal Rejected on the second test application.
- [x] OPEN → CLOSED removes the test vacancy from discovery. No test vacancy remains open.
- [x] Foreign-company vacancy access is hidden with HTTP 404, confirmed from Vercel request-completion logs.
- [x] Recruiter access to an unassigned vacancy is hidden with HTTP 404, confirmed from Vercel request-completion logs.
- [x] Owner-reported new candidate account test passed on 25 October: skills persisted after signing out and signing back in. This is owner-reported browser evidence, not an independently observed provider/database trace.
- [ ] Remaining identity checks: duplicate-email support behavior, explicit verified-primary-email evidence and cross-account visibility/independent Employer/Recruiter isolation.
- [ ] Complete browser edge cases: direct closed-vacancy submission, direct requirement-mutation rejection, and live empty/all-legacy match rendering. Automated CI covers relevant domain/API/database rules; UI-only locking is not proof of direct API rejection.
- [ ] Mobile viewport acceptance and full browser network/error audit.
- [ ] Rendered Figma comparison; the Make reference is not renderable by the available connector and was unavailable in the cloud browser.
- [ ] Production database, live Clerk setup/branding, exact production origin, migration verification and production acceptance. Main merge is now confirmed above; production identity/database configuration and runtime acceptance still need current evidence.
- [ ] Backup/restore ownership, tested restoration, capacity/connection-budget validation and chosen deployment/database regions.
- [x] Owner-approved interim support/privacy contact: neomarothi.nfm@gmail.com; published in the preview footer and privacy page.
- [ ] Owner approval and implementation of [candidate-data retention draft](RETENTION-POLICY-DRAFT.md), including legal scope, request handling and provider/backup deletion.
- [ ] Final review, merge and production release after the gates above pass.

## Welcome/employer follow-up (separate development branch)

The owner supplied 21 additional welcome/employer/footer screenshots on 25 October 2026. Their static visual references were inspected and mapped in [EMPLOYER-SCREEN-REVIEW.md](EMPLOYER-SCREEN-REVIEW.md). This increment adds public welcome/services/how-it-works/employer-access/support destinations, grouped footer/menu links and employer overview/vacancies/applicants/read-only pipeline/company/access views using existing APIs. No interview/offer/placement state or public company-role signup was added.

Local checks passed: 215 tests, typecheck, lint, build, startup and formatting. A local Chromium rendering check passed public routes/source filtering at 393px, the six employer tabs with explicit synthetic identity/API fixtures, and the welcome page at 1280px; it observed no page JavaScript errors or horizontal overflow. Skip-link keyboard focus/navigation was checked. This supersedes missing local screenshot-reference evidence for those visible states, not the remaining real-provider, independent-user, full accessibility, production or complete Figma fidelity gates. Fresh CI evidence must be attached to the reviewable PR before acceptance. No main merge, live migration or production release occurred.

## Live preview acceptance evidence

The labelled test vacancy followed DRAFT → OPEN → CLOSED. Its two test applications finished Withdrawn and Rejected; a read-only database query confirmed two applications and six status-history events. A second closed vacancy in the test company had no assigned recruiter, and a closed vacancy in a separate isolation-fixture company had no company membership granted to the test user. Both isolation requests returned 404. The SQL console was restored to read-only mode. All fixtures are explicitly marked PREVIEW TEST; no external recruitment communication or real hiring decision occurred.

The tests exercised the real Clerk session and persisted database through browser controls, not injected test principals. They used one identity holding the three approved roles, so independent-user/session isolation and fresh-account onboarding remain separate gates. Production settings/data were not changed.

## Source evidence

- [PR #1](https://github.com/Neo1999-bot/hiredflex-platform/pull/1) was open and unmerged at review; head `9135397dc56d7b9e922eabe98ade288cdffe561d`, base `ad8aab68918cca783c3ed4245930019c520d7b4c`.
- Its only discussion entry was the Vercel bot preview comment, last updated 6 October 2026. It reports Ready, not acceptance or production readiness. No human review approval or acceptance evidence was returned.
- [CI run 37466715604](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/37466715604), job `112279480297`, passed on 6 October. It checked GitHub's test merge `7ecc45334f6f53343e8287639ca2726561af7eed`. The logs record 205 tests and passing typecheck/build/lint/format, followed by PostgreSQL 18 migrations, rerun, normalization, constraints, rollback, active uniqueness, reapplication, vacancy locking and HTTP workflow verification.

That closes the previously unconfirmed PostgreSQL CI gate for that revision. New commits require fresh CI; old results do not certify changed dependencies or deployment configuration.

## Changes from this review

- Fixed `npm start`: TypeScript emits `dist/src/server.js`, but the script referenced nonexistent `dist/server.js`. Reproduced MODULE_NOT_FOUND before the fix.
- Added `npm run verify:startup` and made CI run it after build. It launches the actual packaged Node start arguments, checks liveness, the public HTML/CSS/JS and disabled-auth configuration, and checks forged credentials receive 401 on candidate/employer/recruiter endpoints. It uses a deliberately unreachable local database and empty identity configuration; it cannot contact production. It terminates its child server.
- Updated the lockfile with compatible dependency fixes using `npm audit fix`; the resulting audit reported zero known vulnerabilities. No dependency ranges or domain behavior changed.
- Added private Clerk/origin configuration pointers to `.env.example` and corrected the stale Phase 5 coverage statement.

Local checks: 205 tests, typecheck, build, lint, formatting and startup verification pass. The startup check is HTTP/process evidence, not browser or live identity evidence.

## Runtime follow-up after team consent

On 25 October 2026, Vercel team access succeeded. The latest Ready preview was deployment `dpl_BM72WsMSecG9sQRUTjBcJxMfsN1S`, built from code commit `5e3e183f1b47f0a9cf918c2202aae58f6bb6647d`, Fastify on Node.js 24, function region `iad1`.

- [CI run 40150157809](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/40150157809) completed successfully for that code revision, including 205 tests, all quality checks, packaged startup and PostgreSQL 18 db:verify. This closes the updated-code CI gate.
- The stable preview alias returned HTTP 200 for `/health/ready` with `status: ready`, `/site-config` with `authenticationEnabled: true`, and the root HTML.
- Environment metadata confirms DATABASE_URL and AUTH_ALLOWED_ORIGINS are Preview-only. AUTH_ALLOWED_ORIGINS equals the exact stable preview origin. Clerk publishable and secret variables target Preview and Production. Secret values were not retrieved.
- The served publishable key is a Clerk test key; the live sign-in dialog identifies the app as `clerk-canary-magnet` and Development mode. These observations do not establish a production identity setup.
- A normal browser session accessed the protected preview without a public share link. The homepage, vacancy search empty state, Clerk dialog, existing candidate workspace, skills empty state and applications empty state rendered. Successful sign-in was verified from the signed-in workspace, then verified again after a page reload. This confirms access to an existing mapped candidate; new-account registration/onboarding was not exercised.
- A direct browser request to `/employer/vacancies` without a bearer token returned the UNAUTHENTICATED error payload. This is not evidence of signed-in cross-company or wrong-role denial.
- Browser logs showed Clerk's development-key warning and browser-extension metadata errors. No application JavaScript failure was observed during the pages checked; this is not a complete network/error audit.
- Figma Make source links remain accessible through the connector, but its screenshot tool rejects Make files. The cloud browser returned Site Unavailable for the supplied Figma reference; visual comparison remains blocked in this browser.
- A share-link request was rejected by automatic approval review because such a link can expose the protected deployment to anyone holding it. Browser checks proceeded through normal authenticated access instead; no protection setting was weakened. No share link is included in project documentation.

## Earlier release-gate snapshot (superseded by current checklist)

| Gate                              | Current evidence/status                                                                                        | Next action                                                                                                                                                                          | Access needed                                                                                            |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Preview configuration             | Access verified; preview DB/origin keys exist; readiness passes                                                | Confirm the migration journal, DB version, connection limits and backup ownership with database read access                                                                          | Database/operator access; Vercel team consent is complete                                                |
| Clerk identity                    | Existing candidate sign-in and reload persistence passed in development mode                                   | Test new verified-email registration/onboarding, duplicate-account handling and sign-out; confirm intended Clerk application branding and separate production instance configuration | User completes account/email/MFA challenges; operator handles provider configuration                     |
| Company permissions and lifecycle | CI HTTP workflow passed with script-only test principals; live preview has no open vacancies                   | Use approved preview employer/recruiter accounts to test publishing, assignment, application/review transitions and company isolation                                                | Approved company-role test accounts; do not self-promote the candidate account                           |
| Browser acceptance                | Desktop homepage, search empty state, sign-in, candidate workspace, skills and application empty states passed | Complete populated workflows, mutation/error cases, sign-out and mobile viewport acceptance                                                                                          | Usable browser is now available; real account challenges still need the user                             |
| Figma comparison                  | Connector cannot render Make; browser reference returns Site Unavailable                                       | Obtain a rendered reference/export or accessible prototype and compare existing screens                                                                                              | Accessible rendered Figma reference; no redesign authorized                                              |
| Production configuration          | DATABASE_URL and AUTH_ALLOWED_ORIGINS have no Production target; deployed preview uses test Clerk identity     | Provision/identify separate production DB and live identity; set exact production origin; verify migrations, region, connection limits and backups                                   | Owner/provider choices and production resource access; never copy preview DB credentials into Production |
| Privacy/support details           | Existing page has no confirmed retention period or dedicated support contact                                   | Owner supplies retention and support contact; implement approved wording before real candidate invitations                                                                           | User/business owner decision                                                                             |
| Merge/release                     | PR remains open; production acceptance incomplete                                                              | Review diff and current CI, then complete remaining release gates before launch                                                                                                      | Maintainer/release decision                                                                              |

## Acceptance sequence after access

1. Use a separate preview database. Confirm readiness and expected migration journal without running destructive verification against the application database. `db:verify` requires its own dedicated test server account.
2. Sign up with a verified primary email; explicitly onboard; reload and confirm the same identity/profile persists. Sign out; protected endpoints must deny access. A candidate cannot grant themselves Employer/Recruiter through payloads or token metadata.
3. An approved employer creates a DRAFT, adds structured REQUIRED/PREFERRED requirements, assigns an approved recruiter, then opens it. Requirements must lock after opening; foreign-company access must fail.
4. A candidate adds skills, inspects matched/missing/not-evaluated explanations, applies and sees initial history. An active duplicate must return conflict. Check empty and all-legacy comparisons retain null percentage.
5. The assigned recruiter reviews and shortlists/rejects; an unassigned recruiter must be denied. The candidate tracks history, withdraws and reapplies where permitted. Closing the vacancy prevents new submissions.
6. Repeat the existing screens on desktop/mobile; check navigation, validation, error/empty states, sign-in transitions and console/network failures. Compare those screens with Figma. Record URL, commit, date, account roles and outcomes without credentials or personal candidate data.

Additional integration coverage can be added within existing boundaries for history-write failure rollback and both requirement/open race orderings. Existing smoke coverage must not be described as proving those cases.

## Concurrent HTTP submission check — 25 October 2026

`scripts/verify-postgres.ts` now starts two candidate application requests together against the disposable PostgreSQL 18 database. It requires exactly one HTTP 201 and one HTTP 409 with `ACTIVE_APPLICATION_EXISTS`, then queries persisted records to require one application in Applied and one initial history event attributed to the candidate user. The existing sequential duplicate rejection and subsequent review/shortlist/withdraw/reapply workflow remain covered.

This checks overlapping injected HTTP requests and their database outcome, not browser double-click behavior, live Clerk sessions or production load. Scheduling is not forced at a particular SQL statement, so it does not guarantee both requests passed the pre-insert check before either insert. It uses synthetic data and the script-only principal resolver in a randomly named database; it does not touch preview or production records. Fresh CI evidence is required for this change before treating the new check as passed.

## Preview company-role provisioning — 25 October 2026

A direct read-only audit of hiredflex-preview found one active mapped candidate user and no company, employer, recruiter or company-role records. After the owner explicitly approved using the existing account for both roles, an isolated HiredFlex Preview Test Company was created and company-scoped Employer and Recruiter roles were provisioned atomically, with employer/recruiter records. The existing Candidate assignment was preserved; no global company role or administrator permission was granted. The SQL console was restored to read-only mode.

A post-write query returned exactly Candidate (global), Employer (test company), and Recruiter (test company). Live sign-in then displayed both workspace tabs. Employer opened successfully with the test company selected in the vacancy form; Recruiter opened successfully with the expected no-assigned-vacancies state. Candidate sign-out was also verified before switching sessions.

This supersedes the missing-company-role prerequisite above for single-account preview testing. Populated lifecycle acceptance, new-account onboarding, mobile/Figma comparison and production gates remain open. Because both company roles share one test identity, these checks do not prove separation between independent employer/recruiter users or cross-company isolation. Production data and configuration were not modified.

## Interim contact and retention draft — 25 October 2026

The owner confirmed there is no owned HiredFlex domain yet and approved neomarothi.nfm@gmail.com as the interim public support/privacy contact. It is defined once in src/web/contact.ts and used by the footer and privacy page. A domain mailbox can replace it after delivery and access are verified; a domain purchase alone does not provide email hosting.

[RETENTION-POLICY-DRAFT.md](RETENTION-POLICY-DRAFT.md) proposes an owner-review schedule with distinct operational, test, register, log and backup categories. It accounts for the Employment Services Act section 16 minimum three-year retention for covered private-employment-agency register records, subject to confirming applicability and trigger. It is not an effective policy, does not activate purges, and does not close the retention implementation gate. No existing record is deleted by this change. All proposed operational periods require owner approval and legal-scope validation.

## Intake/privacy scope update — 25 October 2026

Owner confirms formal WhatsApp and Google Forms intake has not started. Existing WhatsApp vacancy group of 300+ is owner-reported community context, not a consented intake database. Airtable schema evidence does not establish populated candidate records. Google Forms is deferred; a manual private WhatsApp pilot is prepared in WHATSAPP-INTAKE-PLAN.md, with no activation or external messages.

RETENTION-POLICY-DRAFT.md v0.2 adds conditional operational rows and provider, minimisation, access, consent-version, Information Officer registration and incident-response requirements. The schedule is not effective and no deletion runs. Before real intake, approve the actual notice/scope, register the appropriate officer, confirm operators/providers, complete the synthetic QA/delivery and privacy checks, and resolve applicable candidate-fee/service boundaries as recorded in REGISTRATION-PREPARATION.md. These documentation additions do not tick implementation or production gates and do not expand the platform's accepted stages.

## Latest evidence refresh — 12 November 2026

This dated refresh supersedes only the older counts and observations it explicitly updates. It does not authorise a merge, deployment, rollback, production configuration change or candidate intake.

- **Main / Production:** main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. Canonical Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` reports READY at that SHA. READY is deployment metadata, not successful application startup or live authentication acceptance.
- **Production environment inventory:** a fresh Vercel project-level names/types/targets read used `decrypt=false`. Production has `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL`; it has no `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY`. The managed development publishable/secret pair remains Preview-only. `hiddenProductionEnvCount` is zero. The connector cannot enumerate team-level shared variables, so an unattached shared variable cannot be ruled out.
- **Runtime errors:** the latest 24-hour aggregate returned no runtime errors. The seven-day aggregate returned 14 `Incomplete Clerk proxy configuration` occurrences affecting 13 users on `/`, last seen 10 November 2026 at 08:09:58 UTC. A zero 24-hour count does not establish recovery while the Production key pair is absent.
- **PR #25:** open, unmerged, based on main `aa8026e`, head `db71b91c2a74b2d63ace680eb27347305ad562db`, mergeable at this check. Exact-head CI [42971413050](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42971413050) passed 276 tests/21 files, all Node 24 quality/startup steps and disposable PostgreSQL 18 verification. Exact-head Preview `dpl_HMJsqqTxrvR5rJU5rG7s3vvgBu9B` reports READY; it is a Preview deployment, not Production acceptance.
- **PR #26:** open, unmerged, based on main `aa8026e`, head `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`, mergeable at this check. CI [42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357) passed 284 tests/21 files and the synthetic signed-onboarding, persisted account/role denial, Employer/Recruiter company-assignment isolation and PostgreSQL 18 lifecycle checks. It does not prove live Clerk browser sessions.
- **Other open PRs:** #14, #18, #20 and #21 remain non-mergeable against older bases. #22 is stacked on #21 and mergeable against that branch only. PR #1 is closed/merged. The historical `phase-5-postgres-verification` branch remains present.
- **Access / domain:** Vercel SSO protection is enabled for `all_except_custom_domains`; the attached domains are Vercel-managed `.vercel.app` aliases and no custom domain is attached. The project connector does not expose the current team subscription plan. If the account is Hobby, commercial-use eligibility must be resolved before a commercial pilot; no upgrade or purchase was made.
- **Direct HTTP / Figma:** direct read-only web inspection of the Preview health endpoints and Production readiness endpoint was unavailable, so no new HTTP status is claimed. The Figma Make embedded view opened but session creation rejected the Make file; no frames or screens were rendered and no design changes were made.
- **Privacy:** saved Candidate Data Retention Policy Draft 0.3 remains not effective, with no effective date and unresolved responsible-party/legal-scope questions. It does not authorise intake or automated deletion.

**Release verdict: NO-GO.** Secure entry and scope verification of the matching Production Clerk key pair, an owner-approved public-access/domain and hosting-plan decision, separate exact release approval, live sign-up/sign-in/session/sign-out and independent Candidate/Employer/Recruiter browser acceptance, plus privacy/recovery/mobile/accessibility/design gates remain outstanding.

## Exact-head follow-up — 12 November 2026, 09:06 SAST

This follow-up supersedes the PR #25 head, CI and Preview values in the earlier 12 November refresh; it does not authorise merge, Production deployment, rollback or configuration changes.

- **Main / Production:** main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`; Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` reports READY at that SHA. READY remains deployment metadata, not application or identity acceptance.
- **PR #25:** open/unmerged, base main `aa8026e`, current head `b7299194a54da4526f6d7e31891f7654cd7c0604`. Exact-head CI [43172216302](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43172216302), job `131027953012`, passed 276 tests/21 files, Node 24 install/typecheck/build/packaged startup/lint/format and disposable PostgreSQL 18 verification. The CI log explicitly records the incomplete-proxy startup rejection and the existing history rollback/concurrency/isolation/lifecycle checks. Exact-head Preview `dpl_B4HeHicvVwJxWE6iPSvyGGqrGBp5` is READY; it is not Production.
- **PR #26:** open/unmerged at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`; CI [42173260357](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/42173260357), job `127745773095`, passed 284 tests/21 files, signed synthetic onboarding/account/role denial, Employer/Recruiter company-and-assignment isolation and PostgreSQL 18 verification.
- **Production environment:** project-level inventory remains names/types/targets-only with decryption disabled. Production contains `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL`, but no `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY`; the managed development key pair remains Preview-only. Hidden Production variable count is zero; team-level shared variables cannot be enumerated by this connector.
- **Runtime:** the latest 24-hour aggregate returned no errors. The seven-day aggregate reports 14 incomplete Clerk proxy errors affecting 13 users on `/`, last seen 10 November 2026 at 08:09:58 UTC. This is not proof of recovery while the live-key pair is absent.
- **Access / HTTP:** SSO remains enabled for `all_except_custom_domains`; only Vercel-managed `.vercel.app` aliases are attached and no custom domain is attached. Direct read-only browser requests to Production and the Preview were unavailable through the inspection path, so no fresh HTTP status is claimed. The team's subscription plan is not exposed by project metadata.
- **Figma / privacy:** the 12 November Make session attempt was rejected as unsupported; zero rendered screens or design changes. Draft 0.3 remains not effective and does not authorise intake or automated deletion.

**Release verdict remains NO-GO.** Secure Production Clerk configuration, an owner-approved public-access/domain and hosting-plan decision, separate exact release approval, live browser/session/independent-role acceptance, and remaining privacy/recovery/mobile/accessibility/design gates remain outstanding.

## Documentation verification follow-up — 12 November 2026

The code-bearing PR #25 revision `b7299194a54da4526f6d7e31891f7654cd7c0604` passed exact-head CI [43172216302](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43172216302). The subsequent documentation-only evidence commit `2a55c6baaddac4f2f40b43d1b491432eaab64b7e` has a failed first exact-head CI [43173891200](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43173891200): install, typecheck, build, startup and lint passed; Prettier failed on the four changed Markdown files; tests and PostgreSQL verification were skipped. Its Preview `dpl_7n3v6LC484zLxezQmyroKm4AV7FS` is READY but not accepted while CI is red. The corrective documentation revision requires a fresh exact-head CI and Preview result. The earlier code-bearing CI pass is not inherited by later commits.

## 15 November 2026 — release evidence refresh

Date: 15 November 2026, Africa/Johannesburg. Read-only operational inspection and exact-head verification; no Production configuration, access, deployment or data changes.

### Repository and automated verification

- Main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. PR #25 remains open/unmerged against main at `e57212752a61835c7f08d79946b7b06b2fdee03d`; no submitted reviews or inline review threads were returned. PR #26 remains open/unmerged at `3ac6c64738f828a8bc884989f970bf8e1a2a8ae0`; no submitted reviews or inline review threads were returned.
- Exact-head CI [43688809530](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43688809530), job `132734860973`, completed successfully on 15 November. Inspected job steps show npm ci, typecheck, build, packaged startup, lint, formatting, tests and `db:verify` all completed successfully. Logs confirm 276 tests across 21 files and PostgreSQL 18.7 disposable verification, including migration/rerun, rollback and forced history-write failure retries, active-application uniqueness, reapplication, vacancy locking, concurrent HTTP submissions, candidate/company isolation and the HTTP application lifecycle.
- The exact-head `npm ci` step reported 9 moderate severity vulnerabilities. The captured log does not include package names or advisory IDs, so production-versus-development impact is unclassified. No `npm audit fix`, dependency upgrade or lockfile change was run. Obtain full `npm audit` and `npm audit --omit=dev` details and triage relevant advisories before public release.
- PR #1 is closed and merged; its former branch `phase-5-postgres-verification` remains present. Current `docs/PHASE-5.md` labels Phase 5 as historical and superseded by Phase 6; its original deployment sequence is not missing application work to rebuild.

### Vercel deployment and access

- Git-linked project context resolves project `prj_kZwS13HgD8tAXU7citzCrthoc5T0` in team `team_K4IUE7hquq2RICHJfIditXPS`; the team plan is reported as **Hobby**. Project SSO protection is enabled for `all_except_custom_domains`. The attached hostnames are Vercel-managed aliases; no custom domain is attached.
- Exact-head Preview `dpl_4qkMPuMBpSsvj24JaYtpEmQdecU9` reports READY for commit `e572127`. This is deployment metadata only. The direct URL inspection path could not retrieve the protected Preview endpoints. No Vercel share link, protection bypass or SSO setting change was used.
- Canonical Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` still reports READY at main `aa8026e`; READY does not establish application startup or sign-in.
- A fresh project-level environment inventory used `decrypt=false`. Production has `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL`; it has no `CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY`. The managed development `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` entries remain Preview-only. `hiddenProductionEnvCount` is zero; project-level inventory does not enumerate team-level shared variables. No values were decrypted.
- Fresh Production runtime-error aggregates show 5 `Incomplete Clerk proxy configuration` occurrences affecting 4 users in the last 24 hours and 11 occurrences affecting 8 users in the last 7 days, on `/`. Last observed: 15 November 2026 at 04:52:01 UTC (06:52:01 SAST). The stack reaches `readIdentityConfig` in main `src/app.ts`. PR #25 validates identity configuration before constructing the database client in both server entrypoints; this prevents premature DB initialization but does not supply the missing live Clerk keys.

### Figma and browser acceptance

- The supplied HiredFlex Figma Make file opened in the embedded Figma view. Required file-session creation rejected the `/make/` file as unsupported; the available Design metadata/screenshot/context APIs do not support Make files. No frames, screens, interactions, variables or assets were rendered; no Figma content was changed. Visual parity and design discrepancies remain **Unknown**. The Phase 6 route/API map remains an application wiring map, not a verified Figma frame map.
- Vercel SSO prevents direct protected Preview inspection through the available path. Creating a share link would bypass the configured protection and was not attempted. Live sign-in, session persistence/sign-out and independent Candidate/Employer/Recruiter browser journeys remain **NOT VERIFIED**.

**Release verdict: NO-GO.** Secure matching live Clerk key configuration, approved access for protected Preview acceptance, live role/session verification, and remaining backup/recovery, privacy, mobile/accessibility and Figma gates remain outstanding. This evidence update does not authorise merge, Production deployment/rollback, environment changes, a paid upgrade or candidate intake.

## 15 November 2026 — Production Clerk key-format follow-up

Read-only Vercel inventory and runtime-log refresh. This records observed configuration metadata and errors only; no key values were decrypted and no Production settings or deployments were changed by this run.

- **Current repository / PR:** main remains `aa8026e87c7537bcfb3a760f37cdf8f96132c0e9`. PR #25 remains open and unmerged. The latest fully CI-verified revision at this snapshot is `f0517df53c4df120a16fb2fb0f262de104ed89d2` (51 commits ahead of main, none behind). Exact-head GitHub Actions [43690349324](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/43690349324), job `132739490291`, passed npm ci, TypeScript, build, packaged startup, lint, Prettier, 276 tests across 21 files, and disposable PostgreSQL 18.7 verification. Exact-head Preview `dpl_4Mt8T8cJJAvJPUJJPfaPcXKEkSYy` reports READY for `f0517df`; this is Preview metadata, not live role acceptance. The branch subsequently advanced with documentation-only snapshot commit `79c71fc`; that revision's own CI was pending when this note was prepared.
- **Production variable scope changed since the earlier snapshot:** project-level inventory with decryption disabled now lists both `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in Production scope, alongside the existing `CLERK_PROXY_URL`, `AUTH_ALLOWED_ORIGINS` and `DATABASE_URL`. The managed `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` remains Preview-only. Values were not decrypted or copied. The earlier statement that the Production live-key pair was absent is superseded by this inventory.
- **Latest Production deployment:** `dpl_AqJ6aJkw3FFSB9NV7RihXmVWtNkY` reports READY, target Production, source redeploy, still built from main `aa8026e`. Runtime logs for this deployment show `Invalid Clerk publishable key` on `/`, `/auth/session` and `/health/ready`; the latest observed occurrence is `2026-11-15T07:24:39.884Z`. The aggregate records 6 occurrences affecting 5 users. The older Production deployment `dpl_HdBbCx6b1k41dLHPdYrXGb1UYomm` separately retains 12 `Incomplete Clerk proxy configuration` occurrences affecting 9 users, last observed `2026-11-15T07:22:51.601Z`. READY metadata does not establish runtime readiness.
- **Code-level diagnosis:** main `src/auth/identity.ts` rejects a publishable key at the format check `^pk_(test|live)_[A-Za-z0-9+/=]+$` before decoding its domain or validating the proxy. If that check passes, the configured proxy additionally requires a live publishable key, a matching live secret-key prefix, and a decoded Clerk domain equal to `clerk.<proxy-host>`. The currently configured proxy host is `hiredflex-platform.vercel.app`, so the code expects `clerk.hiredflex-platform.vercel.app`. This is evidence of an invalid Production publishable-key value/format, not evidence that the application role logic should be relaxed. PR #25's startup-order correction does not repair an invalid key and is not merged into main.
- **Preview access:** SSO remains enabled for `all_except_custom_domains`; direct read-only web inspection of the exact Preview and Production URLs was unavailable. No temporary Vercel share link, protection bypass or SSO change was used.
- **Dependency audit:** exact-head `npm ci` reports 9 moderate vulnerabilities, but the workflow log contains no package/advisory detail. This run did not execute `npm audit`: the available container has Node 22 rather than the project's required Node 24 and cannot resolve `registry.npmjs.org`. No dependency or lockfile changes were made.
- **Hosting plan:** current project/team metadata did not return a plan value; commercial eligibility remains unverified rather than inferred.

**Release verdict remains NO-GO.** The Production publishable key must be corrected securely and checked against the matching live secret key and configured proxy host. Any further Production redeploy requires a separate explicit owner approval. Live sign-in/session/sign-out, independent Candidate/Employer/Recruiter browser acceptance, backup/restore, privacy, mobile/accessibility and Figma visual acceptance remain open.
