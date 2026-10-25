# ThothOS × HiredFlex — additive operating mandate

Adopted: 25 October 2026. Owner: Neo Marothi. Agent: Thoth.
Status: mission integration and prioritised delivery plan; not a claim that all six missions are complete.

## Latest consolidated engineering and business decision — 25 October 2026

Read [CODEX-BUILD-PROMPT.md](CODEX-BUILD-PROMPT.md) for Neo's Build Prompt v1 reconciled with current evidence as v1.1. Its latest employer/partner-only revenue policy supersedes historical candidate-paid pricing/proposals. No candidate application/referral/placement/success charge or salary deduction is permitted; actual fee logic/terms remain a separate approval. This is owner policy, not a claim that every career service's legal classification has been settled.

The expanded profile/readiness, document verification/upload, interview request, placement tracking, assessment and metrics roadmap is planned in separately gated increments. It does not rename or enlarge accepted prototype Stages 1–2, current engineering release or lifecycle. Proposed employer-only placement fees have no hard-coded percentage; a three-calendar-month guarantee is an unimplemented proposed term needing approval, not a signed promise.

Neo will contact the team before concluding intake/reviewer assignments; keep them pending and do not repeat requests now. WhatsApp Business App is owner-confirmed, formal intake is not started, Google Forms deferred; group size is owner-reported context only. Airtable's audited schema is not proof of actual intake/consent/verified candidates. Proposed privacy v0.2 remains in open PR #9 until merged/adopted and implemented. Issue #2 is closed and PR #8 is merged at the dated v1.1 baseline; refresh rather than repeat their old missing-work lists. The older tables below remain historical where this section supersedes them.

## Preserve the current mission

The long-term product grows from career/CV services into candidate matching, supported screening, employer partnerships and a talent pool. Candidate, Recruiter and Employer are first-class users. Today's CV-service delivery should feed that structure without overstating what the platform currently does.

The existing PostgreSQL/Fastify/TypeScript/Clerk application and approved lifecycle remain intact. Current application states are Applied, Reviewing, Shortlisted, Rejected and Withdrawn; vacancy states are DRAFT, OPEN and CLOSED. Matching remains informational exact-normalised requirement comparison, not a hiring prediction. Company access is resolved from persisted role assignments.

The current Phase 5/6 release does not include interviews, offers, CV uploads, WhatsApp/email notifications, billing or automated screening. The new missions authorise planning and subsequent scoped increments; they do not retroactively mark those features complete. Current release evidence and blockers are authoritative in [RELEASE-GATES.md](RELEASE-GATES.md). The unapproved retention draft is [RETENTION-POLICY-DRAFT.md](RETENTION-POLICY-DRAFT.md).

## Evidence and reporting rules

| Label    | Meaning                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| Known    | Supported by a cited source document, direct observation or verified tool result. State the scope and date. |
| Likely   | Reasonable inference from identified evidence; explain the inference and what would verify it.              |
| Possible | Plausible option/hypothesis with limited support; do not present it as established.                         |
| Unknown  | Missing, inaccessible, conflicting or unverified information. Identify the smallest useful check.           |

Every execution report starts with a two-line status, uses tables/checklists where useful, gives each mission Done / In progress / Blocked with needed input, separates what ran from what is untested, and ends with Next 3 actions for Neo. Do not tick release gates on the basis of code presence alone.

Candidate qualifications, employment, achievements and graduation must trace to supplied documents or clearly labelled user statements. Do not publish "verified candidate" based only on an intake assertion. In particular, an alumni story must not assert NCV Level 4 graduation until the result/certificate supports it. Gaps should prompt a strategy, never invented experience.

## Latest intake/privacy scope decision — 25 October 2026

Neo confirms formal WhatsApp/Google Forms intake has not started, reports an existing vacancy community of 300+ people and requests WhatsApp preparation first. This supersedes any inference that an editor link, CRM schema or group membership proves live intake/consent. Google Forms remains deferred. WhatsApp preparation is a separate manual operational pilot (WHATSAPP-INTAKE-PLAN.md), not a platform API feature, group-roster import, bulk messaging authorisation or paid BSP approval. Keep the existing community distinct; no automated two-way CRM sync or completed request is claimed.

RETENTION-POLICY-DRAFT.md v0.2 remains a draft pending actual adoption, legal/provider checks and implementation. It now includes conditional external-operation rows, restricted-data minimisation, consent/version/purpose linkage, access/offboarding and incident/officer registration preparation. REGISTRATION-PREPARATION.md records the verified fee-rule text and unresolved service-specific advice. Positive owner feedback does not automatically approve all periods or establish compliance.

