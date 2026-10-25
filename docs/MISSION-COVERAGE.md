# HiredFlex six-mission coverage — 25 October 2026

Status: In progress across application, operations and launch preparation. No public production launch, purchase, filing or outreach is completed by this document.

Known means inspected evidence; Likely/Possible identify proposals; Unknown means evidence is missing. [THOTHOS-OPERATING-MANDATE.md](THOTHOS-OPERATING-MANDATE.md) preserves the full owner brief. [RELEASE-GATES.md](RELEASE-GATES.md) remains authoritative for launch. Prototype stages, engineering phases and CV-service stages are distinct.

## Latest owner scope correction — 25 October 2026

Known from Neo's statement: formal WhatsApp and Google Forms candidate intake has not started. He reports an existing vacancy group of 300+ people and wants WhatsApp intake prepared first. This is not a verified subscriber count, consent record, candidate pipeline or instruction to import/send messages. Airtable evidence establishes schema only, not populated CVs/contact histories/attachments. Earlier URL/access notes are historical setup evidence.

Privacy work is In progress: RETENTION-POLICY-DRAFT.md v0.2 adds minimisation, provider geography/deletion unknowns, team access/offboarding, purpose/version linkage, officer registration and incident response. WHATSAPP-INTAKE-PLAN.md defines a proposed private manual pilot and synthetic acceptance criteria; no app configuration, API integration, transfer, real intake or deletion was executed. Google Forms remains deferred. Registration preparation flags the candidate-fee boundary for professional review. Public “Privacy and trust” wording may say these controls are drafted; do not advertise compliance or working erasure.

## Mission 1 — application and operations

| Component                                     | Done / In progress / Missing                                  | Evidence and remaining acceptance                                                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core Candidate, Employer, Recruiter workflows | Done for previously tested preview paths; release In progress | PR #1 records lifecycle and scope checks; independent-account and production gates remain open                                                                         |
| Source-linked jobs                            | Implemented/tested in open PR #5                              | Two official-source records, expiry, details and working filters; not an automatic feed or a partner relationship                                                      |
| Welcome, footer, employer tabs                | Implemented in this increment                                 | Public destinations; overview/vacancies/applicants/read-only pipeline/company/access views use current APIs. See EMPLOYER-SCREEN-REVIEW.md                             |
| Intake form                                   | Deferred; not collecting per owner                            | Historical editor URL/read 403; latest owner confirms intake has not started. No published collection/transfer claimed                                                 |
| Airtable CRM                                  | Done: five-table schema audit                                 | HiredFlex Operations base appHpL4SbQoT0ANz0 has Candidates, CV Requests, Documents, Employers/Leads and Team Tasks. No personal records were read or changed           |
| CV request and document tracking              | In progress                                                   | Stage, QA Outcome, candidate/document links and verification notes exist. Automated transfer, document authenticity, delivery audit and app integration are not proved |
| Independent QA gate                           | In progress; enforcement Missing                              | QA Outcome options are Pending / Approved / Changes Required. Stage allows Delivered separately. No evidence yet that delivery is blocked without approval             |
| WhatsApp Business                             | In progress at owner-plan level                               | Owner-reported 300+ vacancy community; intake not started. WHATSAPP-INTAKE-PLAN.md prepares manual private intake; no setup/API/transfer verified                      |
| ThothFlex                                     | Missing implementation                                        | Coaching modes and guardrails specified; no provider, evaluation or production chat claimed                                                                            |

Incremental MVP: reuse PostgreSQL identity and company permissions; retain external operations as separately owned records until a reviewed mapping prevents duplicate candidate masters. CV requests need request/candidate/source IDs, consent evidence, target role/service, evidence status, owner, due date, independent reviewer, review timestamp/outcome/reason and delivery/follow-up evidence. A checkbox alone does not establish legal consent or document authenticity. Never copy identity documents into public GitHub.

The operating CV sequence is intake/consent → source verification → evidence-backed draft → independent QA → corrections or approval → PDF/DOCX delivery → follow-up. Missing evidence stays Pending with the exact gap recorded; it is not approved. Before delivery, require approval of the same draft version by a separate reviewer. Define who may review and override, and record any override explicitly. These are acceptance requirements, not implemented automation claims.

## Prioritised build plan

