---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-TP-FOS-2026-02-05.md
  - user-data/user-prd.md
  - user-data/user-summarize.md
  - user-data/design-system.md
  - user-data/tp-mails.md
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 3
  projectDocs: 0
classification:
  projectType: web_app
  domain: operational_finance
  complexity: medium
  projectContext: greenfield
workflowType: 'prd'
---

# Product Requirements Document — TP-FOS

**Author:** Galelbaz
**Date:** 2026-02-05

## Executive Summary

**Tailor Played Financial OS (TP-FOS)** is an internal financial operations dashboard for Tailor Played — a bespoke board game manufacturing business. It provides real-time unit economics per project, full overhead visibility, and AI-powered financial document ingestion.

**The Problem:** Standard accounting tools (Summit for receipts, Paperless for tax compliance) track legal obligations but are blind to per-project profitability. Bulk purchases can't be allocated to specific games. There is no distinction between business investment and cost of goods sold. The result: the business operators cannot determine the true net profit of any individual game project.

**The Solution:** TP-FOS is an operational intelligence layer that sits alongside existing accounting tools. It intercepts financial documents via email, processes them through Gemini AI, and presents pre-classified transactions for rapid human review. Work Orders link revenue to all cost types. A lightweight inventory system tracks shared materials using Weighted Average Cost. Everything rolls up to a dashboard showing real margins, a tax reserve jar, and overhead burn.

**Key Differentiators:**
- **Parallel Fork Pattern** — Documents split at the email level: originals flow untouched to the accountant (Paperless), copies go to FOS for AI processing. FOS is never a gatekeeper.
- **Ghost Text Approval UX** — AI pre-fills all fields; the human confirms or corrects. "Correct what's wrong" vs. "enter what's right."
- **Bespoke Manufacturing Unit Economics** — Purpose-built for a business where every product is unique, with a mix of direct costs, shared inventory, and overhead.

**Users:** Gal (financial operator, primary user) and Ben (business owner, decision consumer). Single internal tool — no public access, no multi-tenant complexity.

**Project Classification:**
- **Type:** Web Application (React SPA + Firebase backend)
- **Domain:** Operational Finance / Business Intelligence
- **Complexity:** Medium
- **Context:** Greenfield

## Success Criteria

### User Success

| Criteria | Target | What It Means |
|---|---|---|
| **Decision Readiness** | Brief Ben on any project's financial status in < 60 seconds | Open dashboard, see margin, overhead, tax jar — know the answer |
| **Invoice Processing** | < 30 seconds per item (confirm/reject AI suggestion) | Ghost Text review, not manual data entry |
| **Morning Review** | < 5 minutes for full daily financial picture | Pending items + project health + overhead check |
| **Zero Double Entry** | Every financial document enters the system ONCE | One ingestion point forks to both Paperless and FOS — never re-type |
| **Financial Trust** | 100% confidence that dashboard numbers reflect reality | No orphan invoices, no unclassified costs, no hidden expenses |

### Business Success

| Timeframe | Objective | Success Signal |
|---|---|---|
| **Month 1** | System is the single source of financial truth | Every active project has a live Nutrition Label. Gal stops using spreadsheets/mental math. |
| **Month 3** | Full automation pipeline live | Invoices flow in via email, get AI-classified, fork to accountant. Zero manual forwarding. |
| **Month 6** | Complete financial confidence | Ben asks "can I buy X?" — Gal answers from the dashboard in under a minute, with data, not gut feel. |

### Technical Success

| Criteria | Target |
|---|---|
| **Data Accuracy** | WAC calculations accurate within 1%. Margin calculations match manual verification. |
| **AI Classification** | > 90% confidence on invoice classification. Misclassification never corrupts financial picture (always requires human confirm). |
| **Pipeline Integrity** | Zero lost documents. Every email that enters the system is tracked, classified, or flagged. |
| **Dashboard Responsiveness** | < 2 second load time. Real-time updates after confirming transactions. |

### Measurable Outcomes

- **The Litmus Test:** If Gal still needs to open Summit AND Paperless AND a spreadsheet to answer a financial question, FOS has failed.
- **The Ben Test:** If Ben can't get a clear "yes/no/wait" on a spending decision from a 60-second dashboard glance, FOS has failed.
- **The Trust Test:** If at any point the dashboard shows a profitable project that's actually losing money (or vice versa), FOS has failed.

