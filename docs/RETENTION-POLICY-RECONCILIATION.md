# Retention source and release-evidence reconciliation

Prepared: 31 October 2026. Known: documentation reconciliation only. No policy activation, provider change, data access, deletion or intake.

## Source identity and authority

- Main baseline: `cda87732c0dac470ee2ee0856df0815ab63cfff0`. Its policy file is Draft 0.2, dated 25 October; its separate 28 October approval record names Draft 0.3.
- Saved source read in full on 31 October: `HiredFlex_Candidate_Data_Retention_Policy_Draft_0.3.md`, Library ID `libfile_a5763f24133c8191bbad7744df86a047`, version `1`, 106 returned text lines, modified `2026-10-27T22:59:10.934687Z`. The document says prepared 28 October. Preserve both dates rather than silently treating the preparation label as the storage timestamp.
- [Source snapshot](retention/DRAFT-0.3-SOURCE.txt): exact returned text, UTF-8 with one final newline; SHA-256 `16a4a6cf39bb479d47a7ab573b99d2de93c124d3fdbec40ccdcbbc63c1ee6da1`. This hashes the retrieved text representation, not independently downloaded original file bytes. Do not format or silently revise the snapshot.
- [Owner decision](RETENTION-GOVERNANCE-APPROVAL-2026-10-28.md): Draft 0.3 governance approval is recorded, conditional on legal verification. No effective date, real intake, automatic deletion or manual bulk purge is authorised. Do not ask for that same governance approval again.
- The source header and approval footer still say approval requested/PENDING. Those are stale relative to the separate owner decision. They remain verbatim in the snapshot. Today's text cannot prove the exact bytes reviewed historically; no retroactive revision approval is claimed.

## Draft comparison for implementation

| Topic                 | Draft 0.2                                                             | Saved Draft 0.3                                                                                              | Engineering consequence                                                                                                 |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Application clock     | 12 months after later vacancy closure/terminal date                   | Same clock; explicitly sends missing events to manual review                                                 | Missing either date blocks eligibility; unrelated login cannot restart this clock                                       |
| Meaningful activity   | Inactivity concept without an operational definition                  | Requires definition and captured timestamps; excludes passive events/automatic notifications                 | Future calculator cannot invent a last-active timestamp or mark a missing trigger eligible                              |
| Register scope        | Work-seeker/placement register; trigger needs confirmation            | Explicitly includes covered employer register; applicability and trigger still require verification          | Retain only justified register subset; no universal three-year purge rule                                               |
| CV and intake records | Conditional operational rows, no live intake evidence                 | Separates source/draft/QA copies from minimal request metadata; keeps WhatsApp/Google activation conditional | No upload/intake expansion; apply only to actually modeled records                                                      |
| Rights and holds      | Reviewed disposal, holds and provider dependencies                    | Numbered request/dry-run/approval workflow; minimal evidence and restore-marker replay                       | No mutation by default; withdrawal is distinct from erasure; future restore suppression must be separately built/tested |
| Access and providers  | Provider-specific dated notes                                         | Data-map/access obligations with settings still unverified                                                   | Preserve useful dated provider notes as historical evidence; do not turn them into current configuration claims         |
| Schedule              | Proposed 30/90-day, 12/24-month and provider-dependent 35-day periods | Broad proposals retained, no effective date                                                                  | Review point is not permission to delete; no timer or public promise activated                                          |

This is an engineering comparison of supplied drafts, not fresh verification of law or provider terms. Legal statements and periods in either source remain subject to the recorded legal-review gate.

## Recovery inventory checked today

Read-only Vercel storage metadata identifies `hiredflex-production`, store `store_yQn0y4sYgAeIRuXs`, external Neon project `red-shape-33884608`, region `iad1`, status available/ready, and a Production-only connection to HiredFlex. It reports an owned resource under the HiredFlex team and Free plan metadata. No credentials were retrieved. Team ownership is not evidence of a named restore operator or a recovery procedure.

Unknown: actual managed recovery window, earliest restorable point, recovery operator/delegate, provider backup geography, restore duration and provider deletion behaviour. The connector response exposes none of those settings. Do not substitute plan defaults, Draft 0.3's proposed 35-day cycle, or the earlier dated six-hour observation for a fresh verified setting. No managed restore was attempted.

[PR #20](https://github.com/Neo1999-bot/hiredflex-platform/pull/20), head `0876588`, remains separate unmerged logical recovery evidence. [CI 41014452079](https://github.com/Neo1999-bot/hiredflex-platform/actions/runs/41014452079) reports success; its dated rehearsal is synthetic, not managed Neon restoration, RPO/RTO acceptance or erasure replay. No duplicate verifier was added here.

## Phase 6 and design boundary

Vercel's canonical Production alias still resolves to deployment `dpl_FLMagkJ1A5yLG3EJjeuLH8JbLbaf`, main `cda8773`, READY, `iad1`. Storage connection metadata separately contains a different latestDeployment ID; canonical deployment lookup is used for the served alias, not that connection field.

31 October public read-only requests: `/health/ready` 200 ready; `/auth/session`, `/candidate/skills`, `/employer/vacancies`, `/recruiter/vacancies` each 401 UNAUTHENTICATED. Root 200 still contains development-key mode without the proxy attribute. This verifies unauthenticated denial and readiness only; intended Production sign-in, fresh onboarding and independent signed-in isolation remain unverified. PR #19 owns the proxy preparation; no activation or deployment occurred here.

The [exact Figma Make reference](https://www.figma.com/make/xNiwwAOZfsOz5tjWHEDmeK/HiredFlex-%E2%80%94-Stage-1-COMPLETE-%E2%80%94-26-Sep-2026) returned source links without a render; file sessions and screenshot rendering do not support Make. Zero rendered screens or source-link contents inspected, zero designs changed. Existing sign-in/workspace → `/auth/session` / `/auth/onboard` and application/history mappings in [PHASE-6.md](PHASE-6.md) remain comparison targets, not verified frame mappings. Design discrepancies are Unknown, distinct from known functional acceptance gaps. Completed prototype Stages 1–2 remain preserved; no two-way synchronisation is claimed.

## Next bounded acceptance

Use this provenance and rule comparison for CODEX-01's inactive synthetic retention calculator; keep all legal/missing-trigger cases blocked and introduce no API, provider or deletion path. Separately, managed recovery verification requires a read-only view of this exact project's recovery settings and a named accountable operator/delegate. Acceptance: record observed recovery window/earliest point, observation date and responsible operator, with no restore or setting change. Neither task activates intake.
