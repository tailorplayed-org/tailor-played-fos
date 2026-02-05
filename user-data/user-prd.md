Prd
Here is the Detailed Product Requirements Document (PRD) v2.0.
This document is written at a granular level, suitable for a Senior Full-Stack Developer to pick up and start coding immediately. It covers edge cases, data structures, and specific UI states.
Product Requirements Document: Tailor Played Financial OS (TP-FOS)
Version: 2.0 (Detailed Spec)
Date: February 4, 2026
Status: In Development
Owner: [Your Name]
1. Problem Definition & Objectives
1.1 The Problem
Standard accounting software (Paperless/Summit) tracks legal compliance (Tax/VAT) but fails to track Unit Economics.
 * Blind Spot 1: It cannot allocate a bulk purchase of dice (Inventory) to a specific client project (COGS).
 * Blind Spot 2: It cannot distinguish between "Business Investment" (Buying a 3D printer) and "Cost of Goods Sold" (Printing a specific figure).
 * Result: The business owner doesn't know the true net profit per game.
1.2 The Solution
TP-FOS is an operational layer that ingests financial data via AI, calculates real-time profitability per project, and syncs with the legal accountant via automation.
1.3 Key Metrics for Success
 * Time to Log: < 30 seconds per invoice (Review time).
 * Accuracy: > 90% AI classification confidence.
 * Coverage: 100% of "Direct Costs" captured in the system.
2. User Stories & Workflows
2.1 The "Interceptor" Workflow (Core Automation)
Actor: System / Make.com / Cloud Functions
Trigger: New email arrives at finance@tailorplayed.com.
 * Ingestion: System detects if the email contains an attachment (PDF/JPG) or is a transactional HTML email.
 * Classification (The Router):
   * If Source = "Summit" (Revenue):
     * Extract: Client Name, Amount, Date.
     * Action: Update Work_Order revenue.
     * Stop. (Do not forward to accountant).
   * If Source = External Vendor (Expense):
     * Action A (Legal): Auto-forward to [Accountant_Email].
     * Action B (Ops): Send payload to Gemini API for processing.
     * Result: Create a Transaction record in Firestore with status pending_review.
2.2 The "Morning Coffee" Review
Actor: Business Owner
 * User logs into the TP-FOS Dashboard.
 * User sees a "Pending Review" sidebar (3 items).
 * User clicks Item 1 (The Game Crafter Invoice):
   * AI suggests: "Direct Cost" -> "Project: David's Game".
 * User hits [Enter] to confirm.
 * System updates the Profit Margin for "David's Game" instantly.
3. Functional Specifications
Module A: The Dashboard (The Cockpit)
View: Dashboard.tsx
 * Top Cards:
   * Realized Net Profit (Month): (Revenue - COGS - Overhead).
   * Tax Jar: (35% of Net Profit) - A visual reminder of money not to touch.
   * Active Projects: Count of projects in "Production".
 * Main Widget: "Project Health Table".
   * Columns: Client Name, Status, Revenue, Cost, Margin %.
   * Logic: If Margin < 20%, highlight row in Red.
Module B: The Work Order (The Container)
View: WorkOrderDetails.tsx
The central entity linking Revenue to Costs.
 * Fields:
   * ID (Auto-generated).
   * Status (Lead, Design, Production, Shipped).
   * Revenue (Synced from Summit receipts).
 * Cost Sections:
   * Direct Purchases: Linked Invoices (e.g., Custom Box Print).
   * Inventory Usage (The Scoop):
     * UI: "Add Material" Button -> Search "Red Dice" -> Input Qty "4".
     * Calc: $0.15 (Avg Cost) * 4 = $0.60 added to COGS.
   * Labor/Service: Manual entry (e.g., "Design Hours").
   * Buffer: Auto-calculated 5% of total costs for "Unforeseen Waste".
Module C: Inventory Management (WAC)
View: Inventory.tsx
 * Method: Weighted Average Cost (WAC).
 * Logic:
   * Current State: 100 units @ $1.00 each.
   * Action: Buy 100 units @ $2.00 each.
   * New State: 200 units @ $1.50 each.
 * Fields: Item Name, SKU, Supplier, Current Qty, Reorder Threshold.