## Product Scope

### MVP — Complete System

The MVP is the **full system**. No artificial phasing. All core capabilities fully built:

1. **Dashboard** — Real-time KPIs: Net Profit, Tax Jar (configurable: flat 35% or bracket-based), Active Projects, Project Health Table with margin color coding (green/yellow/red at < 20%)
2. **Work Orders** — Full CRUD, Nutrition Label with live margin calculation, status tracking (Lead → Design → Production → Shipped), revenue and cost linkage
3. **Email Ingestion Pipeline** — Gmail API + Pub/Sub → Cloud Functions → Gemini 2.5 Pro parsing → structured JSON into Firestore. Bilingual (Hebrew + English). Designated mailboxes: `orders@`, `supplies@`, `developing@`, `expenses@`
4. **Auto-Fork to Paperless** — Gmail filters forward original, untouched documents to accountant. FOS is a parallel consumer, never a gatekeeper
5. **Ghost Text Review UI** — AI pre-filled fields, confirm with Enter, edit when needed. Single item review AND batch "Approve All" for high-confidence items (≥ 85%)
6. **Inventory + WAC** — Full inventory tracking, weighted average cost recalculation on restock, Scoop action to consume materials into Work Orders with automatic COGS calculation
7. **Overhead Tracking** — Subscriptions, software, meals, office expenses. Full category breakdown view
8. **Tax Jar** — Configurable: flat conservative rate (35%) or Israeli progressive bracket-based calculation. Osek Patur threshold alert when approaching ₪120,000 annual revenue
9. **Forward Financial Projection** — Cash flow impact modeling. "Can we afford this?" view looking months ahead at revenue, expenses, and buffer
10. **Full i18n** — Hebrew (RTL) + English (LTR) UI. Multi-currency (ILS/USD/EUR) with conversion flagging and rate documentation
11. **Full Mobile Support** — Complete feature parity across desktop and mobile
12. **Confidence Flagging** — Yellow badge for AI confidence < 85%, currency conversion "Estimated" flags, new/unrecognized vendor handling

All five user journeys supported from day one.

### Post-MVP (Growth)

- Supplier risk scoring and damage tracking
- Historical margin comparisons (expected vs. actual per game type)
- Predictive pricing from historical project data
- PDF reports / accountant-formatted summaries
- Automated tax jar alerts at threshold levels

### Vision (Future)

- Client profitability history (lifetime value per client)
- Direct API integration with Summit (bypass email for revenue sync)
- Multi-project scenario planning ("if I take this order at X price, what happens to my margins?")

## User Journeys

### Journey 1: Gal — The Morning Review (Primary User, Success Path)

