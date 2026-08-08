# Project X — Product Roadmap

## Product direction

Build the verified creator-campaign operating system for Indian performance agencies. The first customer is an agency with multiple D2C clients—not a broad creator marketplace.

**Core promise:** run creator campaigns, prove delivery and revenue, and give clients a trustworthy closeout report without spreadsheets and WhatsApp follow-ups.

## What is working now

- Brand, agency, and creator workspace modes with role-aware registration.
- Agency command centre showing client campaigns, active creator work, committed spend, approved work, and closeout queue.
- Creator discovery, CRM/pipeline, campaign creation, outreach, negotiation, video-review workflow, attribution dashboard, analytics, and agent audit screens.
- AI/data-service settings for Gemini, OpenAI, VideoDB, RapidAPI, and YouTube. Keys are write-only in the browser.
- Gemini/OpenAI negotiation and VideoDB verification can use organization-specific keys.
- State-machine guardrails and human approval before the current payout flow.
- Production client build passes.

## Important truth about the current build

The following are demo/simulation capabilities and must not be sold as live production integrations yet:

- Razorpay payout is currently a mock transaction, not a money movement integration.
- Video verification returns simulation data when a VideoDB key is absent.
- Creator discovery includes seeded/fallback creator data when live source keys are absent.
- Shopify conversion events can be simulated; production Shopify authentication and verified webhook-signature handling are still needed.
- API authorization and tenant scoping are incomplete. Do not place real customer data or real payment credentials in a public deployment until this is fixed.

## Highest-priority product work

### P0 — Required before paid pilots

1. **Multi-tenant security**
   - Require authentication for workspace APIs.
   - Scope every campaign, deal, creator note, integration key, and report to `organization_id`.
   - Enforce agency/client roles and view-only client permissions.
   - Encrypt provider secrets at rest; add key rotation and audit logs.

2. **Client closeout report**
   - Shareable, branded, view-only URL for each campaign.
   - Campaign goal, approved creators/content, compliance evidence, spend, payment state, attributed revenue, ROAS, and next recommendation.
   - Export to PDF only after the web version is correct.

3. **Real payment integration**
   - Replace the mock payment agent with Razorpay RouteX/Payouts or an approved payment partner.
   - Creator KYC/bank or UPI collection, payout approval, webhook reconciliation, failure handling, and immutable receipt.
   - Have a CA/lawyer validate the tax and TDS workflow before claiming tax automation.

4. **Reliable commerce attribution**
   - Authenticate Shopify installation.
   - Validate webhook signatures and deduplicate orders.
   - Define attribution window/model and make it visible in reports.

### P1 — The agency advantage

1. Client portfolio with agency margin, invoicing state, due dates, and owner.
2. Client approval portal: creator shortlist, content review, comments, approvals, and approval history.
3. Creator mobile flow: offer, brief acknowledgement, deliverable upload, revision feedback, payout status, and tax receipt.
4. WhatsApp integration for creator reminders and one-click approval/acknowledgement.
5. Compliance checklist: ASCI disclosure, mandatory statements, product/logo visibility, prohibited claims, and evidence timestamps.

### P2 — Moat and growth

1. Creator Proof Graph: delivery reliability, compliance rate, paid rate range, performance outcomes, and repeat-collaboration quality.
2. Agency templates by vertical: beauty, fashion, food, fitness, electronics, and regional D2C.
3. Benchmarking using only consented, aggregated data.
4. UGC usage-rights tracking and creator-content licensing for paid ads.

## Recommended 90-day sequence

| Window | Outcome | Measure |
| --- | --- | --- |
| Weeks 1–3 | Secure multi-tenant core and make one end-to-end campaign real | No cross-organization data access; one real agency workspace |
| Weeks 4–6 | Ship client approval + closeout report | Agency can send a report without Excel/PowerPoint |
| Weeks 7–9 | Connect real Shopify and payout sandbox | Verified webhook, payout approval, reconciliation |
| Weeks 10–12 | Run 3 paid agency pilots | 3 agencies, 1 live campaign each, measurable time saved |

## Pilot customer profile

- India-based performance or creator agency
- 5–30 active D2C clients
- 30–300 creator activations per month
- Current workflow relies on spreadsheets, WhatsApp, and client slide decks
- Buyer: founder, operations head, or creator-marketing lead

## Pilot offer

"We set up one live client campaign, migrate its tracker, centralize creator delivery and approval, and produce a client-ready closeout report in 30 days."

Charge for the pilot. The initial price matters less than a clear commitment, real workflow access, and permission to publish a quantified case study.

## Metrics to track from day one

- Time from brief to approved creator shortlist
- Outreach-to-agreement rate
- On-time content delivery rate
- Revision rate and average approval-cycle time
- Days from verified content to creator payment
- Report creation time
- Attributed revenue, ROAS, and cost per acquired customer
- Agency gross margin per campaign

## What not to build yet

- A broad open marketplace.
- More generic AI agents without a measurable operational job.
- A giant creator database as the main differentiator.
- Complex forecasting before real campaign and conversion data is reliable.

## Current positioning

**Creator campaigns your clients can trust.**

For Indian performance agencies: plan, approve, verify, attribute, and pay creator campaigns from one client-ready workspace.