The dated audit tables below are historical where this decision differs. Real CV intake, attachments and consent records were not inspected; verify actual use before any statement that these contain candidate information.

## Current audit addendum — 25 October 2026

The owner restated the full six-mission mandate while supplying 21 additional welcome/employer/footer screenshots. All requested deliverables and missing acceptance evidence are tracked in [MISSION-COVERAGE.md](MISSION-COVERAGE.md). This addendum supersedes the stale discovery observations in the original audit table below where specified:

- Known: Airtable **HiredFlex Operations** is accessible. Schema reads confirm Candidates, CV Requests, Documents, Employers/Leads and Team Tasks, including consent evidence and QA fields. This is schema verification, not proof of production workflow enforcement, candidate accuracy or application integration. No records were read or changed.
- Known: the owner supplied the Google Forms editor URL. A current content fetch returned HTTP 403; form content, published URL and Forms-to-Airtable transfer remain unverified. It is not correct to say no URL is known.
- Known: CV Requests has Stage and QA Outcome fields (Pending, Approved, Changes Required). These fields alone do not enforce independent QA before delivery. WhatsApp labels/quick replies remain owner-planned; no Business-app automation was verified.
- Known: external source-linked jobs and their working filters are reviewable in PR #5. Welcome/footer and employer tabs build on that branch. Pending PRs have not been merged into main; production readiness is not established.
- Known: hiredflex.co.za is the owner's preferred domain. Registration/ownership remains unverified; no purchase is authorised.
- Unknown: graduation/certification documents and three qualifying employer/recruiter replies have not been inspected in this audit. Do not turn an alumni narrative into an unsupported graduate claim or open college outreach early.

## Mission status and current-system audit

| Area                                                              | Done / In progress / Missing                                            | Evidence label and limits                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Candidate sign-in/profile, skills, matching, applications/history | Done for the tested preview paths                                       | Known: recorded browser/API/database tests; fresh independent-account onboarding and other gates remain open          |
| Employer workspace, vacancies, requirements, recruiter assignment | Done for the tested preview paths                                       | Known: live test company/role setup and closed labelled test fixtures                                                 |
| Recruiter review/shortlist/reject                                 | Done for the tested preview paths                                       | Known: tested with the same approved account holding all roles; independent identities remain a separate check        |
| Existing external intake forms                                    | Missing evidence                                                        | Unknown: no form URL/fields or accessible external intake identified; account onboarding is not the CV-service intake |
| Airtable CRM                                                      | Missing evidence                                                        | Unknown: no Airtable-specific connected tool or base/schema inspected. This does not prove a base does not exist      |
| WhatsApp Business flow                                            | In progress at planning level; integration missing from current release | Known: release scope excludes notifications. External business-app/number/flow state is Unknown                       |
| CV pipeline and CV-request tracker                                | Missing from inspected application                                      | Known for this repository: no implemented service-request/upload pipeline found. Offline delivery state is Unknown    |
| ThothFlex                                                         | Missing from inspected application                                      | Known: no implemented chat/AI workflow in this build                                                                  |
| Domain/professional mailbox                                       | In progress                                                             | Known: owner reports no domain; interim support email approved and verified in preview                                |
| Retention policy                                                  | In progress                                                             | Known: draft prepared; not approved or implemented                                                                    |
| Business registration                                             | In progress at preparation stage                                        | Unknown: no filing/registration evidence inspected; never describe the business as registered Pty Ltd without proof   |
| Partner outreach and 30-lead list                                 | In progress at planning stage                                           | Unknown: no verified completed lead list, sent outreach or qualifying replies inspected                               |
| TVET adoption                                                     | Blocked for outreach; groundwork can proceed                            | Unknown: three qualifying employer/recruiter signals have not been evidenced                                          |

Mission 1 is In progress; Mission 2 is In progress; Mission 3 is In progress (preparation); Mission 4 is In progress (scope definition, not built); Mission 5 is In progress (scope/pipeline definition); Mission 6 is Blocked for outreach while preparatory work is allowed.

## Mission 1 — finish the application

### Incremental MVP definition

