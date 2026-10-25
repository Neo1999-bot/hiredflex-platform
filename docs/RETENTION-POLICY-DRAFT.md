# HiredFlex candidate-data retention policy — DRAFT 0.1

Prepared: 25 October 2026 (South Africa).
Status: owner-review draft; no effective date. Proposed periods below are business defaults, not a claim that deletion currently operates or that every legal obligation has been determined.
Owner: Neo Marothi. Interim support/privacy contact: neomarothi.nfm@gmail.com (approved). No owned business domain has been confirmed.

## Purpose and scope

Apply this schedule to the current recruitment platform: account identity, declared skills, vacancy/application records and status history, support correspondence, security logs and copies held by providers. Matching is calculated on demand; no standalone match score is persisted. CV uploads, interviews, offers, billing and messaging are outside the current release and require an updated data inventory before introduction.

## Legal basis to check before adoption

POPIA section 14 requires purpose-based retention, with lawful exceptions, access to decision records for a reasonable period where no prescribed period applies, and secure deletion or de-identification when retention is no longer authorised. Restrict use of records retained only as evidence. See [POPIA, sections 13–14](https://www.justice.gov.za/legislation/acts/2013-004.pdf).

Employment Services Act section 16 requires private employment agencies to maintain a register of registered work seekers, placements and relevant employers, and retain the covered records for at least three years. Confirm which HiredFlex activities and fields fall within that register, applicable commencement/amendments and any other employment, contractual, tax or dispute obligations before setting deletion dates. See [Employment Services Act, sections 16–17](https://www.labour.gov.za/DocumentCenter/Acts/Public%20Employment%20Services/Employment%20Services%20Act%202014.pdf). The three-year minimum does not justify retaining every field for three years. This draft does not establish HiredFlex's registration or legal classification.

## Proposed schedule for owner review

| Record class                                              | Proposed period and trigger                                                                                                                                                   | End-of-period action                                                                                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Isolated preview/test fixtures                            | 30 days after test completion, unless needed to investigate a documented defect                                                                                               | Delete/de-identify with approved dependency handling; never treat live recruitment records as disposable fixtures                                |
| Auth account created without completed onboarding         | 30 days after creation without onboarding or other necessary activity                                                                                                         | Review and remove through the identity provider where lawful; preserve any required register/hold subset                                         |
| Active candidate profile and declared skills              | Keep while the candidate uses the service; after 12 months without meaningful activity, send a notice allowing 30 days to remain active                                       | Review for restriction/closure after the notice period; remove unnecessary operational profile fields, preserving required register/hold records |
| Operational application and status-history details        | 12 months from the later of vacancy closure and the application's terminal date                                                                                               | Review for deletion/de-identification; first preserve any required register, reasonable decision-access evidence or legal hold                   |
| Statutory work-seeker/placement register, when applicable | Minimum 3 years; confirm the legal trigger. Proposed conservative operational trigger: the later of last relevant register entry and end of the relevant service relationship | Review necessity and any additional legal/contractual period, then delete/de-identify the unnecessary subset                                     |
| Routine support correspondence                            | 12 months after request closure                                                                                                                                               | Remove unnecessary email content/attachments; retain only justified complaint/rights-request evidence                                            |
| Privacy requests, complaints and documented resolutions   | 24 months after closure, subject to a justified hold or different applicable period                                                                                           | Keep a minimal accountability record; review/delete excess verification material                                                                 |
| Routine application/security logs                         | Target maximum 30 days unless a specific incident justifies a documented extension                                                                                            | Expire/redact. Do not extend a provider's shorter retention merely to reach this target                                                          |
| Security incident evidence or litigation/dispute holds    | Only while necessary for the documented investigation, obligation or dispute                                                                                                  | Restrict access/use; owner reviews every 90 days and records when the hold ends                                                                  |
| Backups and provider copies                               | Proposed maximum routine backup cycle of 35 days, only if supported and configured with each provider                                                                         | Expire through verified provider settings; apply the deletion register before restored data is returned to service                               |

These proposed 30-day, 12-month, 24-month and 35-day periods are not universal statutory periods. A specific lawful obligation may require a different justified period. An active account does not reset every old application's retention clock. Consent to a separate talent-pool purpose must be optional, recorded and withdrawable; it must not silently reset historical records or override a legal minimum.

## Requests and deletion process

1. Receive access, correction, objection, restriction or deletion requests at the approved contact. Do not request passwords, OTPs or unsolicited identity-document copies by email. Use a proportionate identity-check process.
2. Log the request date, affected records, responsible operator and applicable response deadline; acknowledge with a target of five business days. This is a proposed service target, not a substituted statutory deadline.
3. Review active recruitment, statutory register requirements, contracts and any documented hold. Tell the requester which categories can be removed, which must remain and why; offer restriction where applicable.
4. Prepare a dry-run inventory. The current foreign keys restrict deletion: applications and history must be handled coherently. Do not simply delete the user or strip actor links to make a database command succeed.
5. Obtain operator approval for the reviewed plan; securely delete or irreversibly de-identify eligible records, including appropriate identity-provider records and provider copies. Pseudonymised IDs that remain linkable are still personal information.
6. Verify the result, record minimal completion evidence and communicate the outcome. Keep backup-deletion markers outside the restore path and replay them before restored data is made available.

Withdrawing an application is a lifecycle action, not an account-deletion request. Removing a declared skill does not erase application history. No erasure guarantee should be published before the end-to-end process is working.

## Implementation and launch gates

- [x] Publish owner-approved interim support/privacy contact in preview.
- [ ] Owner approves the schedule and identifies the accountable Information Officer/responsible party and legal scope.
- [ ] Map each field, provider, lawful purpose, retention trigger and exception. Confirm processor terms and cross-border safeguards for the actual provider regions.
- [ ] Reliably record meaningful activity, terminal dates and vacancy closure. The existing last_login_at field alone is not evidence that inactivity tracking works.
- [ ] Implement restriction/hold flags, retain-until calculations and a dry-run report with no mutations by default.
- [ ] Implement reviewed deletion/de-identification with referential integrity, recorded approvals, least-privilege access and test coverage.
- [ ] Configure and verify Clerk, database, hosting-log and backup retention; confirm provider-specific limits and deletion propagation.
- [ ] Test access/deletion requests and restoration using disposable data. Never run an unapproved purge on existing records.
- [ ] Approve and publish an accurate candidate-facing notice; record version and effective date. Keep this draft separate until then.

## Changing to a domain email later

Create and test the domain mailbox before switching the public contact in src/web/contact.ts. Verify delivery and access controls; update the footer, privacy notice, business documents, provider contact settings and request-handling instructions. Keep the interim inbox monitored during a documented transition and transfer unresolved requests securely. Use forwarding only after checking its privacy/access implications. Purchasing a domain alone does not create a working mailbox; email hosting and DNS setup are separate steps.

## Current implementation limits

The application supports sign-in, declared-skill removal and application withdrawal. It does not currently provide a retention scheduler, account-erasure workflow, legal holds or verified provider/backup erasure. No record was deleted to implement this draft. Production/privacy readiness remains unchecked until approval and implementation pass.
