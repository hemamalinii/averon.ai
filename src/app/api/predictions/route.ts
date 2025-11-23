import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { predictions } from '@/db/schema';
import { eq, gte, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const transactionId = searchParams.get('transaction_id');
    const categoryId = searchParams.get('category_id');
    const minConfidence = searchParams.get('min_confidence');
    
    const conditions = [];

    if (transactionId) {
      const parsedTransactionId = parseInt(transactionId);
      if (isNaN(parsedTransactionId)) {
        return NextResponse.json({ 
          error: 'Invalid transaction_id parameter',
          code: 'INVALID_TRANSACTION_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(predictions.transactionId, parsedTransactionId));
    }

    if (categoryId) {
      const parsedCategoryId = parseInt(categoryId);
      if (isNaN(parsedCategoryId)) {
        return NextResponse.json({ 
          error: 'Invalid category_id parameter',
          code: 'INVALID_CATEGORY_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(predictions.categoryId, parsedCategoryId));
    }

    if (minConfidence) {
      const parsedMinConfidence = parseFloat(minConfidence);
      if (isNaN(parsedMinConfidence) || parsedMinConfidence < 0 || parsedMinConfidence > 1) {
        return NextResponse.json({ 
          error: 'Invalid min_confidence parameter. Must be between 0 and 1',
          code: 'INVALID_MIN_CONFIDENCE' 
        }, { status: 400 });
      }
      conditions.push(gte(predictions.confidence, parsedMinConfidence));
    }

    // Build complete query based on conditions to avoid type reassignment issues
    let results;
    if (conditions.length > 0) {
      results = await db.select()
        .from(predictions)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);
    } else {
      results = await db.select()
        .from(predictions)
        .limit(limit)
        .offset(offset);
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, categoryId, confidence, influentialTokens, modelVersion } = body;

    if (!transactionId) {
      return NextResponse.json({ 
        error: 'transactionId is required',
        code: 'MISSING_TRANSACTION_ID' 
      }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ 
        error: 'categoryId is required',
        code: 'MISSING_CATEGORY_ID' 
      }, { status: 400 });
    }

    if (confidence === undefined || confidence === null) {
      return NextResponse.json({ 
        error: 'confidence is required',
        code: 'MISSING_CONFIDENCE' 
      }, { status: 400 });
    }

    const parsedTransactionId = parseInt(transactionId);
    if (isNaN(parsedTransactionId)) {
      return NextResponse.json({ 
        error: 'transactionId must be a valid integer',
        code: 'INVALID_TRANSACTION_ID' 
      }, { status: 400 });
    }

    const parsedCategoryId = parseInt(categoryId);
    if (isNaN(parsedCategoryId)) {
      return NextResponse.json({ 
        error: 'categoryId must be a valid integer',
        code: 'INVALID_CATEGORY_ID' 
      }, { status: 400 });
    }

    const parsedConfidence = parseFloat(confidence);
    if (isNaN(parsedConfidence)) {
      return NextResponse.json({ 
        error: 'confidence must be a valid number',
        code: 'INVALID_CONFIDENCE_FORMAT' 
      }, { status: 400 });
    }

    if (parsedConfidence < 0 || parsedConfidence > 1) {
      return NextResponse.json({ 
        error: 'confidence must be between 0 and 1',
        code: 'CONFIDENCE_OUT_OF_RANGE' 
      }, { status: 400 });
    }

    if (influentialTokens && !Array.isArray(influentialTokens)) {
      return NextResponse.json({ 
        error: 'influentialTokens must be an array',
        code: 'INVALID_INFLUENTIAL_TOKENS' 
      }, { status: 400 });
    }

    const insertData = {
      transactionId: parsedTransactionId,
      categoryId: parsedCategoryId,
      confidence: parsedConfidence,
      influentialTokens: influentialTokens || null,
      modelVersion: modelVersion || 'v1.0',
      createdAt: new Date().toISOString()
    };

    const newPrediction = await db.insert(predictions)
      .values(insertData)
      .returning();

    return NextResponse.json(newPrediction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json({ 
        error: 'Invalid transactionId or categoryId - referenced record does not exist',
        code: 'FOREIGN_KEY_CONSTRAINT' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + errorMessage 
    }, { status: 500 });
  }
}