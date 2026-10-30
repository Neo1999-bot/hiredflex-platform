# CODEX-05 — Disposable PostgreSQL backup/restore rehearsal

Prepared: 30 October 2026. Scope: synthetic CI evidence only. Managed-provider recovery, production restoration and launch readiness remain unverified.

## What this increment verifies

The existing db:verify script first creates its randomly named PostgreSQL 18 database, applies the four migrations and exercises the existing synthetic HTTP workflows. With REQUIRE_BACKUP_RESTORE=1 and TEST_POSTGRES_CONTAINER_ID set to the dedicated CI PostgreSQL service ID, it then calls scripts/verify-backup-restore.ts. CI requires the rehearsal; missing/invalid container identity fails rather than silently passing. Ordinary local verification without the flag explicitly reports backup/restore NOT TESTED.

1. Accept only the parent's hiredflex_verify_ plus 32 hexadecimal-character database name, an exact matching connection pathname/current_database and a hexadecimal Docker container ID. Negative tests require rejection before SQL or command execution. No DATABASE_URL fallback or arbitrary source override is added.
2. Snapshot all twelve public application tables, exact history/identity/role rows, constraints, indexes, enums, sequences and all four migration-journal records. Extra synthetic employer/identity rows make those tables' preservation observable.
3. Run pg_dump custom format inside the PostgreSQL 18 service. Archive bytes remain in memory, with bounded command time/output; no backup artifact, credential or row contents are published or uploaded.
4. Create a second unique hiredflex_restore_ database, restore using pg_restore with exit-on-error, then compare the full logical snapshot. Ownership and ACL restoration are deliberately excluded; this does not test provider/cluster accounts or privileges.
5. Verify canonical skill normalisation, foreign-key rejection and duplicate active-application rejection on the restored copy. Compare snapshots again so rejected writes leave both the restored records and source fixtures unchanged.
6. Close connections and drop only the separately created restore database. The parent verifier cleans up its own source database. A failed dump never creates the restore target; cleanup is conditional on successful creation.

Execution is established only by the exact revision's CI PASS line and recorded run in its PR. Local unit/type/build checks alone do not prove pg_dump/pg_restore ran. No Docker or PostgreSQL client/server executable is available in this local workspace.

## Relationship to accepted screens and APIs

| Existing flow comparison target            | Existing API/data preserved by the logical comparison                                                    | Limit                                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Candidate profile and skills               | GET /candidate/profile and /candidate/skills; users, auth_identities, candidates, candidate_skills       | Restored data/constraints, not a provider session or rendered screen                 |
| Apply, tracker and history                 | GET /candidate/applications and /candidate/applications/:id; applications and application_status_history | Exact records/statuses/history retained; no new lifecycle or erasure behavior        |
| Employer and assigned recruiter workspaces | Company/role, employer, recruiter, vacancy and requirement records                                       | No new grants; restored signed-in HTTP/browser isolation remains separate acceptance |

Figma: exact Make file xNiwwAOZfsOz5tjWHEDmeK design context returned source links without a rendered screenshot on 30 October; session creation rejects Make files. Zero rendered screens or source-link contents inspected and zero designs/UI interactions changed. Existing export-backed mappings remain dated references. No visual discrepancy, prototype fidelity or automatic synchronisation is claimed. Prototype Stages 1–2, independent search, informational matching and application/vacancy boundaries are preserved.

## Provider evidence and open operational gates

| Area                                     | Current evidence for this increment                                                                        | Required before real intake                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| PostgreSQL logical restore               | New disposable rehearsal; exact CI result required                                                         | Review evidence and compatible backup/restore procedure                                   |
| Neon managed restore window and settings | NOT VERIFIED here; this Docker test cannot establish current plan settings or provider PITR behavior       | Inspect actual approved project/branch window, regions, ownership and recovery steps      |
| External stores                          | Clerk, Airtable, WhatsApp, exports and any future intake stores are not backed up or restored by this test | Inventory actual stores, access, retention and provider limitations                       |
| Production recovery                      | No live dump, restore, migration, credential access or provider change                                     | Separately approved rehearsal/plan, current configuration and independent role acceptance |
| Recovery objectives/capacity             | No production RPO/RTO, size or connection-budget guarantee                                                 | Set owner-approved objectives and measure a representative authorised environment         |

## Future deletion-suppression ledger — design only

No erasure workflow exists and no deletion is activated. Before any future approved erasure, design a restricted suppression ledger outside the dataset's ordinary restore path. Each entry should contain a scoped opaque subject/record reference, provider/category, approved operation, completion time, policy/decision version and replay state; avoid CV contents or unnecessary identifiers. Treat linkable references as personal information with their own retention/access rules.

Restore into quarantine. Restrict application access, load the separately preserved ledger, assess holds/legal exceptions and apply only previously authorised suppressions through the separately reviewed deletion process. Verify each affected store and record partial provider failures before reopening access. A backup containing the same old ledger cannot prove current suppression state; the replay process must fail closed when the authoritative ledger is unavailable. This is a future design, not an implemented ledger, purge permission or promise that provider backups are erased.

Saved Draft 0.3 was re-read in full on 30 October. Its no-effective-date, no-intake and no-automatic-purge limits remain distinct from conditional owner governance approval; the proposed backup period is not a verified provider guarantee. No policy text, statutory conclusion or approval scope is changed by this rehearsal.
