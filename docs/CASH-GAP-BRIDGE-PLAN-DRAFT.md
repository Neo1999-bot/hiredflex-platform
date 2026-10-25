# HiredFlex — Cash-Gap Bridge Plan, draft v0.1

Prepared 25 October 2026 from Neo's draft and the current project decisions. Status: proposed commercial/capacity experiment; no prices, contracts, invoices, sponsor awards, outreach or service caps are activated. Rand amounts and success percentage remain unset. This is not a legal opinion, financing commitment or forecast of guaranteed income.

## Objective, boundaries and evidence

Candidates receive services free under the latest employer/partner-only revenue policy. Proposed bridge: employer-funded advance/service fees, sponsor-funded capacity and transparent free-service queues. None permits candidate charges, deductions, pay-to-skip queues or recovery of employer fees from a work seeker's pay.

Known: the owner supplied this draft; the repository contains separately staged recruitment workflows. The actual current cash balance, operating costs, funded capacity, employer willingness to pay and sponsor eligibility are Unknown. The WhatsApp Business App is owner-confirmed but formal intake has not started; Google Forms stays deferred. Team availability remains pending Neo's contact. A 300+ vacancy community is not a consented intake count, paying customer base or workload forecast.

This document does not activate billing, placement tracking, guarantees, CV uploads, assessments, interview workflows or ThothFlex. It does not change the accepted application/vacancy lifecycle or completed prototype Stages 1–2. Use CODEX-BUILD-PROMPT.md, RELEASE-GATES.md and the privacy/intake drafts for engineering and activation gates.

## 1. Employer upfront fees — proposals to test, no current tariff

| Item                         | Proposed payment milestone                                                  | Amount / basis                                      | Proposed credit or quality rule                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Vacancy listing and sourcing | At the agreed posting/sourcing milestone                                    | R___, not set                                       | Credit against the same agreed success fee if the employer hires through HiredFlex; define no-hire treatment before accepting money         |
| Screening and shortlist      | Delivery of an agreed shortlist                                             | R___ per candidate or R___ bundle; choose one basis | Evidence-checked candidates only, scoped verification and no inflated lists. Whether this fee also earns a success-fee credit is unresolved |
| Success fee                  | Candidate's confirmed start date, subject to agreed invoicing/payment terms | ___% of defined first-year pay; no default          | Employer pays. Define the pay base, currency, tax treatment and credit allocation before a quote is binding                                 |

Test the fee structure with 3–5 employers after legal/service readiness and Neo's review of the proposal. This is a research sample target, not evidence that calls occurred or demand exists. Do not invent a rand figure, market rate, salary or percentage. No current candidate-paid historical price may be reused as an employer tariff without a decision.

### Must settle before an offer, invoice or billing implementation

- Exact service/deliverable, verification scope, number/quality of candidates, agreed timescale and approval owner. Do not sell unbuilt platform features or claim every candidate/credential has been checked.
- Clear written employer terms/invoices: employer cannot recover fees from candidates or deduct them from pay. Check applicable agency duties, current legal instruments and contract terms with a South African labour-law adviser; see REGISTRATION-PREPARATION.md. No legal consultation was booked by this document.
- Which upfront/shortlist payments are creditable, the specific vacancy/placement they attach to and the maximum aggregate charge. Prevent duplicate use of a credit and double billing across invoices, cancellations and multiple hires.
- Refund/credit/non-refundable-work rules if no suitable shortlist arrives, no hire occurs, the vacancy is cancelled, a candidate does not start, or a fee is smaller than prepaid amounts. Decide excess-credit handling explicitly; a zero floor alone must not silently forfeit a refund.
- Define first-year pay (including/excluding benefits or variable pay), percentage version, tax/VAT applicability, invoice due date, who confirms the actual start and dispute handling. Gross quoted fee, invoiced balance and collected cash are different values.
- Proposed three-calendar-month replacement guarantee: approve qualifying triggers, notice, exclusions, remedies and calendar-month boundary rules before promising it. Do not assume three months means 90 days or an automatic refund. The separate 90-day retention metric is not the guarantee.

### Illustrative ledger logic — specification only

Gross success fee = agreed eligible annual pay × agreed percentage / 100. Remaining invoice = gross success fee less eligible, actually allocated credits, subject to the approved tax/refund/rounding rules. Never produce a candidate debt or candidate-facing fee field. If credits exceed gross fees, flag the balance for the agreed refund/credit treatment rather than silently retaining it. Employer-only UI permissions alone are insufficient: API responses and accessible exports/logs must protect commercial/pay data too.