| Priority | Bounded next action                                     | Acceptance / trade-off                                                                                                                             |
| -------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Review/test current UI and release gates                | Current role journeys and Figma differences have evidence; postpones feature expansion                                                             |
| P0       | Finish independent identity and rollback/locking checks | Distinct candidates cannot access each other's records; failed history writes roll back. Tests use disposable resources                            |
| P0       | Verify consented intake to QA-gated delivery            | One synthetic request travels through the real configured tools; delivery cannot precede the approved draft version. No real candidate data needed |
| P1       | Add one metadata-only CV-service request increment      | Owned request and company isolation tests; do not add file upload/storage by implication                                                           |
| P1       | Prepare chosen domain/email and registration pack       | Exact quote and launch decisions reviewed; purchase/signature remains Neo's                                                                        |
| P1       | Research and rank partner leads                         | Thirty qualified rows with public business sources and checked dates; no invented hiring volume                                                    |
| P2       | ThothFlex coaching pilot                                | Approved provider/budget/privacy and evidence-aware evaluations; no automated hiring decisions                                                     |
| P3       | College pilot                                           | Three documented partner signals and real opportunities first; one campus/cohort before expansion                                                  |

## Mission 2 — domain and publishing: In progress

- [x] Five options and dated tool results are in DOMAIN-SHORTLIST.md. Owner preference: hiredflex.co.za. Earlier availability is not a reservation.
- [x] DNS/SSL/mailbox setup sequence prepared; preserve existing records and use actual provider-supplied DNS values.
- [ ] Obtain exact current registration/renewal/VAT/mailbox quotes and compare with the existing Vercel application route. A generic shared-hosting plan is not proved compatible with Node 24/Fastify/PostgreSQL.
- [ ] Neo approves provider, exact domain, term, price and renewal preference before purchase; production release remains separately gated.
- [ ] Verify DNS ownership, HTTPS and actual send/receive mail before replacing the approved interim contact.

Official provider checks today: xneelo advertises basic web hosting at R99/month and 24/7 support, with domains separately priced; this is not an exact hiredflex.co.za checkout or a Node-runtime compatibility finding. Hostilo lists .co.za registration/renewal at R99/year excluding VAT where applicable, with DNS controls. These are provider-published offers, not service-quality guarantees. Their applicability and exact checkout require review. Keeping the existing Vercel app and selecting domain/mail separately is a Possible route that avoids an unproved migration. No provider was purchased or recommended as launch-ready solely on headline price.

Sources checked: <https://xneelo.co.za/web-hosting/>, <https://xneelo.co.za/domains/>, <https://www.hostilo.co.za/domains>. Exact availability was not rechecked in this UI increment.

## Mission 3 — registration: In progress (preparation)

See REGISTRATION-PREPARATION.md for the owner checklist and placeholder founder/role/equity drafts. Neo supplies private facts, reviews with an appropriate professional and files/signs. Incorporation is separate from platform readiness, agency obligations and candidate-data governance. No filing or legal status is claimed.

## Mission 4 — ThothFlex: In progress (specified, not built)

| Mode                 | Required output and evaluation                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| ATS Optimizer        | Evidence-linked CV/JD comparison; separate keyword, structure and readability rubrics. No universal ATS score or added experience                     |
| Web Analytics        | Current source-linked platform/role signals; distinguish observations from recommendations. Credential value is not guaranteed qualification          |
| Report Feedback      | Sourced strengths, gaps, priority fixes and a concrete next step                                                                                      |
| Mock Interviews      | One question at a time; clarity/evidence/relevance feedback; candidate can stop/skip; final improvement summary                                       |
| Candidate Care       | Dignified, grounded encouragement without selection promises                                                                                          |
| Recruiter / Employer | Authorised, source-supported summaries and hiring-needs intake; candidate-declared, document-supported and independently checked are different labels |

Before building: choose provider and capped budget; map consent/data retention/access, prompt-injection handling, human escalation and source ledger; evaluate unsupported claims, discrimination/proxies, data leakage and false employment assurances. No provider call or paid deployment is authorised by a mock chat screen. Human CV QA remains mandatory before delivery.

## Mission 5 — partners: In progress; qualified 30-lead output Missing

Prioritise ICT/support/customer-service employers, relevant agencies, then learnership/TVET partners. Segment fit is Likely until hiring evidence is read; company size is not hiring volume. No verified qualifying replies were inspected and no outreach was sent.

