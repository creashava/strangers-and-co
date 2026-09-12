// ============================================================
// Payment Screenshot Verification Engine with OCR & Integrity Checks
// ============================================================

export interface ScreenshotVerificationResult {
  isValid: boolean;
  status: 'verified' | 'warning' | 'rejected';
  amountMatches: boolean;
  paymentKeywordsFound: boolean;
  detectedAmount: number | null;
  detectedUtr: string | null;
  message: string;
  warnings: string[];
}

const PAYMENT_KEYWORDS = [
  'paid',
  'successful',
  'success',
  'completed',
  'payment',
  'transfer',
  'transferred',
  'sent',
  'divya',
  '7411198298',
  'upi',
  'utr',
  'phonepe',
  'gpay',
  'google pay',
  'paytm',
  'bhim',
  'cred',
  'banking',
  'debited',
  'transaction id',
  'ref no',
  'upi ref',
];

/**
 * Validate image file metadata (type, size, dimensions).
 */
export async function validateImageFile(file: File): Promise<{ ok: boolean; error?: string }> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { ok: false, error: 'Please upload a valid image file (JPG, PNG, or WEBP).' };
  }

  // File size check: min 15KB, max 5MB
  if (file.size < 15 * 1024) {
    return {
      ok: false,
      error: 'Image file is too small to be a payment screenshot. Please upload the full screenshot.',
    };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: 'Screenshot file size exceeds 5MB limit.' };
  }

  // Test dimension loading
  try {
    const dimensions = await getImageDimensions(file);
    if (dimensions.width < 200 || dimensions.height < 200) {
      return {
        ok: false,
        error: 'Image resolution is too low. Please upload a clear phone screenshot.',
      };
    }
  } catch {
    return { ok: false, error: 'Unable to decode image. The file may be damaged.' };
  }

  return { ok: true };
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Perform OCR on the payment screenshot to extract text, check amount,
 * look for payment keywords, and find the 12-digit UTR.
 */
export async function analyzeScreenshot(
  file: File,
  expectedAmount: number
): Promise<ScreenshotVerificationResult> {
  // 1. Basic integrity validation
  const preCheck = await validateImageFile(file);
  if (!preCheck.ok) {
    return {
      isValid: false,
      status: 'rejected',
      amountMatches: false,
      paymentKeywordsFound: false,
      detectedAmount: null,
      detectedUtr: null,
      message: preCheck.error || 'Invalid image file.',
      warnings: [preCheck.error || 'Invalid file'],
    };
  }

  try {
    // Dynamic import of Tesseract to avoid SSR bundle inflation
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');

    const imageUrl = URL.createObjectURL(file);
    const ret = await worker.recognize(imageUrl);
    URL.revokeObjectURL(imageUrl);
    await worker.terminate();

    const rawText = ret.data.text || '';
    const cleanText = rawText.toLowerCase();

    // Check payment keywords
    let keywordCount = 0;
    for (const kw of PAYMENT_KEYWORDS) {
      if (cleanText.includes(kw)) {
        keywordCount++;
      }
    }
    const paymentKeywordsFound = keywordCount >= 1;

    // Detect amount
    let amountMatches = false;
    let detectedAmount: number | null = null;

    // Check for expected amount (e.g. 99 or 149)
    const expectedRegex = new RegExp(`(?:₹|inr|rs\\.?|\\b)${expectedAmount}(?:\\.00)?\\b`, 'i');
    if (expectedRegex.test(rawText) || rawText.includes(String(expectedAmount))) {
      amountMatches = true;
      detectedAmount = expectedAmount;
    } else {
      // Check if another amount like 99 or 149 was found
      const match99 = /(?:₹|inr|rs\.?|\b)99(?:\.00)?\b/i.test(rawText);
      const match149 = /(?:₹|inr|rs\.?|\b)149(?:\.00)?\b/i.test(rawText);
      if (match99) detectedAmount = 99;
      else if (match149) detectedAmount = 149;
    }

    // Extract 12-digit UTR / UPI Reference ID
    let detectedUtr: string | null = null;
    const explicitMatch = rawText.match(/(?:upi\s*ref(?:erence)?(?:\s*no)?|utr|txn\s*id|transaction\s*id)[:\s]*([0-9]{12})/i);
    if (explicitMatch && explicitMatch[1]) {
      detectedUtr = explicitMatch[1];
    } else {
      // Fallback: look for standalone 12-digit numbers
      const generalMatches = Array.from(rawText.matchAll(/\b([0-9]{12})\b/g));
      if (generalMatches.length > 0) {
        detectedUtr = generalMatches[0][1];
      }
    }

    const warnings: string[] = [];

    if (!paymentKeywordsFound) {
      warnings.push('Payment confirmation markers (e.g. "Paid", "Success", "UPI") were not clearly visible.');
    }

    if (!amountMatches) {
      if (detectedAmount && detectedAmount !== expectedAmount) {
        warnings.push(`Detected payment amount (₹${detectedAmount}) differs from expected ticket price (₹${expectedAmount}).`);
      } else {
        warnings.push(`Could not clearly read ₹${expectedAmount} on the screenshot.`);
      }
    }

    // If both keywords and amount are found, verified!
    if (paymentKeywordsFound && amountMatches) {
      return {
        isValid: true,
        status: 'verified',
        amountMatches: true,
        paymentKeywordsFound: true,
        detectedAmount: expectedAmount,
        detectedUtr,
        message: `Verified ₹${expectedAmount} payment screenshot.${detectedUtr ? ` UTR: ${detectedUtr}` : ''}`,
        warnings,
      };
    }

    // If keywords found but amount text was faint / stylised
    if (paymentKeywordsFound || amountMatches) {
      return {
        isValid: true,
        status: 'warning',
        amountMatches,
        paymentKeywordsFound,
        detectedAmount,
        detectedUtr,
        message: `Payment receipt attached.${detectedUtr ? ` Detected UTR: ${detectedUtr}` : ''} Our team will confirm at entry.`,
        warnings,
      };
    }

    // If no payment keywords and no amount
    return {
      isValid: false,
      status: 'rejected',
      amountMatches: false,
      paymentKeywordsFound: false,
      detectedAmount: null,
      detectedUtr: null,
      message: 'This image does not appear to be a UPI payment receipt. Please upload your payment confirmation screen.',
      warnings: ['No UPI payment markers found in screenshot.'],
    };
  } catch (error) {
    console.warn('Screenshot OCR analysis error:', error);
    // Graceful fallback if OCR fails in specific browser environments
    return {
      isValid: true,
      status: 'warning',
      amountMatches: false,
      paymentKeywordsFound: false,
      detectedAmount: null,
      detectedUtr: null,
      message: 'Screenshot attached. Will be verified manually upon registration.',
      warnings: ['Could not run automatic text scan on this device.'],
    };
  }
}