A future synthetic test must show that the same credit cannot be allocated twice, an excess credit gets an explicit outcome, cancellation/no-start cases follow approved terms and candidate principals cannot obtain fee data. Fee implementation requires separate approval; no schema or code was changed here.

## 2. Sponsor and partner routes — leads, not income

Official sources checked 25 October 2026. Research public business channels only; Neo reviews/sends approaches. No candidate records are shared merely to qualify a lead.

| Route                                                          | Evidence and limits                                                                                                                                                                                                                                                                                                                     | Next research deliverable                                                                                                                                                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| YES-participating employers / existing implementation partners | Known: YES describes 12-month quality work experiences and publishes programme-specific 18–35 eligibility. It distinguishes corporate sponsors and assessed implementation partners. Whether a particular organisation currently buys HiredFlex services is Unknown; participation is not a procurement signal or HiredFlex endorsement | Identify 10 relevant organisations around Gauteng with current primary-source participation/hiring/procurement evidence and official business contact channels; draft a one-page offer for Neo, not an automatic send |
| TVET colleges                                                  | Possible institution-funded career-readiness support; no college budget, purchase route or agreement verified                                                                                                                                                                                                                           | Prepare proposition, procurement/approval questions and student benefit evidence. External approach remains gated below                                                                                               |
| Company youth / CSI programmes                                 | Possible sponsor-funded delivery; no awards or open calls verified                                                                                                                                                                                                                                                                      | Find five programmes with current official eligibility, applicant/entity requirements, geography, permitted costs, deadlines and application route; mark closed/unknown honestly                                      |
| SETAs / other funders                                          | Possible route only; do not assume a grant is currently open or HiredFlex qualifies                                                                                                                                                                                                                                                     | Check the specific current call, registration/accreditation/partner requirements, eligible activities, permitted cost recovery and reporting before investing in an application                                       |