| Capability          | MVP behaviour                                                                                                                                        | Boundary / trade-off                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate intake    | Minimum contact, role/location interests, source-backed skills/qualifications, service choice and explicit data-use notice/consent where appropriate | Do not request identity numbers, bank data or sensitive attributes; reconcile with existing identity/profile rather than duplicate accounts |
| CV request tracking | Request ID, candidate owner, service, intake received, evidence checklist, status, assigned operator and agreed completion target                    | Start with metadata and secure evidence intake design; file upload/storage needs its own reviewed security/retention work                   |
| Recruiter view      | Existing assigned-vacancy review plus a separately specified service-work queue                                                                      | Do not let a service queue bypass vacancy-level or company permissions                                                                      |
| Employer view       | Existing vacancy/application flow plus hiring-needs intake                                                                                           | Do not imply interviews/offers/comms already exist                                                                                          |
| ThothFlex chat      | Named assistant with evidence-aware CV/report coaching and one-question-at-a-time mock interviews                                                    | Requires separate AI implementation, provider/cost decision, privacy controls and evaluation before public use                              |

### Priorities

| Priority | Next action                                                                                                                             | Trade-off / completion evidence                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| P0       | Complete current release gates: onboarding, browser/mobile, Figma reference, production configuration and retention/operations approval | Protects the working foundation; delays expansion instead of hiding launch risks                                |
| P1       | Map existing forms/Airtable/WhatsApp/offline CV delivery; document field ownership and source-of-truth decisions                        | Reuse existing operations. Do not silently replace PostgreSQL with Airtable or create a second candidate master |
| P1       | Specify and build one service-request/intake increment with role/ownership tests                                                        | Delivers CV-service value without weakening completed lifecycle boundaries                                      |
| P2       | Implement ThothFlex coaching in a bounded pilot with documented inputs, outputs, cost limits and evaluations                            | Useful assistant first; no automated hiring or fabricated universal ATS scores                                  |
| P2       | Verify partnership leads and prepare reviewed outreach                                                                                  | Creates demand/opportunities before student adoption                                                            |
| P3       | Add approved communication/file integrations and college pilot after prerequisites                                                      | Extra compliance and operational cost follows demonstrated use                                                  |

## Mission 2 — domain and publishing

Use five exact-name options and real availability results in [DOMAIN-SHORTLIST.md](DOMAIN-SHORTLIST.md). Compare registrars/hosting using current primary-source registration and renewal prices, VAT/currency, email cost, DNS controls, ease and South African support. Missing quotes remain Unknown. Availability is time-sensitive and never a reservation.

Prepare the selected setup: registrant details privately supplied by Neo; nameserver/zone ownership; actual project-returned A/CNAME/TXT values; preserve MX and unrelated records; provider-specific SPF, DKIM and DMARC; verify DNS, HTTPS and sending/receiving mail. A domain does not include a mailbox by default. Keep the interim inbox monitored while migrating unresolved requests.

Neo approves exact domain, term, current price, renewal preference and provider before any purchase. Prepare production publishing for review and obtain approval before public launch. No purchase or production publication has occurred as part of this mandate.

## Mission 3 — South African Pty Ltd preparation

Prepare a current, officially sourced CIPC checklist covering name-reservation options, company/director/shareholder details, required identification/address documents, beneficial ownership, MOI and signing steps. Keep identity numbers, document copies and private addresses out of public GitHub. Draft a founder-details sheet with placeholders, role-confirmation letter templates and an equity/vesting discussion outline for legal review; do not invent directors, holdings, appointments or signatures.

Flag applicable SARS/tax registrations, annual returns/beneficial-ownership maintenance, business banking, employment-agency obligations, WhatsApp Business/API verification and POPIA governance. Costs, legal requirements and provider conditions require fresh primary-source verification. Neo files and signs; prepared documents are not evidence of submission or approval.

## Mission 4 — ThothFlex

Identity: ThothFlex. Style: warm, direct, structured, honest; grounded encouragement, no hollow praise or job guarantees. Respect every candidate's dignity.

| Skill/mode      | Required behaviour                                                                                                                                                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ATS Optimizer   | Compare supplied CV evidence with a target job description; separately explain keyword coverage, formatting and section structure. Disclose rubric and limitations; never imply a universal employer ATS score or add missing experience                                          |
| Web Analytics   | Use cited, current market/platform signals to explain channel fit across LinkedIn, PNet, Indeed, employer career sites, communities and TVET/learnership portals; identify evidence-based course/credential gaps. Do not call opinions live analytics or guaranteed qualification |
| Report Feedback | State sourced strengths, honest gaps, priority fixes and a next-step plan                                                                                                                                                                                                         |
| Mock Interviews | One question at a time, role-specific; score clarity/evidence/relevance, give model-answer pointers and a final improvement summary. Candidate can skip/stop; do not turn practice into an automated hiring decision                                                              |
| Candidate Care  | Recognise real strengths, normalise setbacks and celebrate evidenced progress without promises                                                                                                                                                                                    |
| Recruiter       | Source-linked candidate summaries and role-fit reports; distinguish candidate-declared, document-supported and independently checked claims                                                                                                                                       |
| Employer        | Hiring-needs intake, job-requirement clarification and evidence-based shortlist summaries for human review                                                                                                                                                                        |

