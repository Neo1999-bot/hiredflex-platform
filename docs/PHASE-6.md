# Phase 6 — Web interface and managed identity

The root URL now serves a responsive HiredFlex website rather than a route-not-found response. It uses the existing Fastify API on the same origin, with candidate, employer and recruiter workspaces.

## Delivered code

- Public vacancy search and detail; truthful empty states.
- Candidate onboarding, skills, explainable matches, application submission, history and withdrawal.
- Employer company listings, vacancy drafts, structured requirements, publishing/closing, assigned recruiters and applicant lists.
- Recruiter assigned vacancy lists and review/shortlist/reject actions.
- Managed Clerk sign-in UI, signed session verification through `jose`, trusted issuer/origin restrictions, database identity mapping and verified-email candidate onboarding.
- Identity records are separate from email. Existing users are never linked automatically by matching email. Account status and role assignments are loaded from PostgreSQL; token roles and client input cannot grant company access.
- Secrets remain server-side. Requests use bearer session tokens, not locally persisted tokens; authentication headers are redacted from logs.

## Deployment configuration

Apply migration `0003_managed_identity.sql` with the existing migrator. Its Drizzle journal entry follows the original three migrations.

Configure through the Clerk Vercel Marketplace integration:

- `CLERK_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- `CLERK_SECRET_KEY`
- `AUTH_ALLOWED_ORIGINS`: comma-separated exact trusted site origins; no wildcard domains. Add the stable preview alias when testing. Add the production origin before production launch.

Clerk's issuer is derived from the publishable key. Configure verified primary email sign-up in Clerk. When configuration is absent, public browsing works and protected APIs remain inaccessible. This is a configuration state, not a working sign-in deployment.

## Company access

Candidate registration grants only Candidate. An operator with database access must approve company roles. Provisioning is a deliberate administrative action, outside public sign-up. A recruiter needs both a recruiters record and a Recruiter assignment; an employer needs an Employer assignment scoped to its company. Never accept role assignments from browser forms or token metadata.

## Validation and release gate

Local unit tests, typecheck, lint, format and build are required. CI `db:verify` creates a disposable PostgreSQL 18 database, migrates twice and checks constraints/locking plus the actual HTTP publish/apply/review/shortlist/withdraw/reapply workflow. Its test principal resolver exists only inside the verification script, never the deployed server.

Live provider sign-in and browser end-to-end checks remain required after Clerk installation. Production needs its own database/configuration and migration verification. Do not label an unconfigured preview as the completed production platform.

## Scope

This release covers the approved application lifecycle. Interviews, offers, CV/document upload, WhatsApp/email notifications, billing and automated screening are not part of this release. The privacy page explains the actual stored fields and matching limitations; organisation-specific retention and support details need confirmation before inviting real candidates.