YES sources: [programme overview](https://www.yes4youth.co.za/), [journey and eligibility](https://www.yes4youth.co.za/yes-journey-milestones), [Turnkey/implementation model](https://www.yes4youth.co.za/turnkey-solutions), [official contact routes](https://www.yes4youth.co.za/contact-us). These support programme context, not a guaranteed B-BBEE benefit or HiredFlex funding entitlement. Any B-BBEE claim needs the actual programme/verification requirements checked; do not advertise automatic levels for using HiredFlex. An older official IP-vetting page mentions solvency/operating-history requirements; treat it as stale context and reverify current criteria rather than assert eligibility or ineligibility.

Do not carry programme-specific youth eligibility into general HiredFlex access or request race/health/ID data for lead generation. Any later necessary eligibility check requires its own lawful, minimised, authorised process and human review.

Track lead evidence → eligibility checked → proposal reviewed → owner actually sent → actual reply → agreement → invoice/payment conditions → cash received. Do not count drafts, sent pitches, website logos, source-linked jobs or sample vacancies as partner conversations. A signed agreement is not cash in the bank; restricted sponsorship is not unrestricted operating cash. No double-funding the same costs; record deliverables, permitted uses, reporting and refund/clawback conditions.

## 3. Free-usage caps — owner proposals, not published entitlements

| Service            | Proposed free allowance                               | Activation / measurement caveat                                                                                    |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| CV                 | One draft plus two revision rounds                    | Define a revision round and queue reset/appeal rules; independently review the exact final version before delivery |
| Cover letter       | Up to three per month, each for a real vacancy        | Define month boundary and verify a current advert; no fabricated job or guarantee                                  |
| LinkedIn           | One full review plus one follow-up                    | Define whether lifetime or per review cycle; never edit/send through the candidate's account without permission    |
| Mock interview     | One session; additional sessions when capacity allows | Define duration and allocation; service availability is not evidence of an automated interview feature             |
| ThothFlex AI coach | Monthly fair-use limit to be set from actual costs    | Not built; no provider, token allowance, spending or service availability inferred                                 |

Caps are queues, never candidate charges. Publish only after capacity and workflows exist. Apply a consistent rule, with documented accessibility accommodations and an appeal route; do not require sensitive details merely to ask for help. Correcting HiredFlex errors, unsupported invented claims or QA-required defects must not exhaust the candidate's revision allowance. Rework needed to meet the agreed original brief is different from a newly requested brief; define the distinction transparently. Optional sponsor marketing/talent-pool consent cannot buy priority or be required for the free service.

The proposed 48–72 hour turnaround is a target, not a guarantee. Define whether business or elapsed hours, start trigger, complete-evidence requirement, pauses and communications before publication; do not infer staff availability. Measure volume, queue age, operator/reviewer minutes, QA rework and actual AI/resource cost with synthetic or specifically authorised data. Review caps monthly; a limit does not authorise charging candidates for extra work. Pause or queue requests when capacity is exhausted rather than silently dropping the quality gate.

## 4. Thirty-day experiment — conditional sequence, not appointments made

Start the clock after Neo chooses to activate the experiment and dependencies are ready; no start date, meeting, call or revenue is recorded here.

| Week | Proposed work                                                                                                                               | Acceptance evidence / gate                                                                                                                                                                                                                                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Prepare fee/credit/refund options, cost/runway worksheet and lawyer questions; choose candidate amounts to test only after review           | Documented assumptions, capped spend decision, approved terms/testing approach. Neo books any adviser; no amounts filled by the agent                                                                                                                                                                                                     |
| 2    | Research 10 suitable YES-related employers/partners and prepare the pitch; Neo may approach after readiness and review. Aim for three calls | Public sources and eligibility/fit ledger; actual sent/reply/call evidence recorded separately. Targets are not achieved outcomes                                                                                                                                                                                                         |
| 3    | Research five youth/CSI routes and prepare the college pack                                                                                 | **Conflict / needs decision:** draft asks for a college meeting in Week 3, while existing approved sequencing requires three documented employer/recruiter replies or substantive conversations plus real relevant opportunities before college outreach. Preserve that gate unless Neo explicitly changes it; groundwork can proceed now |
| 4    | Review actual replies, objections, delivery capacity and costs; revise fee/cap proposals                                                    | No-response/refusal evidence counts as learning, not demand. Decide next test, pause or revised offer; do not treat the calendar as proof a gate passed                                                                                                                                                                                   |

College sponsorship/procurement outreach is also an external college approach under the retained gate; do not relabel it to bypass sequencing. No team appointment is activated while Neo is still contacting the team. Advance only the independent preparation meanwhile.

## 5. Cash and risk review

Record real unrestricted opening cash, unavoidable monthly costs, variable delivery costs, refund commitments, restricted sponsor balances and confirmed receipt dates. Use zero uncontracted sponsor/placement receipts in the conservative base scenario, and do not label unknown costs R0. Future received/restricted funds and expected agreements belong in separate columns. No runway calculation is reliable until those inputs exist.

| Risk                                         | Test / control                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Employers reject upfront payment             | Record objections from actual discussions; compare owner-approved lower-fee or first-posting-credit proposals without inventing demand         |
| Credits/refunds consume apparent cash        | Ring-fence potential refunds and reconcile receipts, allocated credits and liabilities before treating cash as spendable                       |
| Sponsor funds arrive late or are conditional | No assumed income; verify eligibility, written terms and actual payment. Avoid commitments dependent on an unawarded grant                     |
| Caps frustrate candidates                    | Clear queue/status notice, review monthly, protect error correction and independent QA; no hidden charges                                      |
| Unavailable team / paid AI or hosting costs  | Measure real capacity/cost first, respect owner budget and provider/commercial-plan gates; do not purchase or promise delivery                 |
| Unverified commercial/legal claims           | No blanket CV fee exemption, agency/YES status, automatic B-BBEE outcome, placement guarantee or verified-candidate label without its evidence |

## Next smallest action

Prepare a blank employer discovery sheet covering willingness to pay, preferred payment milestone, required shortlist quality, acceptable credit/refund terms and confirmation source. Acceptance: Neo can compare 3–5 actual employer responses without any live fee implementation or candidate-data sharing. Research and drafts can proceed while team/retention decisions are pending; outreach, paid advice and commercial terms remain Neo's actions/approvals.

## Blank employer-discovery record — ready to use, no responses recorded

Use one copy per organisation; preserve Unknown rather than inventing an answer. This is a discussion worksheet, not a quote or agreement.

| Field                                                   | Value / question                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Organisation / segment / official source / checked date | Unfilled                                                                           |
| Public business contact channel / source                | Unfilled; no personal contact harvesting                                           |
| Actual vacancy / service need / decision-maker role     | What concrete problem needs solving?                                               |
| Buying evidence / budget / approval process             | Unknown until stated by the employer                                               |
| Payment milestone preference                            | Posting/sourcing, delivered shortlist, confirmed start, or other employer response |
| Fee / percentage options presented                      | Unset; only Neo-approved test options                                              |
| Shortlist quality / scoped verification required        | What evidence and deliverable would make payment worthwhile?                       |
| Credit / cancellation / refund expectations             | Which payments should offset success fees and what happens if no hire occurs?      |
| Response / objection / source and date                  | No response recorded                                                               |
| Status / next action / owner                            | Research only until actual reviewed outreach/reply evidence exists                 |

Do not add a real candidate's CV, pay or personal identifiers to this discovery record. Do not treat discussion interest as a purchase commitment.
