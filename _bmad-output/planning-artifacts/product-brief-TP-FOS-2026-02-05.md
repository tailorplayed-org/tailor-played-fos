---
stepsCompleted: [1, 2, 3, 4, 5, 6]
status: complete
inputDocuments:
  - user-data/user-prd.md
  - user-data/user-summarize.md
  - user-data/design-system.md
  - user-data/design-system-template.html
date: 2026-02-05
author: Galelbaz
---

# Product Brief: TP-FOS

## Executive Summary

Tailor Played Financial OS (TP-FOS) is an internal operational intelligence layer for Tailor Played — a bespoke board game manufacturing business. It sits above existing legal accounting tools (Summit for revenue receipts, Paperless for tax compliance) to provide what they cannot: real-time unit economics per project, full overhead visibility, and AI-powered financial ingestion.

The system acts as an "Intelligent Router" — intercepting financial emails, auto-forwarding to the accountant for legal compliance, and simultaneously parsing invoices via Gemini AI to classify costs as Direct (per-project), Inventory (shared stock), or Overhead (subscriptions, software, meals). The business owner reviews AI-suggested classifications in under 30 seconds per invoice, and the dashboard instantly reflects true profitability per game.

This is a personal-use internal tool, built for a single admin user (the business owner), designed to replace manual mental math and spreadsheet guesswork with a real-time financial cockpit.

---

## Core Vision

### Problem Statement

Standard accounting software tracks legal compliance (tax/VAT) but is fundamentally blind to unit economics in a bespoke manufacturing context. Specifically:

- **Blind Spot 1 — Cost Allocation:** Bulk purchases (e.g., 500 dice) cannot be allocated to the specific client project that consumed them. The cost sits as a lump sum, invisible at the project level.
- **Blind Spot 2 — Cost Classification:** There is no distinction between "Business Investment" (buying a 3D printer) and "Cost of Goods Sold" (printing a specific figure for a client). Everything is just an "expense."
- **Blind Spot 3 — Overhead Blind Spot:** Recurring costs like software subscriptions (Cursor, Adobe, Vercel), office expenses (meals, coffees), and service fees are tracked for tax purposes but never contextualized against revenue.

The result: the business owner cannot determine the true net profit of any individual game project, nor understand the full cost structure of the business at a glance.

### Problem Impact

- Pricing decisions are based on gut feeling rather than data — risking underpriced projects that erode margins
- Profitable vs. unprofitable projects are indistinguishable until it's too late
- Double data entry across accounting tools and manual tracking wastes time
- No visibility into whether overhead is sustainable relative to revenue
- Tax obligations are estimated rather than tracked in real-time (the 35% marginal tax "jar")

### Why Existing Solutions Fall Short

| Tool | What It Does | What It Misses |
|---|---|---|
| **Summit** | Legal receipts / outgoing invoices (revenue) | Cannot link revenue to project-level costs |
| **Paperless** | Tax compliance / accountant interface | No operational intelligence, no per-project view |
| **Spreadsheets** | Manual tracking (ad-hoc) | Stale data, no automation, high friction, error-prone |

No existing tool in the ecosystem connects the dots between a vendor invoice, the project it serves, the inventory it replenishes, and the revenue it ultimately supports. That connection is what TP-FOS provides.

### Proposed Solution

TP-FOS is structured around four core modules:

1. **The Dashboard (Cockpit)** — Real-time KPIs: Net Profit, Tax Jar (35% reserve), Active Projects, and a Project Health Table with margin alerts (red if < 20%).

2. **Work Orders (The Nutrition Label)** — Every client project is a container linking revenue (from Summit) to all cost types: direct purchases, inventory consumption ("Scoops"), labor, overhead allocation, and an unforeseen buffer (5%).

3. **Virtual Warehouse (Inventory/WAC)** — Lightweight inventory management using Weighted Average Cost. The "Scoop" action lets the owner consume shared stock into a project, automatically calculating COGS.

4. **AI Ingestion Agent (The Interceptor)** — Gemini-powered email parsing that intercepts financial documents, auto-forwards to the accountant, and creates pre-classified transaction records for rapid owner review ("Ghost Text" UI — confirm with Enter).

