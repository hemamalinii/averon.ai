import { NextRequest, NextResponse } from 'next/server';

// Validation utilities
function validateTransaction(description: string): { valid: boolean; error?: string } {
  if (!description || typeof description !== 'string') {
    return { valid: false, error: 'Transaction description must be a non-empty string' };
  }

  const trimmed = description.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Transaction description too short (minimum 3 characters)' };
  }
  
  if (trimmed.length > 500) {
    return { valid: false, error: 'Transaction description too long (maximum 500 characters)' };
  }

  // Check for minimum alphanumeric content
  const alphanumCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
  const alphanumRatio = alphanumCount / trimmed.length;
  
  if (alphanumRatio < 0.3) {
    return { valid: false, error: 'Transaction description contains too many special characters' };
  }

  return { valid: true };
}

function validateAmount(amount: any): { valid: boolean; error?: string } {
  if (amount === undefined || amount === null) {
    return { valid: true }; // Amount is optional
  }

  const numAmount = Number(amount);
  
  if (isNaN(numAmount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (numAmount < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  if (numAmount > 1000000) {
    return { valid: false, error: 'Amount exceeds maximum limit ($1,000,000)' };
  }

  return { valid: true };
}

// Noise handling utilities
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')  // Multiple spaces → single space
    .replace(/[^\w\s#\-\/]/g, '')  // Remove special chars except #, -, /
    .trim();
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

function fuzzyMatch(word: string, candidates: string[], threshold: number = 0.8): string | null {
  let bestMatch: string | null = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(word, candidate);
    const maxLength = Math.max(word.length, candidate.length);
    const similarity = 1 - distance / maxLength;

    if (similarity > threshold && similarity > bestSimilarity) {
      bestMatch = candidate;
      bestSimilarity = similarity;
    }
  }

  return bestMatch;
}

const DEMO_PREDICTIONS: { [key: string]: any } = {
  // High confidence (≥85%) - Clear, unambiguous transactions
  'starbucks': { category: 'Dining', confidence: 0.96, tokens: ['starbucks', 'coffee'] },
  'shell': { category: 'Fuel', confidence: 0.94, tokens: ['shell', 'petrol', 'gas'] },
  'netflix': { category: 'Entertainment', confidence: 0.93, tokens: ['netflix', 'subscription'] },
  'walmart': { category: 'Shopping', confidence: 0.89, tokens: ['walmart'] },
  
  // Medium confidence (65-84%) - Somewhat ambiguous transactions
  'amazon': { category: 'Shopping', confidence: 0.78, tokens: ['amazon', 'marketplace', 'purchase'] },
  'whole foods': { category: 'Groceries', confidence: 0.72, tokens: ['whole', 'foods', 'market'] },
  'cvs': { category: 'Healthcare', confidence: 0.69, tokens: ['cvs', 'pharmacy'] },
  
  // Low confidence (<65%) - Ambiguous or unclear transactions
  'uber': { category: 'Transport', confidence: 0.58, tokens: ['uber', 'ride'] },
  'electric': { category: 'Bills', confidence: 0.52, tokens: ['electric', 'bill', 'payment'] },
  
  // Additional patterns
  'target': { category: 'Shopping', confidence: 0.86, tokens: ['target'] },
  'chipotle': { category: 'Dining', confidence: 0.91, tokens: ['chipotle', 'restaurant'] },
  'gas': { category: 'Fuel', confidence: 0.88, tokens: ['gas', 'station'] },
  'grocery': { category: 'Groceries', confidence: 0.75, tokens: ['grocery', 'market'] },
  'movie': { category: 'Entertainment', confidence: 0.63, tokens: ['movie', 'cinema', 'theater'] },
  'pizza': { category: 'Dining', confidence: 0.82, tokens: ['pizza', 'restaurant'] },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transaction, amount, merchant_name } = body;

    // Validate transaction description
    const txValidation = validateTransaction(transaction);
    if (!txValidation.valid) {
      return NextResponse.json(
        { error: txValidation.error },
        { status: 400 }
      );
    }

    // Validate amount if provided
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      return NextResponse.json(
        { error: amountValidation.error },
        { status: 400 }
      );
    }

    // Normalize and clean input
    const normalizedTx = normalizeText(transaction);
    const tokens = normalizedTx.split(/\s+/);

    // Fuzzy matching with known keywords
    const knownKeywords = Object.keys(DEMO_PREDICTIONS);
    const matchedKeywords: string[] = [];

    for (const token of tokens) {
      // Exact match
      if (knownKeywords.includes(token)) {
        matchedKeywords.push(token);
        continue;
      }

      // Fuzzy match for typos
      const fuzzyMatched = fuzzyMatch(token, knownKeywords, 0.85);
      if (fuzzyMatched) {
        matchedKeywords.push(fuzzyMatched);
      }
    }

    let bestMatch: any = null;
    let bestMatchCount = 0;

    // Find best matching prediction
    for (const keyword of matchedKeywords) {
      const prediction = DEMO_PREDICTIONS[keyword];
      if (prediction && keyword.length > bestMatchCount) {
        bestMatch = prediction;
        bestMatchCount = keyword.length;
      }
    }

    // Check merchant_name if no match found
    if (!bestMatch && merchant_name) {
      const normalizedMerchant = normalizeText(merchant_name);
      for (const [keyword, prediction] of Object.entries(DEMO_PREDICTIONS)) {
        if (normalizedMerchant.includes(keyword)) {
          bestMatch = prediction;
          break;
        }
      }
    }

    // Fallback for unknown transactions
    if (!bestMatch) {
      // Reduce confidence for noisy/unclear transactions
      let baseConfidence = 0.45;
      
      // Penalty for very short descriptions
      if (normalizedTx.length < 10) {
        baseConfidence *= 0.9;
      }
      
      // Penalty for high special character ratio
      const specialCharCount = (transaction.match(/[^a-zA-Z0-9\s]/g) || []).length;
      if (specialCharCount / transaction.length > 0.3) {
        baseConfidence *= 0.85;
      }

      bestMatch = {
        category: 'Other',
        confidence: Math.min(0.65, baseConfidence + Math.random() * 0.2),
        tokens: tokens.slice(0, 3),
      };
    } else {
      // Adjust confidence based on input quality
      let confidenceMultiplier = 1.0;

      // Reduce confidence for very noisy input
      const specialCharCount = (transaction.match(/[^a-zA-Z0-9\s]/g) || []).length;
      if (specialCharCount / transaction.length > 0.4) {
        confidenceMultiplier *= 0.9;
      }

      // Slight boost if merchant_name matches
      if (merchant_name && normalizeText(merchant_name).includes(matchedKeywords[0])) {
        confidenceMultiplier *= 1.05;
      }

      bestMatch = {
        ...bestMatch,
        confidence: Math.min(0.99, bestMatch.confidence * confidenceMultiplier),
      };
    }

    // Map category names to actual database IDs
    const categoryMap: { [key: string]: number } = {
      'Groceries': 1,
      'Dining': 2,
      'Fuel': 3,
      'Shopping': 4,
      'Bills': 5,
      'Entertainment': 6,
      'Transport': 7,
      'Healthcare': 8,
      'Other': 9,
    };

    return NextResponse.json({
      category: bestMatch.category,
      confidence: Math.min(0.99, bestMatch.confidence),
      influential_tokens: bestMatch.tokens,
      category_id: categoryMap[bestMatch.category] || 9,
      normalized_input: normalizedTx, // For debugging
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}