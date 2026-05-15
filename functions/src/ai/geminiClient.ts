import { GoogleGenAI } from '@google/genai';
import { getStorage } from 'firebase-admin/storage';
import * as logger from 'firebase-functions/logger';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { geminiApiKey } from '../config.js';
import { parsedDocumentSchema, type ParsedDocument } from '../shared/schemas.js';
import type { ClassificationContext } from '../shared/types.js';

const GEMINI_MODEL = 'gemini-2.5-pro';
const GEMINI_TIMEOUT_MS = 25_000; // 25s — leaves 5s for Firestore writes within 30s NFR4 budget

/**
 * Downloads a document from Firebase Storage and sends it to Gemini 2.5 Pro
 * for structured financial data extraction AND classification (Hebrew + English bilingual).
 * Story 4.4: Extended with classification context for category, work order, and vendor matching.
 */
export async function parseFinancialDocument(
  documentUrl: string,
  mimeType: string,
  classificationContext?: ClassificationContext,
): Promise<ParsedDocument> {
  const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

  // Download document from Firebase Storage
  const storage = getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(documentUrl);
  const [buffer] = await file.download();
  const base64Data = buffer.toString('base64');

  // Build extraction + classification prompt (Story 4.4)
  const prompt = buildExtractionAndClassificationPrompt(classificationContext);

  // Call Gemini with structured output + timeout via AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        // Cast needed: zod-to-json-schema types target Zod 3; runtime works with Zod 4
        responseJsonSchema: zodToJsonSchema(parsedDocumentSchema as unknown as Parameters<typeof zodToJsonSchema>[0]),
        abortSignal: controller.signal,
      },
    });

    // Parse and validate response
    const rawText = response.text;
    if (!rawText) {
      throw new Error('Gemini returned empty response');
    }

    const parsed = JSON.parse(rawText);
    const validated = parsedDocumentSchema.parse(parsed);

    logger.info('Document parsed and classified successfully', {
      vendorName: validated.vendorName,
      currency: validated.currency,
      documentType: validated.documentType,
      languageDetected: validated.languageDetected,
      category: validated.category,
      confidence: validated.confidence,
      suggestedWorkOrderId: validated.suggestedWorkOrderId,
    });

    return validated;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Build the combined extraction + classification prompt for Gemini.
 * Story 4.4: Includes classification instructions, vendor history, and work order context.
 */
function buildExtractionAndClassificationPrompt(context?: ClassificationContext): string {
  let prompt = `You are a financial document parser and classifier for a small business (TailorPlayed — custom board game company).
Extract structured data AND classify this financial document. The document may be in Hebrew, English, or mixed.

EXTRACTION RULES:
- vendorName: Extract the vendor/supplier/company name exactly as written (preserve Hebrew characters)
- date: Extract the document date in ISO 8601 format (YYYY-MM-DD). For Israeli dates (DD/MM/YYYY), convert correctly.
- totalAmount: Extract the total amount as a decimal number (e.g., 82.50, not 8250). Include tax if it's part of the total.
- currency: Identify the currency. Use "ILS" for ₪/שקל/שח, "USD" for $/dollars, "EUR" for €/euros. Default to "ILS" if unclear.
- lineItems: Extract individual line items with description and amount. If no line items are visible, return an empty array.
- documentType: Classify as "invoice", "receipt", or "quote" based on document headers and content.
- languageDetected: "hebrew", "english", or "mixed" based on the primary language of the document.

CLASSIFICATION RULES:
- category: Classify into exactly one of: "DirectCost", "InventoryRestock", "Overhead", "Personal", "Revenue", "OwnerContribution", "OwnerWithdrawal"
  * DirectCost: Materials, production costs, and services directly tied to client projects (game printing, component manufacturing, design services)
  * InventoryRestock: Purchases of stock materials not tied to a specific project (card stock, dice, game boxes, generic components)
  * Overhead: Business expenses not tied to production (software subscriptions, office supplies, meals, shipping supplies, marketing)
  * Personal: Non-business purchases that arrived in business email (rare, flag for rejection)
  * Revenue: Income from clients (payments, deposits)
  * OwnerContribution: Owner deposits personal funds INTO the business (equity injection — typically a bank transfer from the owner's personal account; NOT revenue, NOT a sale). UNCOMMON for invoices/receipts — usually appears only in bank statements.
  * OwnerWithdrawal: Owner takes funds OUT of the business for personal use (equity distribution — typically a bank transfer from the business to the owner; NOT an expense, NOT a cost). UNCOMMON for invoices/receipts — usually appears only in bank statements.
- classificationReasoning: 1-2 sentences explaining WHY you chose this category and work order match. Reference vendor history if available.
- suggestedWorkOrderId: If the transaction likely relates to a specific work order/project, return the work order ID from the list below. Return null if no match or uncertain.
- suggestedInventoryItemId: Always return null (inventory system not yet implemented).
- confidence: Overall confidence (0-100) considering BOTH extraction accuracy AND classification certainty. Lower confidence for: new vendors, ambiguous categories, blurry documents, missing context.

IMPORTANT:
- For Hebrew documents: ₪ or שקל or שח means ILS currency
- Israeli date format is DD/MM/YYYY — convert to YYYY-MM-DD
- Amounts should be the final total including VAT/tax if present
- If you cannot extract a field, use reasonable defaults (empty string for text, 0 for numbers, empty array for lineItems)`;

  // Add vendor history context if available
  if (context?.vendorHistory.length) {
    prompt += `\n\nKNOWN VENDOR HISTORY (use for classification and work order matching):`;
    for (const entry of context.vendorHistory) {
      prompt += `\n- "${entry.vendorName}" → typically ${entry.category}`;
      if (entry.workOrderName) {
        prompt += `, linked to project "${entry.workOrderName}" (${entry.count} times)`;
      } else if (entry.workOrderId) {
        prompt += `, linked to work order "${entry.workOrderId}" (${entry.count} times)`;
      }
    }
  } else {
    prompt += `\n\nNO VENDOR HISTORY AVAILABLE — classify based on document content only.`;
  }

  // Add active work orders
  if (context?.workOrders.length) {
    prompt += `\n\nACTIVE WORK ORDERS (for project suggestion — use ID in suggestedWorkOrderId):`;
    for (const wo of context.workOrders) {
      prompt += `\n- id: "${wo.id}", project: "${wo.clientName}", status: ${wo.status}`;
    }
  } else {
    prompt += `\n\nNO ACTIVE WORK ORDERS — set suggestedWorkOrderId to null.`;
  }

  // Note about inventory
  prompt += `\n\nINVENTORY: No inventory items available yet. Set suggestedInventoryItemId to null.`;

  return prompt;
}