Plus full overhead tracking for subscriptions, software, meals, and office expenses — all visible in one place alongside per-game economics.

### Key Differentiators

- **AI-First, Not Manual-First:** Invoices are parsed and pre-classified by Gemini before the owner ever sees them. Review time target: < 30 seconds per invoice.
- **The "Interceptor" Pattern:** A single ingestion email eliminates double data entry — one input, two outputs (accountant + ops system).
- **Unit Economics for Bespoke Manufacturing:** Purpose-built for a business where every product is unique, with a mix of direct costs, shared inventory, and overhead.
- **Ghost Text UX:** AI suggestions appear as pre-filled fields. Confirm with Enter. No forms to fill, no dropdowns to hunt through.
- **Tax Jar Awareness:** The 35% marginal tax reserve is always visible, reminding the owner of money that isn't really "theirs."
- **Internal Tool Simplicity:** Single-user, single-admin. No roles, permissions complexity, or multi-tenant overhead. Built lean, built fast.

---

## Target Users

### Primary Users

**Persona: Galelbaz — Business Owner & Operator**

- **Role:** Sole owner-operator of Tailor Played, a bespoke board game manufacturing company. Handles everything from client relationships and game design to procurement, production, and financial management.
- **Environment:** Works across creative and operational contexts daily. Financial decisions happen between design sessions and supplier calls — not in a dedicated "accounting hour."
- **Motivation:** Wants to run a profitable, growing business with clear financial visibility. Needs to know not just "am I making money?" but "can I afford to invest more?" — in better supplies, marketing, food for the office, or scaling production.
- **Current Pain:**
  - Manually piecing together project costs across multiple tools and memory
  - No real-time visibility into per-game profitability
  - Unable to confidently answer "can I spend more here?" without fear of overextending
  - Tax obligations are estimated rather than tracked, creating low-grade financial anxiety
- **Workarounds Today:** Mental math, occasional spreadsheet tallies, gut-feel pricing, checking Summit and Paperless separately and trying to connect the dots manually.
- **Success Vision:** Opens TP-FOS with morning coffee. In under 5 minutes: reviews any pending invoices (confirm with Enter), checks project margins, glances at overhead burn, and sees the Tax Jar. Walks away knowing exactly where the business stands — and whether there's room to invest in growth.
- **"Aha" Moment:** The first time the dashboard shows that a project they thought was profitable is actually under 20% margin because of uncounted inventory consumption — and simultaneously shows there's headroom in the overhead budget to upgrade supplies.

### Secondary Users

**The Accountant (Passive/Indirect)**

- Never logs into TP-FOS. Receives auto-forwarded expense documents via the Interceptor email routing.
- Benefits from a cleaner, automated flow of documents rather than manual forwarding.
- No UI requirements, no access needed. Purely a downstream recipient.

No other users. This is a deliberate **one-person cockpit** — single admin, single viewer. Multi-user complexity is explicitly out of scope.

### User Journey

**Daily Ritual — "The Morning Coffee Review"**

1. **Open Dashboard** — See top-line KPIs: Net Profit (month), Tax Jar, Active Projects count.
2. **Review Pending Items** — Sidebar shows 2-3 AI-classified invoices from yesterday. Ghost Text pre-fills vendor, amount, category, and suggested project. Confirm each with Enter (< 30 seconds per item).
3. **Check Project Health** — Scan the Project Health Table. Green margins = good. Yellow = watch. Red (< 20%) = investigate.
4. **Assess Financial Headroom** — Overhead view shows monthly burn on subscriptions, software, meals, office. Compare against revenue trend. Answer the question: "Can I spend more?"
5. **Close & Go** — 5 minutes. Full financial clarity. Back to making games.

**First-Time Experience — "The Setup"**

1. Deploy the app (Next.js + Firebase).
2. Connect the ingestion email (finance@tailorplayed.com) via Make.com.
3. Create first Work Order manually — enter a current project's revenue and known costs.
4. Watch the Nutrition Label calculate. See the margin. Feel the clarity.
5. First AI-ingested invoice arrives. Review the Ghost Text suggestion. Hit Enter. Realize this changes everything.