Module D: AI Processing Agent
Tech: Gemini 1.5 Flash (via Vercel AI SDK).
Input: PDF/Image Base64 + Text Context.
Output: Structured JSON.
Handling Uncertainty
 * If confidence_score < 0.85: Flag UI with a yellow "Check Me" badge.
 * If currency != ILS: Auto-convert using current exchange rate (via free API or rough estimate) but flag as "Estimated".
4. Technical Architecture
4.1 Database Schema (Firestore)
Collection: transactions (The Staging Area)
interface Transaction {
  id: string;
  original_file_url: string; // Storage bucket link
  vendor_name: string;
  date: Timestamp;
  amount: number;
  currency: 'ILS' | 'USD' | 'EUR';
  
  // AI Classification Results
  category: 'Direct' | 'Inventory' | 'Overhead' | 'Personal';
  suggested_project_id?: string; // If Direct
  suggested_inventory_id?: string; // If Inventory
  
  status: 'pending_review' | 'approved' | 'rejected';
  ai_confidence: number;
}

Collection: work_orders
interface WorkOrder {
  id: string;
  client_name: string;
  revenue_total: number; // Sum of Summit receipts
  
  // The "Living" Cost Structure
  costs: {
    direct_total: number; // Sum of linked transactions
    inventory_total: number; // Sum of "Scoops"
    overhead_allocation: number; // e.g. 10% of revenue
    unforeseen_buffer: number; // 5% of direct_total
  }
}

Collection: inventory_log (Audit Trail)
interface InventoryLog {
  id: string;
  item_id: string;
  action: 'restock' | 'consume' | 'waste';
  qty_change: number; // +100 or -4
  work_order_ref?: string; // Where did it go?
  cost_snapshot: number; // Cost at moment of use
}

4.2 API / Integration Layer (The Router)
Recommended Tool: Make.com (Fastest to MVP).
Scenario: Incoming Expense Email
 * Watch Gmail: Filter label:expenses.
 * Router:
   * Route A (Email): Send to expenses@paperless-accountant.com.
   * Route B (HTTP): POST to tailorplayed.com/api/ingest.
 * API Endpoint (/api/ingest):
   * Receive File.
   * Call Gemini AI.
   * Write to Firestore (transactions collection).
5. UI/UX Requirements (Wireframe Guidelines)
5.1 The "Review Sidebar" (Critical Component)
This component lives on the right side of the screen.
 * State: Empty: "All caught up! ☕"
 * State: Pending Items: List of cards.
 * Card Interaction:
   * Top Line: Vendor Name + Price.
   * Middle: "Allocating to: [ Project Dropdown ]".
   * Bottom: [Confirm (Enter)] | [Edit (E)] | [Reject (Del)].
5.2 The "Scoop" Modal
When inside a project, adding inventory should be fast.
 * Input: "Search Material..." (Auto-complete).
 * Input: "Quantity".
 * Visual: Show "Remaining Stock" below the input to prevent over-drafting.
6. AI System Prompt (The Brain)
Context:
You are an expert manufacturing accountant for a custom board game company.
Input:
Image or PDF of an invoice.
Lists to Reference:
 * Projects: {list_of_active_project_names}
 * Inventory Items: {list_of_stock_items}
Instructions:
 * Extract Vendor, Date, Total Amount, Currency.
 * Determine Category:
   * If it mentions specific client names or unique 1-off items -> "Direct".
   * If it mentions bulk items (Dice, Meeples, Boxes) -> "Inventory".
   * If it is software (Adobe, Vercel) or utility -> "Overhead".
 * Reasoning: Explain why you chose this category in 1 short sentence.
 * JSON Output Only.
7. Security & Permissions
 * Auth: Firebase Auth (Google Sign-in).
 * Roles: Admin (You) - Full Access.
 * Data Privacy: Receipts contain sensitive data. Ensure Firestore Security Rules allow read/write ONLY by request.auth.uid == admin_uid.
8. Development Phases
Phase 1: The "Skeleton" (Week 1)
 * Setup Next.js + Firebase.
 * Build the Work Order manual creation form.
 * Build the Transaction manual entry form.
 * Goal: You can manually type in data and see the "Nutrition Label" work.
Phase 2: The "Brain" (Week 2)
 * Connect Make.com to Email.
 * Build the Gemini Integration.
 * Build the "Review Sidebar".
 * Goal: Emails turn into "Pending Reviews" automatically.
Phase 3: The "Scoop" (Week 3)
 * Build the Inventory system.
 * Implement Weighted Average Cost logic.
 * Goal: Full Unit Economics tracking.