**Opening Scene:**
8:30 AM. Gal opens FOS. Overnight, two vendor invoices arrived — one from Game Crafter (English, direct components), one from a local packaging supplier (Hebrew). The AI agent already processed both: parsed PDFs, extracted vendor/amount/date/currency, classified them (Direct Cost → David's Game; Inventory → packaging stock), forwarded copies to Paperless, and created pending review items in FOS.

**Rising Action:**
Gal sees 2 pending items. First: "Game Crafter, $142.50 USD, Direct Cost → David's Game, Confidence: 94%." Enter. Second: "אריזות דוד, ₪280, Inventory → Packaging Stock, Confidence: 88%." Enter. Both confirmed in under 30 seconds.

Dashboard check: David's Game at 42% margin (green). Tax Jar: ₪12,400. Active projects: 3. Overhead: ₪3,200/month.

**Climax:**
"Rina's Wedding Game" shows 18% margin — red. Drill into Nutrition Label: rush shipping fee spiked direct costs. This project needs no more spending, or the next invoice needs to be higher.

**Resolution:**
Total time: 4 minutes. Gal messages Ben: "David's game is healthy, Rina's is tight — don't order anything for her until I review the quote. You can grab that resin refill, we have headroom."

**Capabilities Revealed:** Dashboard KPIs, Ghost Text review, bilingual AI parsing, Nutrition Label drill-down, margin alerts, real-time cost updates.

---

### Journey 2: Ben — The Physical Receipt (Edge Case, Mid-Day Flow)

**Opening Scene:**
2 PM. Ben buys gift wrapping paper and specialty glue at a store — ₪95. He snaps a photo and emails it to `supplies@tailorplayed.com`.

**Rising Action:**
AI agent processes the Hebrew receipt image: "חנות אומנות, ₪95, Supplies." Classification: "Direct Cost → Current Active Project" at 78% confidence (low — physical store receipt). Auto-forwards to Paperless. Creates pending review item flagged yellow.

**Climax:**
Gal opens FOS later, sees yellow-flagged item. AI's project guess is uncertain. Gal edits the project field to Rina's Wedding Game, confirms. Nutrition Label updates instantly.

**Resolution:**
Ben never thought about bookkeeping. Gal spent 15 seconds. Accountant got the document automatically.

**Capabilities Revealed:** Photo receipt flow, Hebrew OCR, confidence flagging, editable Ghost Text, auto-fork to Paperless.

---

### Journey 3: Gal — The Spending Decision (Forward Projection)

**Opening Scene:**
Ben: "Found a deal on premium card stock — ₪2,800 bulk order, lasts 6 months. Can we do it?"

**Rising Action:**
Gal checks FOS: Net Profit ₪8,200. Tax Jar: ₪2,870. Overhead: ₪3,200/month. Two projects shipping next month (revenue incoming), one in production.

Forward projection: ₪2,800 hits cash position now, but inventory consumed across future projects via Scoops. One-time investment, not recurring. Tax Jar unaffected until stock consumed into COGS.

**Climax:**
After the purchase, enough buffer for next month's overhead and Tax Jar. Shipping projects bring ₪14,000 revenue. Bulk saves ₪1,700 vs. individual orders over 6 months.

**Resolution:**
"Go for it. We have headroom, and it saves us ₪1,700." Decision made with data.

**Capabilities Revealed:** Forward projection, overhead vs. investment distinction, Tax Jar impact, inventory cost modeling, cash flow analysis.

---

### Journey 4: Gal — Batch Processing After a Busy Week (Approve All)

**Opening Scene:**
Gal returns after 4 days at a game convention. 11 pending review items. AI processed everything; documents already forwarded to Paperless.

**Rising Action:**
9 items green (≥ 85% confidence), 2 yellow. Gal scrolls through green items — all correct. Hits **"Approve All"**. Done in 10 seconds.

**Climax:**
Focuses on 2 yellow items: one currency conversion flag (USD, "Estimated"), one unrecognized vendor. Verifies and assigns manually.

**Resolution:**
11 items in under 3 minutes. All margins updated. Accountant had everything via Paperless throughout.

**Capabilities Revealed:** Batch approval, confidence filtering, currency flags, new vendor handling, system resilience during absence.

---

### Journey 5: The Accountant — Passive Document Flow

The accountant opens Paperless to find documents from Tailor Played already there — auto-forwarded via Gmail filters throughout the week. Processes them normally. Never aware FOS exists.

**Capabilities Revealed:** Auto-forwarding to Paperless, zero-touch, transparent integration.

---

### Journey Requirements Summary

| Journey | Key Capabilities |
|---|---|
| **Gal - Morning Review** | Dashboard KPIs, Ghost Text review, bilingual AI, Nutrition Label, margin alerts |
| **Ben - Physical Receipt** | Photo receipt via email, Hebrew OCR, confidence flagging, editable fields, auto-fork |
| **Gal - Spending Decision** | Forward projection, cash flow modeling, overhead analysis, Tax Jar impact |
| **Gal - Batch Processing** | Approve All, confidence filtering, currency flags, new vendor handling |
| **Accountant - Passive** | Auto-forward to Paperless, zero-touch integration |

## Domain-Specific Requirements

### Compliance & Regulatory

- **Osek Patur status**: No VAT (Ma'am) obligations. No VAT calculations in FOS. Track proximity to ₪120,000 annual revenue threshold; alert when approaching (transition to Osek Murshe changes tax obligations significantly).
- **Income Tax**: Progressive bracket system (2026: 10%/14%/20%/31%/35%/47%/50%). Tax Jar configurable — flat conservative (35%) or bracket-based. Default: conservative.
- **Bituach Leumi**: National Insurance contributions factored into overhead or tracked separately.
- **No invoicing compliance required** for FOS — Summit handles invoice generation, Paperless handles accountant compliance.

### Technical Constraints

- **Bilingual processing**: AI agent parses Hebrew and English documents with equal reliability. UI supports RTL (Hebrew) and LTR (English) content in the same view.
- **Multi-currency**: ILS base currency. USD and EUR common. Non-ILS amounts flagged as "Estimated" with conversion rate documented.
- **Document integrity**: Original documents forwarded to Paperless are untouched — no AI modification, no compression, no format conversion.

### Integration Architecture

- **Email fork**: Gmail filters forward originals to Paperless. Gmail API + Pub/Sub triggers Cloud Functions for FOS ingestion. FOS is a parallel consumer, never a gatekeeper. If FOS is down, Paperless still gets documents.
- **Summit**: Receipt generation triggers email notification. FOS ingests for revenue tracking.
- **Paperless**: Receives original documents via Gmail filter forwarding. Zero direct integration with FOS.
- **Gemini 2.5 Pro**: Processes document copies (not originals). Outputs structured JSON. Handles Hebrew OCR, English OCR, mixed-language, and photo receipts.

## Innovation & Novel Patterns

TP-FOS is a **smart integration** of known patterns applied to an underserved niche. Innovation lies in the combination:

1. **Parallel Fork Pattern**: Documents fork at email level — originals to Paperless untouched, copies to FOS for AI. Solves double-entry without single point of failure.
2. **Ghost Text Approval UX**: AI fills everything, human confirms. "Correct what's wrong" vs. "enter what's right." Optimized for 2-5 items/day.
3. **Bespoke Manufacturing Unit Economics**: Vendor invoices → specific game projects → shared inventory (WAC) → revenue. Purpose-built for unique-product manufacturing.

**Validation:**
- Parallel Fork: Test Paperless receives documents with FOS both online and offline.
- Ghost Text: Measure time-to-confirm vs. manual entry. Target: < 30s vs. 2-3 min.
- Unit Economics: Manual margin calculation for 2-3 real projects must match FOS Nutrition Label within 1%.

## Web App Technical Requirements

### Architecture

| Decision | Choice | Rationale |
|---|---|---|
| **Framework** | React (SPA) | Client-side rendering. No Next.js — simpler for internal tool. |
| **Backend** | Firebase (Firestore + Cloud Functions + Auth) | Real-time database, serverless AI processing, Google Auth. |
| **AI** | Gemini 2.5 Pro via Cloud Functions | 1M token context, structured output, function calling. Server-side to protect keys. |
| **Email Automation** | Gmail API + Cloud Functions + Google Pub/Sub | Google Workspace tools already available. No third-party services. |
| **Hosting** | Firebase Hosting or Vercel | Static SPA deployment. |
| **State Management** | React Context or Zustand | Lightweight. No Redux complexity for 2 users. |

### Browser & Device Support

| Target | Requirement |
|---|---|
| **Desktop** | Chrome/Edge (latest 2 versions) |
| **Mobile** | Chrome Android, Safari iOS. Full feature parity. |
| **Tablet** | Supported via responsive design |
| **Minimum Viewport** | 375px (mobile) to 1280px+ (desktop) |
| **Offline** | Not required |

### Responsive Design

- **Desktop (1024px+)**: Full layout — sidebar nav, KPI cards, Project Health Table, Review Sidebar visible simultaneously.
- **Tablet (768px–1023px)**: Collapsible sidebar, stacked KPIs, scrollable table.
- **Mobile (375px–767px)**: Bottom navigation, single-column, swipe-able KPI cards, full-screen Ghost Text review. All actions available.

### Internationalization

| Requirement | Detail |
|---|---|
| **Languages** | Hebrew (primary), English (secondary) |
| **RTL/LTR** | Full RTL for Hebrew. LTR for English content within RTL layout. |
| **Currency** | ILS (₪) base. USD ($), EUR (€) with conversion flagging. |
| **Date Format** | DD/MM/YYYY (Israeli standard) |
| **Numbers** | Israeli convention (1,234.56) |

### Auth & Security Model

- Firebase Auth with Google Sign-in. 2 whitelisted UIDs only.
- Firestore rules: read/write restricted to admin UIDs.
- Cloud Functions: all API keys server-side, never client-exposed.
- Firebase Storage: same UID-restricted rules for document files.

### Explicitly NOT Required

- SEO / search engine indexing
- WCAG accessibility compliance
- Server-side rendering
- Offline/PWA capabilities
- Push notifications
- Legacy browser support
- Third-party automation services (Make.com, Zapier)

## Project Scoping & Development Strategy

### MVP Strategy

**Approach:** Complete-system MVP. Every module depends on every other module to deliver zero double-entry, accurate margins, and decision-ready financial intelligence. No useful subset works without the full pipeline.

**Developer:** Single senior full-stack developer (Gal).

### Build Priority (Recommended Sequence)

Optimized for early validation of riskiest components:

1. **Email → AI Pipeline** (highest risk) — Gmail API + Pub/Sub + Cloud Functions + Gemini 2.5 Pro. Validate bilingual parsing with real receipts.
2. **Firestore Data Model** — Transactions, Work Orders, Inventory, Overhead collections.
3. **Dashboard + Work Orders + Nutrition Label** — Core UI consuming the data.
4. **Ghost Text Review UI** — Single item + batch approval.
5. **Inventory + WAC + Scoop** — Math engine and consumption tracking.
6. **Overhead + Tax Jar + Projections** — Financial intelligence layer.
7. **i18n + Mobile Polish** — Hebrew/English and responsive refinement.

### Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Gmail → Gemini pipeline complexity | Core system blocked | Build and validate ingestion first. If pipeline works, rest is UI. |
| Gemini Hebrew OCR reliability | Misclassified invoices | Test with real Hebrew receipts early. Fallback: manual entry for failed parses. |
| WAC rounding over time | Margin drift | High-precision arithmetic. Validate against manual calculations. |
| Gmail/Cloud Functions automation fails | Email processing stops | Manual forwarding backup. Unprocessed items stored for retry. |
| AI confidence too low | Ghost Text unusable | Graceful degradation to manual entry with AI hints. |
| RTL/LTR mixed content | Broken layouts | Test bilingual scenarios early. CSS logical properties throughout. |
| Currency conversion stale | Cost calculations off | Flag as "Estimated", show rate used. Last-known-rate fallback. |
| Osek Patur threshold exceeded | Must switch to Osek Murshe | Dashboard alert when approaching ₪120,000. |

## Functional Requirements

### 1. Dashboard & Financial Intelligence

- **FR1:** Gal/Ben can view real-time Net Profit for the current month
- **FR2:** Gal/Ben can view the Tax Jar reserve amount (configurable: flat 35% or progressive brackets)
- **FR3:** Gal/Ben can view a count of active projects (Work Orders in Production status)
- **FR4:** Gal/Ben can view a Project Health Table with client name, status, revenue, cost, and margin percentage
- **FR5:** Gal/Ben can identify at-risk projects through color-coded margin indicators (green/yellow/red at < 20%)
- **FR6:** Gal can view a forward financial projection showing cash flow impact of a potential purchase over upcoming months
- **FR7:** Gal/Ben can view monthly overhead burn by category (subscriptions, software, meals, office)
- **FR8:** Gal/Ben can receive an alert when annual revenue approaches the ₪120,000 Osek Patur threshold
- **FR9:** Gal can configure the Tax Jar calculation method (flat rate vs. bracket-based)

### 2. Work Order Management

- **FR10:** Gal can create a Work Order with client name, project details, and status
- **FR11:** Gal can update Work Order status (Lead → Design → Production → Shipped)
- **FR12:** Gal can view the Nutrition Label: Revenue, Direct Costs, Inventory Costs (Scoops), Overhead Allocation, Unforeseen Buffer (5%), Net Profit
- **FR13:** Gal can link revenue (Summit receipts) to a Work Order
- **FR14:** Gal can link direct costs (vendor invoices) to a Work Order
- **FR15:** Gal can view margin calculations that update immediately when costs or revenue change

### 3. Document Ingestion & AI Processing

- **FR16:** The system detects new emails in designated mailboxes (`orders@`, `supplies@`, `developing@`, `expenses@`)
- **FR17:** The system processes email attachments (PDF, JPG, PNG) and HTML content through Gemini 2.5 Pro
- **FR18:** The system extracts structured data from Hebrew and English documents (vendor, date, amount, currency, line items)
- **FR19:** The system classifies transactions into categories (Direct Cost, Inventory Restock, Overhead, Personal) with confidence scores
- **FR20:** The system suggests Work Order or Inventory item associations for classified transactions
- **FR21:** The system processes photo receipts (camera captures) via email with the same reliability as PDFs
- **FR22:** The system handles multi-currency documents (ILS, USD, EUR) and flags non-ILS amounts as "Estimated"

### 4. Transaction Review & Approval

- **FR23:** Gal can view all pending review items in a dedicated interface
- **FR24:** Gal can see AI-suggested classifications as pre-filled editable fields (Ghost Text)
- **FR25:** Gal can confirm a suggestion with a single action (Enter key)
- **FR26:** Gal can edit any field before confirming (vendor, amount, category, project)
- **FR27:** Gal can reject a transaction (irrelevant / personal)
- **FR28:** Gal can view confidence indicators — green (≥ 85%) or yellow (< 85% "Check Me")
- **FR29:** Gal can batch-approve multiple high-confidence items ("Approve All")
- **FR30:** Gal can browse pending items before batch-approving
- **FR31:** The system updates all financial data (Nutrition Labels, KPIs, Tax Jar) immediately upon approval

### 5. Inventory Management

- **FR32:** Gal can create and manage inventory items (name, SKU, supplier, quantity, reorder threshold)
- **FR33:** Gal can record restocks with quantity and cost, triggering WAC recalculation
- **FR34:** Gal can Scoop materials into a Work Order — search material, input quantity, auto-calculate cost via WAC
- **FR35:** The system prevents over-drafting (shows remaining stock during Scoop)
- **FR36:** The system maintains an audit log of all inventory actions with cost snapshots and Work Order references
- **FR37:** Gal can log waste/scrap with cost impact on relevant Work Orders

### 6. Overhead & Expense Tracking

- **FR38:** Gal can view overhead expenses by category (subscriptions, software, meals, office, general)
- **FR39:** Gal can manually create overhead entries with category, amount, date, and recurrence
- **FR40:** The system auto-categorizes overhead from AI-classified transactions (developing@/expenses@ mailboxes)
- **FR41:** Gal can view monthly overhead burn rate and trend

### 7. Accountant Integration

- **FR42:** The system auto-forwards original, untouched documents to Paperless
- **FR43:** Paperless forwarding operates independently — FOS downtime doesn't affect document delivery
- **FR44:** The system tracks forwarded documents for audit purposes

### 8. System & User Management

- **FR45:** Gal and Ben authenticate via Google Sign-in
- **FR46:** Only 2 whitelisted accounts can access the system
- **FR47:** Full system available in Hebrew (RTL) or English (LTR)
- **FR48:** All actions available on desktop and mobile with full feature parity
- **FR49:** Financial data displays in ILS with USD/EUR showing original and converted values

## Non-Functional Requirements

### Performance

| Requirement | Target | Context |
|---|---|---|
| **Dashboard initial load** | < 3s desktop, < 5s mobile (4G) | First meaningful paint with KPIs |
| **Post-action refresh** | < 2s | KPIs and Nutrition Labels update after confirm |
| **Ghost Text load** | < 1s per item | Pre-filled fields appear instantly |
| **AI processing** | < 30s email-to-pending | Gemini parse + JSON + Firestore write |
| **Scoop calculation** | < 500ms | WAC cost calculation |

### Security

| Requirement | Detail |
|---|---|
| **Auth** | Google Sign-in, 2 whitelisted UIDs only |
| **Firestore** | Read/write restricted to admin UIDs |
| **API keys** | Server-side only (Cloud Functions env vars) |
| **Storage** | UID-restricted access rules |
| **Transit** | HTTPS enforced (Firebase default) |
| **Data boundary** | Financial data never leaves Firebase except Paperless forwarding |

### Data Integrity

| Requirement | Detail |
|---|---|
| **Precision** | Currency stored as integers (agora/cents). High-precision WAC arithmetic. |
| **Zero loss** | Every email tracked. Failed AI parses preserved and flagged — never silently dropped. |
| **Audit trail** | All inventory, transaction, and Work Order changes logged with timestamps and before/after. |
| **Referential** | Every transaction links to source document. Every Scoop links to item and Work Order. |
| **Backup** | Firestore automatic backups with point-in-time recovery. |

### Integration Reliability

| Requirement | Detail |
|---|---|
| **Gmail API** | Unavailable → emails queue in Gmail, retry on next Pub/Sub trigger. No loss. |
| **Gemini API** | Error/timeout → document stored as "unprocessed", original preserved, manual entry fallback. |
| **Paperless** | Gmail filters handle forwarding independently. FOS downtime doesn't affect delivery. |
| **Currency API** | Unavailable → last known rate, flagged "Rate may be stale." Never blocks processing. |