---

## Success Metrics

### User Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| **Invoice Review Time** | < 30 seconds per invoice | Time from opening a pending item to confirming/rejecting the AI suggestion |
| **AI Classification Accuracy** | > 90% confidence score | Percentage of AI-classified transactions that are confirmed without edits |
| **Direct Cost Coverage** | 100% of direct costs captured | Every vendor invoice linked to a project, inventory item, or overhead category — zero orphans |
| **Decision Speed** | Answer any "should I spend on X?" question within 60 seconds | Using the dashboard's overhead view, project margins, and Tax Jar to confidently assess financial headroom |
| **Morning Review Duration** | < 5 minutes for daily review | Complete the full Morning Coffee ritual (pending items + project health + headroom check) in one sitting |

### Business Objectives

| Timeframe | Objective | Success Criteria |
|---|---|---|
| **Month 1** | Core financial tracking operational | Work Orders created for all active projects with manual cost entry. Nutrition Label calculates margins correctly. |
| **Month 3** | Full automation pipeline live | Every active project has a real-time Nutrition Label with accurate margins. AI ingestion classifies incoming invoices. Accountant auto-forwarding works reliably. |
| **Month 6** | Complete financial visibility | All overhead categories fully tracked (subscriptions, software, meals, office). Tax Jar is reliable and reflects real-time 35% reserve. Pricing decisions are data-driven — every new project quote is informed by historical margin data. |
| **Ongoing** | Financial confidence | The owner can confidently answer "Can I afford better supplies? More marketing? A team lunch?" by checking the dashboard — no spreadsheets, no guesswork. |

### Key Performance Indicators

| KPI | Target | Why It Matters |
|---|---|---|
| **Invoice Capture Rate** | 100% — zero invoices "lost" | Every expense document is either classified, flagged for review, or explicitly rejected. Nothing falls through the cracks. |
| **Project Margin Visibility** | 100% of active projects have live margins | Every project in "Production" or "Shipped" status shows real-time Revenue vs. COGS vs. Net Profit. |
| **Inventory Accuracy** | WAC calculations stay accurate within 1% | As new purchases arrive and "Scoops" consume stock, weighted average cost remains reliable for COGS calculation. |
| **Overhead Tracking Completeness** | 100% of recurring costs categorized | Every subscription, software license, meal, and office expense is logged and categorized — not just for tax, but for operational awareness. |
| **Tax Jar Accuracy** | Within 5% of actual tax liability | The 35% reserve calculation tracks real net profit closely enough to prevent tax-time surprises. |
| **System Uptime/Reliability** | Dashboard loads in < 2 seconds | As a daily-use cockpit, the tool must feel instant and reliable — no waiting, no stale data. |

---

## MVP Scope

### Core Features (All Three Phases = MVP)

**Phase 1 — "The Skeleton" (Foundation)**

| Feature | Description | Why MVP |
|---|---|---|
| **Dashboard (Cockpit)** | Top-line KPI cards: Realized Net Profit, Tax Jar (35%), Active Projects count | The single pane of glass — everything starts here |
| **Work Order CRUD** | Create, edit, and manage client projects with status tracking (Lead → Design → Production → Shipped) | The central entity that links revenue to costs |
| **Nutrition Label** | Real-time margin calculation per Work Order: Revenue - Direct Costs - Inventory - Overhead Allocation - Buffer | The core "aha" — seeing true per-game profitability |
| **Transaction Manual Entry** | Log expenses manually with category classification (Direct, Inventory, Overhead, Personal) | Baseline data entry before AI takes over |
| **Project Health Table** | Table view of all projects with margin %, color-coded (Green/Yellow/Red at < 20%) | At-a-glance project portfolio health |

**Phase 2 — "The Brain" (Intelligence)**