Guardrails: minimise personal data, restrict modes to authorised roles, keep a source ledger, resist document/prompt injection, avoid protected-attribute discrimination and proxy inferences, and escalate sensitive cases to a human at HiredFlex. No autonomous hiring/rejection, outreach or invented credentials. Provider data terms, retention, access control, cost limits and evaluation remain implementation gates.

## Mission 5 — partners and lead pipeline

Prioritise recurring entry-level ICT/support/customer-service employers, suitable recruitment agencies, employers with demonstrable junior hiring, and TVET/learnership partners. Include role/segment fit and evidence dates; never infer hiring volume from company size.

Deliver 30 qualified organisations, ranked top 10, in an Airtable-ready table with organisation, segment, fit rationale, evidenced roles/volume (Unknown when absent), public business contact channel, source URL, confidence label, checked date and rank. Use company sites, career pages, business LinkedIn pages and job boards. No personal-profile scraping or unsupported contacts.

Prepare segment-specific WhatsApp introduction, email and one-page partnership pitch. Describe only actual service capacity and candidate verification status. Referral/commission terms are proposals, not agreed rates; validate employment-agency/legal obligations before using them. Neo reviews and sends; Thoth does not contact recipients.

Pipeline: New → Contacted → Replied → Meeting → Partner. Contacted requires actual sent evidence; Replied requires a real response; Partner requires recorded agreement. Include owner, last activity, next action/date, source and notes. Prepare a weekly review; do not claim a scheduled review/automation exists until configured and confirmed by the relevant tool.

Before outreach, check candidate permission and pool provenance, existing employer/agency relationships, Neo's workplace policies and conflicts, duplicate approaches and unsupported endorsement claims. Do not use Nutun/customer/workplace data or portray an employer as a partner without authorisation.

## Mission 6 — Ekurhuleni East College adoption

Groundwork can proceed now. Outreach begins only after at least three evidenced employer/recruiter replies or substantive conversations and actual relevant opportunities are available. Generated leads, sent drafts, mock applications and the preview fixtures do not count. Flag the trigger when verified; do not infer it from enthusiasm.

Research public student-support, career/placement, WIL, alumni and campus-management routes and their actual processes; mark unknown contacts/approval requirements. Draft an alumni founder story and credibility pack from verified documents. Alma-mater context is user-reported; NCV Level 4 graduation is not yet document-verified.

Prepare an owner-priced free/low-cost final-year offer: CV workshops, one-question-at-a-time ThothFlex interview practice, employer showcases and a consented graduate talent pipeline useful to placement reporting. Draft a WhatsApp-first onboarding flow, QR poster, 30-minute session and Google Form with minimised fields and explicit, purpose-specific consent. Do not create a QR link to a nonexistent intake or claim a Google Form was created without a tool result.

Plan one campus, one cohort and a 6–8 week pilot with defined sign-up, CV completion, interview-practice, real interview and placement metrics, clear denominators and feedback. Do not fabricate targets achieved, testimonials or outcomes. Draft the formal approach, one-page pitch and meeting agenda; Neo reviews/sends. Prepare honest answers on privacy, commercial motives and new-business credibility. A registered business/live website can strengthen the case but must be verified before claimed. Post-pilot, analyse actual results and propose expansion; no rollout result exists yet.

## Inputs and gates

- Existing form links, Airtable base/access or schema, WhatsApp Business setup and offline CV operating process: Unknown until inspected.
- Owned domain: none reported. Interim contact remains approved; no purchase authorised.
- Retention draft: awaits owner approval, legal-scope confirmation and implementation.
- Registration facts/identity documents/equity decisions: Neo supplies privately and files/signs.
- Founder graduation/certification evidence and consented candidate source documents: required before public verification claims.
- Employer/recruiter reply evidence and real opportunities: required before college outreach.

Next 3 actions for Neo: identify existing operational tools; review the retention draft; choose a preferred domain for an exact registrar/email quote. These do not authorise spending or outreach.
