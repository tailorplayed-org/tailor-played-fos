Sum

This is a comprehensive Technical and Product Specification document. It synthesizes your vision, the business constraints discussed with your accountant, and the technical "Interceptor" architecture we designed.
You can hand this directly to a developer, a UI/UX designer, or a data analyst.
Project Specification: Tailor Played Financial OS (TP-FOS)
Version: 1.1
Status: Ready for Development
Target Audience: Software Engineers, Product Designers, Business Analysts
1. Executive Summary & Business Context
Tailor Played is a bespoke manufacturing business creating personalized board games based on client stories. Unlike traditional e-commerce, this business involves:
 * Direct Manufacturing: Ordering specific parts per project (e.g., custom cards from The Game Crafter).
 * Inventory Consumption: Using bulk-purchased parts (e.g., dice, meeples) across multiple projects.
 * Consulting Services: A secondary revenue stream from AI consulting/lectures (High margin, low overhead).
The Objective: Build an "Intelligence Layer" that sits above legal accounting tools (Summit, Paperless) to provide real-time unit economics and operational control.
2. The Ecosystem & Data Flow
The system must act as an Intelligent Router to avoid double data entry.
| Tool | Purpose | Data Type | Integration Method |
|---|---|---|---|
| Summit | Legal Receipts (Revenue) | Outgoing Invoices | Webhook or Email Forwarding |
| Paperless | Tax Compliance (Accountant) | Incoming Expenses | Automated Forwarding (The Fork) |
| TP-FOS | Operational Intelligence | All Financial Data | Firebase + Gemini AI |
The "Interceptor" Logic (Data Routing)
The system uses a central "Ingestion Email" (e.g., finance@tailorplayed.com).
 * If File = Outgoing Receipt (from Summit):
   * Extract Revenue data via Gemini.
   * Update the corresponding Work Order in TP-FOS.
   * Action: Store in DB (No need to send to Accountant, they have access to Summit).
 * If File = Incoming Expense (Vendor Invoice):
   * The Fork:
     * Forward to Accountant: Send automatically to Paperless/Accountant email.
     * Ingest to TP-FOS: Parse via Gemini for cost allocation (Direct vs. Inventory).
3. Core Functional Modules
Module A: The Work Order (The "Nutrition Label")
Every client project is a "Work Order" container.
 * The Nutrition Label UI: A card showing:
   * Gross Revenue (from Summit).
   * Direct Costs (from Vendor Invoices).
   * Inventory Costs (from "Scoop" actions).
   * Scrap/Waste (Manual logs).
   * Net Profit: Displayed in real-time with color-coding (Green/Yellow/Red margins).
Module B: The Virtual Warehouse (Inventory)
A lightweight IMS (Inventory Management System) for shared stock.
 * Weighted Average Cost (WAC): When new stock is bought, the system recalculates:
   
 * The "Scoop" Action: A UI button inside a Work Order to "Consume" items (e.g., "Used 4 Blue Meeples"). This subtracts from stock and adds to the project cost.
Module C: AI-First Ingestion (The Accountant Agent)
Using the Gemini API to eliminate manual typing.
 * OCR & Classification: Gemini identifies the vendor, date, total, and suggested path:
   * Path 1: Direct Project Cost (Asks for Work Order ID).
   * Path 2: Inventory Restock (Asks for Item ID).
   * Path 3: Overhead/General (Monthly SaaS like Cursor/OpenAI).
 * Ghost Text UI: Data is presented as pre-filled "suggested" text. The user simply hits "Enter" to confirm.
Module D: Scrap & Quality Tracking
 * Waste Logging: Users log "Misprints" or "Damaged parts." The cost of these parts is added back to the Work Order cost to reflect true manufacturing yields.
 * Supplier Risk Score: Aggregated data on damaged goods per vendor to inform future purchasing decisions.
4. Technical Requirements & Stack
Frontend (Designer Focus)
 * Framework: React with Tailwind CSS.
 * UI Philosophy: "Pilot’s Cockpit" — High-density information, scannable dashboards.
 * Component Priority: "Smart Input" sidebar (Drag-and-drop with real-time AI status).
Backend (Developer Focus)
 * Database: Firestore (NoSQL).
 * Functions: Node.js/Python on Firebase.
 * AI Integration: Gemini 1.5 Pro/Flash via Vercel AI SDK.
 * Automation: Make.com or custom Mailgun/Sendgrid listeners for the "Interceptor" flow.
Data Analyst Requirements (Analysis Focus)
 * Tax Jar: A virtual calculation of 35% (Current Marginal Tax Rate) of Net Profit to be set aside.
 * Margin Analysis: Monthly reports on "Expected vs. Actual" profit per game type.
5. Proposed Data Schema (Firestore)
// Work Orders
{
  "order_id": "TP-105",
  "client": "John Doe",
  "revenue": 550.00,
  "costs": {
    "direct": 120.00,
    "inventory": 15.50,
    "scrap": 4.00
  },
  "status": "Production"
}

// Transactions (The Ledger)
{
  "txn_id": "abc-123",
  "type": "expense",
  "source": "email_forward",
  "ai_confidence": 0.94,
  "allocated_to": "order_123", 
  "is_confirmed": false
}

6. Implementation Roadmap
Phase 1: MVP (The "Truth" Engine)
 * Manual entry forms for Work Orders and Inventory to validate the "Nutrition Label" math.
 * Firebase/React boilerplate setup.
Phase 2: The Intelligence Layer
 * Integration of Gemini API for email parsing.
 * The "Interceptor" email router (Make.com + Forwarding rules).
 * "Ghost Text" UI implementation.
Phase 3: Scaling & Optimization
 * Supplier Scorecards.
 * API integration with Morning/Summit (if available) for automated revenue syncing.
 * Automated "Tax Jar" alerts.
Next Step for you: Would you like me to write the System Prompt for the "Accountant Agent" (Gemini) so you can test it with a few real receipts from your email?