| Feature | Description | Why MVP |
|---|---|---|
| **Email Interceptor** | Make.com watches finance@tailorplayed.com, routes expenses to both accountant AND TP-FOS | Eliminates double data entry — the core automation |
| **Gemini AI Classification** | Invoice parsing via Gemini 1.5 Flash: extracts vendor, date, amount, currency, suggests category and project | Makes the system actually usable daily — < 30s review |
| **Ghost Text Review UI** | Pre-filled AI suggestions displayed as editable fields. Confirm with Enter. | The UX that makes morning review fast and frictionless |
| **Review Sidebar** | Pending items panel showing AI-classified invoices awaiting confirmation | The "inbox" for financial items — 2-3 items per day |
| **Confidence Flagging** | Yellow "Check Me" badge when AI confidence < 85%, currency conversion flags | Trust calibration — know when to double-check the AI |

**Phase 3 — "The Scoop" (Unit Economics)**

| Feature | Description | Why MVP |
|---|---|---|
| **Inventory Management** | Track shared stock items: name, SKU, supplier, current qty, reorder threshold | Can't calculate true COGS without knowing inventory costs |
| **Weighted Average Cost (WAC)** | Auto-recalculate unit cost when new stock arrives (e.g., 100 @ $1 + 100 @ $2 = 200 @ $1.50) | Accurate cost-per-unit is the foundation of margin truth |
| **The "Scoop" Action** | Inside a Work Order: search material → input qty → auto-calculate cost added to COGS | The bridge between inventory and project profitability |
| **Inventory Audit Log** | Every restock, consume, and waste action logged with cost snapshot and Work Order reference | Traceability — know where every item went and at what cost |
| **Overhead Category View** | Monthly burn breakdown: subscriptions, software, meals, office expenses | Answers "can I afford to spend more?" at a glance |

### Out of Scope for MVP

| Feature | Rationale | When |
|---|---|---|
| **Multi-user / Roles** | Single-user cockpit by design. No team access needed. | Only if business scales to multiple operators |
| **Supplier Scorecards** | Aggregated vendor quality/damage tracking — valuable but not essential for core financial clarity | Post-MVP enhancement |
| **Automated Summit API Integration** | Revenue currently entered from Summit receipts via email/AI. Direct API sync would be ideal but adds complexity | V2 — when Summit offers stable API access |
| **Mobile App** | Dashboard is desktop-first (internal tool). Basic responsive at 768px is sufficient. | Only if mobile review becomes a real need |
| **Advanced Reporting / Export** | Monthly PDF reports, CSV exports, accountant-formatted summaries | Post-MVP — manual dashboard reading is sufficient initially |
| **Automated Tax Jar Alerts** | Push notifications when tax reserve exceeds thresholds | Nice-to-have after core Tax Jar display works |
| **Historical Margin Comparisons** | "Expected vs. Actual" profit trends per game type over time | V2 — requires enough historical data to be meaningful |

### MVP Success Criteria

The MVP is successful when:

1. **Every active project** has a live Nutrition Label showing real-time Revenue vs. COGS vs. Net Profit
2. **Every incoming invoice** is automatically captured, AI-classified, and presented for < 30 second review
3. **Inventory consumption** is tracked per-project using accurate WAC calculations
4. **Overhead categories** are fully visible in one dashboard view
5. **The Tax Jar** reliably shows 35% of real net profit
6. **The Morning Coffee Review** takes < 5 minutes and provides full financial confidence
7. **Zero invoices** are lost or unaccounted for in the system

### Future Vision

If TP-FOS succeeds as the internal cockpit, future enhancements could include:

- **Supplier Risk Scoring** — Track damage rates and delivery reliability per vendor to inform purchasing decisions
- **Predictive Pricing** — Use historical margin data to suggest optimal pricing for new projects based on similar past games
- **Automated Tax Alerts** — Push notifications when approaching tax thresholds or when the Tax Jar diverges from expectations
- **Client Profitability History** — Lifetime view of margin performance per client across all their projects
- **API-First Revenue Sync** — Direct integration with Summit/payment providers to eliminate even email-based revenue tracking
- **Advanced Reporting Suite** — Exportable monthly P&L, per-project cost breakdowns for client discussions, accountant-formatted summaries