The existing Employers/Leads schema has Organisation, Segment, Contact Channel, Status and Contact Notes. Actual statuses are New / Contacted / Qualified / In Discussion / Active / Closed, which differ from the owner's New → Contacted → Replied → Meeting → Partner. Do not silently map Qualified to a reply or Active to a partnership. Decide migration/mapping before changing existing operational records. Confidence/source URL/checked date/hiring evidence/owner/next action and next date need structured fields or an agreed temporary notes format.

- [ ] Research 30 qualified organisations from public company/career/business sources; rank top 10 and mark unknown volume honestly.
- [ ] Verify public business contact channels, candidate consent, existing agency relationships and Neo's workplace/conflict boundaries; never use workplace/customer data.
- [ ] Prepare separate agency, employer and college/learnership drafts with truthful current service capacity. Candidate details are shared only with appropriate permission.
- [ ] Record actual sent/reply/meeting/agreement evidence before advancing the pipeline.
- [ ] Weekly review: check last activity, overdue next actions, source freshness, real replies and candidate permissions. This checklist is prepared; no new weekly automation was created.

Unsent employer draft: “Hello [organisation/team]. I am Neo, founder of HiredFlex, developing evidence-led career services and a recruitment platform. We would like to understand your current [role family] hiring needs and candidate requirements. May we discuss whether a small, consented pilot would be useful? We would agree screening, data sharing and any commercial terms before introductions.” Agency variant: ask about complementary referrals and ownership/conflict rules, not access to its candidate database. Do not say the business is registered or candidates are independently verified without records.

One-page pitch outline: evidenced problem → current delivered services/limitations → permissioned source-supported candidate summaries → small pilot scope and success measures → human review/data controls → proposed commercial discussion → agreed next step. Referral/commission terms remain proposals subject to legal review, never asserted as agreed or charged to candidates.

## Mission 6 — EEC adoption: Blocked for outreach; groundwork In progress

Trigger: at least three documented employer/recruiter replies or substantive conversations plus real relevant opportunities. No trigger was established by schema access, sample vacancies or source-linked adverts alone.

Known public routes: EEC's Registrar page identifies Student Support and Student Placement; Student Support has a published overview. These establish organisational routes, not permission for a commercial pilot. Named approver, external-provider process, procurement/privacy review and campus permissions remain Unknown. Sources checked 25 October: <https://eec.edu.za/registrar/>, <https://eec.edu.za/student-support/>, <https://eec.edu.za/about-us/>. No contact was made.

Prepared pilot outline (proposal): one campus, one final-year cohort, 6–8 weeks. Week 1 owner/college approvals and purpose-specific consent; week 2 source-backed CV workshop; weeks 3–4 evidence review and human-led interview practice (ThothFlex only after its pilot gates); weeks 5–6 consented employer showcases/intros where real roles exist; weeks 7–8 follow-up, feedback and reviewed results. Neo sets any free/low-cost pricing. Track eligible/invited/consented denominators, CVs QA-approved, practice completions, employer-confirmed interviews and evidenced placements separately. No targets are claimed achieved.

30-minute campus session outline: 5 minutes purpose/privacy and boundaries; 10 minutes truthful CV examples; 10 minutes one practical interview question and feedback; 5 minutes optional next steps and questions. WhatsApp-first flow: welcome → verified intake link → explicit consent → source checklist → QA-reviewed service → candidate-reviewed delivery → optional follow-up. The actual form and published URL need verification before making a QR code/poster.

Safe founder draft: “Neo Marothi is developing HiredFlex to help candidates present their real skills and experience and connect with relevant opportunities. He reports studying ICT at Ekurhuleni East TVET College; qualification completion should be stated only after the supporting result or certificate has been checked.” Do not substitute “NCV Level 4 graduate” without that evidence.

Unsent approach outline: request a meeting with the authorised student-support/placement route; describe a small proposed cohort, actual available services, opportunity evidence, consent/data controls and pricing proposal; ask who approves external-provider pilots. Meeting agenda: student need, role evidence, scope/owners, data and commercial review, measures, decision. Credibility pack needs document-backed founder qualifications, tested application evidence, actual business-registration status and approved policies. Address privacy through specific controls, commercial motives through transparent terms and new-business credibility through evidence rather than promises. After a real pilot, analyse denominators/feedback and seek approval before expanding.

## Inputs for Neo

No new approval is needed for this bounded development branch. Remaining owner inputs: revised retention/notice decision; privately identified WhatsApp Business account and operators; Google Forms deferred; domain quote/purchase and production-release decisions; private founder/director/shareholder facts for registration; documented credential and partner-signal evidence. No credentials or identity documents belong in public project files.
