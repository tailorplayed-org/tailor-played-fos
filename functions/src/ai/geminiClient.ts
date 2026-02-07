import { GoogleGenAI } from '@google/genai';
import { getStorage } from 'firebase-admin/storage';
import * as logger from 'firebase-functions/logger';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { geminiApiKey } from '../config.js';
import { parsedDocumentSchema, type ParsedDocument } from '../shared/schemas.js';

const GEMINI_MODEL = 'gemini-2.5-pro';
const GEMINI_TIMEOUT_MS = 25_000; // 25s — leaves 5s for Firestore writes within 30s NFR4 budget

/**
 * Downloads a document from Firebase Storage and sends it to Gemini 2.5 Pro
 * for structured financial data extraction (Hebrew + English bilingual).
 */
export async function parseFinancialDocument(
  documentUrl: string,
  mimeType: string,
): Promise<ParsedDocument> {
  const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

  // Download document from Firebase Storage
  const storage = getStorage();
  const bucket = storage.bucket();
  const file = bucket.file(documentUrl);
  const [buffer] = await file.download();
  const base64Data = buffer.toString('base64');

  // Build extraction prompt
  const prompt = buildExtractionPrompt();

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

    logger.info('Document parsed successfully', {
      vendorName: validated.vendorName,
      currency: validated.currency,
      documentType: validated.documentType,
      languageDetected: validated.languageDetected,
    });

    return validated;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildExtractionPrompt(): string {
  return `You are a financial document parser for a small business (TailorPlayed — custom board game company).
Extract structured data from this financial document. The document may be in Hebrew, English, or mixed.

EXTRACTION RULES:
- vendorName: Extract the vendor/supplier/company name exactly as written (preserve Hebrew characters)
- date: Extract the document date in ISO 8601 format (YYYY-MM-DD). For Israeli dates (DD/MM/YYYY), convert correctly.
- totalAmount: Extract the total amount as a decimal number (e.g., 82.50, not 8250). Include tax if it's part of the total.
- currency: Identify the currency. Use "ILS" for ₪/שקל/שח, "USD" for $/dollars, "EUR" for €/euros. Default to "ILS" if unclear.
- lineItems: Extract individual line items with description and amount. If no line items are visible, return an empty array.
- documentType: Classify as "invoice", "receipt", or "quote" based on document headers and content.
- languageDetected: "hebrew", "english", or "mixed" based on the primary language of the document.
- confidence: Your confidence in the extraction accuracy (0-100). Lower confidence for blurry images, partial documents, or ambiguous fields.

IMPORTANT:
- For Hebrew documents: ₪ or שקל or שח means ILS currency
- Israeli date format is DD/MM/YYYY — convert to YYYY-MM-DD
- Amounts should be the final total including VAT/tax if present
- If you cannot extract a field, use reasonable defaults (empty string for text, 0 for numbers, empty array for lineItems)`;
}
