# WhatsApp candidate intake — manual pilot preparation

Prepared 25 October 2026. Status: planned, not activated. Neo reports an existing vacancy group of 300+ people; count, membership and chats have not been inspected. He confirms candidate intake has not started. Google Forms remains deferred. No candidate/group data was exported, no messages sent, no WhatsApp account configured and no paid API/BSP provisioned.

## Boundary and next smallest implementation

Prepare a private, manual WhatsApp Business App intake to the existing Airtable operations schema. This is an operational pilot, not a WhatsApp API/webhook or application integration. Confirm business-number ownership, the actual app/account type, authorised staff, linked devices and backup/access settings before setup. Do not migrate or delete the existing personal account/group to make a pilot work. Neo performs device/account authentication. No new number, BSP subscription or paid service is authorised.

The first acceptance test uses one fictional request in a clearly labelled disposable context, with no real group members, CVs or phone numbers. A real intake starts only after owner-approved notice/schedule, provider/access checks and independent QA control have evidence. Configure labels/quick replies only after the account is identified; this document alone has not configured them.

## Manual process

1. Keep the vacancy group as a separate community. Do not scrape/export its roster, bulk-add people to Airtable, infer marketing/talent-pool permission, or ask people to post CVs/ID documents publicly. Any group invitation is a draft Neo reviews and sends himself.
2. Interested people initiate a private conversation with the verified business number. Present a short approved notice identifying the actual responsible party/contact, requested service, fields/purposes, tools/recipients, applicable retention and rights. Do not publish draft periods as effective promises.
3. Record the person's affirmative service choice and notice/consent version where consent is used. Ask optional talent-pool and marketing choices separately, default No. A refusal of optional choices does not block the requested service. If someone sends sensitive material before a notice, restrict it and follow the minimisation procedure; do not treat receipt as blanket consent.
4. Collect minimum preferred name, private contact channel, requested service, target role/link/deadline and relevant source-backed facts. No passwords, OTPs, full ID/bank details or unnecessary special information. No unsolicited CV attachments in the first dry run. A later approved document handoff needs restricted storage, verified recipients and redaction/retention controls.
5. An authorised operator manually creates/links a candidate and request in Airtable only after appropriate notice/lawful basis. Verify the intended existing candidate before linking; do not assume phone number equality authorises account merging. Store the minimal purpose/version/time/evidence reference. No automated transfer exists.
6. Progress the request through verification, evidence-backed drafting and independent QA. The drafter cannot approve the same CV version. Missing support for a claim remains a gap; no invention of qualifications or experience. Schema fields alone do not block delivery: a second human must check the same final version and record Approved, reviewer and timestamp before the operator releases it. Automated enforcement remains an engineering gap.
7. Confirm the private recipient before delivering an approved PDF/DOCX; record version, reviewer approval, delivery time and optional follow-up preference. No public group delivery, placement guarantee or fee collection in the pilot. Candidate-fee/legal classification questions remain in REGISTRATION-PREPARATION.md.
8. Reconcile the minimum service/consent evidence into the approved record; review transient chat/media and backups under RETENTION-POLICY-DRAFT.md. Do not claim deleting a local chat erases recipients' copies.

## Proposed Business App labels — not yet configured

New Lead → Notice Sent → Consent Recorded → Intake Received → Verifying → Drafting → In Review → Corrections Required / Approved → Delivered → Follow-up.

Labels are operational prompts, not access controls or a substitute for versioned QA/consent evidence. Delivered requires the human approval check above. Do not repurpose the platform's Applied/Reviewing/Shortlisted/Rejected/Withdrawn lifecycle as CV-service stages.

## Draft quick replies — review before use

| Key            | Unsent draft / preparation requirement                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Welcome        | Thanks for contacting HiredFlex. Please tell us which career service you want. Do not send identity numbers, passwords or documents yet; we will explain the process and data use first.                                                                |
| Privacy        | Insert the approved actual responsible party, contact and effective notice/schedule link or full notice text. **Blocked until approved; no invented public URL.**                                                                                       |
| Service choice | After the notice: Please confirm whether you want HiredFlex to process the necessary details for this specific request. Talent-pool retention and marketing are separate optional choices. Record the exact approved wording/version, not just a label. |
| Received       | We have received your request. We will check the supplied evidence, prepare a draft and arrange independent quality review before delivery. We will state missing information honestly.                                                                 |
| Evidence gap   | We need clarification or supporting evidence for [specific claim]. Until then it will not be described as verified. Please use the approved private handoff; do not post documents to the vacancy group.                                                |
| Delivery       | Insert the approved file/version and recipient check only after the independent review outcome is recorded. Invite corrections; do not guarantee employment.                                                                                            |

## Proposed Airtable additions — no live schema change

Use existing Candidates, CV Requests, Documents and Team Tasks. Map current field names before changes. Add or map notice/schedule versions, purpose/lawful basis, service consent time/evidence, separate talent-pool/marketing choices, withdrawal scope/time, source/draft version, independent reviewer/outcome/time, delivery evidence, restriction/hold and retain-until. Avoid duplicating consent evidence into every note/attachment. Exact field types, roles and current content remain to be inspected before configuration.

## Acceptance checklist — not executed

- [ ] Neo identifies the business number/account type and authorises the named operators privately; no credentials posted to GitHub.
- [ ] Appropriate officer/responsible party, notice/schedule, provider settings and fee/service boundary are resolved for the proposed pilot.
- [ ] One fictional person/request moves through the actual configured tools with an exact notice/choice/version/time reference; optional choices remain No unless separately selected.
- [ ] Attempts to mark delivery before an independent reviewer approves the same version are stopped by the recorded human checklist; label/Stage alone cannot authorise sending.
- [ ] Reviewer returns unsupported content, corrections get a new version and approval precedes fictional delivery.
- [ ] A fictional withdrawal/rights request and staff offboarding are handled with an inventory and recorded decisions, without erasing a legal hold.
- [ ] Provider deletion/backup limitations and incident escalation are rehearsed with synthetic material; no real candidate data used.

## Inputs from Neo

Actual WhatsApp Business App versus ordinary WhatsApp, privately confirmed business number ownership, named reviewer/operator and notice/retention choices. Existing group size is not an intake count. Google Forms and API/BSP work are deferred until separately approved; no automatic synchronisation is claimed.
