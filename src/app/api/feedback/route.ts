import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feedback } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('user_id');
    const transactionId = searchParams.get('transaction_id');

    const conditions = [];

    if (userId) {
      conditions.push(eq(feedback.userId, userId));
    }

    if (transactionId) {
      const parsedTransactionId = parseInt(transactionId);
      if (isNaN(parsedTransactionId)) {
        return NextResponse.json({ 
          error: 'Invalid transaction_id parameter',
          code: 'INVALID_TRANSACTION_ID' 
        }, { status: 400 });
      }
      conditions.push(eq(feedback.transactionId, parsedTransactionId));
    }

    // Build complete query based on conditions to avoid type reassignment issues
    let results;
    if (conditions.length > 0) {
      results = await db.select()
        .from(feedback)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);
    } else {
      results = await db.select()
        .from(feedback)
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
    const { transactionId, predictionId, originalCategoryId, correctedCategoryId, userId, notes } = body;

    if (!transactionId) {
      return NextResponse.json({ 
        error: 'transactionId is required',
        code: 'MISSING_TRANSACTION_ID' 
      }, { status: 400 });
    }

    if (!correctedCategoryId) {
      return NextResponse.json({ 
        error: 'correctedCategoryId is required',
        code: 'MISSING_CORRECTED_CATEGORY_ID' 
      }, { status: 400 });
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ 
        error: 'userId is required and must be a string',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }

    const parsedTransactionId = parseInt(transactionId);
    if (isNaN(parsedTransactionId)) {
      return NextResponse.json({ 
        error: 'transactionId must be a valid integer',
        code: 'INVALID_TRANSACTION_ID' 
      }, { status: 400 });
    }

    const parsedCorrectedCategoryId = parseInt(correctedCategoryId);
    if (isNaN(parsedCorrectedCategoryId)) {
      return NextResponse.json({ 
        error: 'correctedCategoryId must be a valid integer',
        code: 'INVALID_CORRECTED_CATEGORY_ID' 
      }, { status: 400 });
    }

    const insertData: any = {
      transactionId: parsedTransactionId,
      correctedCategoryId: parsedCorrectedCategoryId,
      userId: userId,
      createdAt: new Date().toISOString()
    };

    if (predictionId !== undefined && predictionId !== null) {
      const parsedPredictionId = parseInt(predictionId);
      if (isNaN(parsedPredictionId)) {
        return NextResponse.json({ 
          error: 'predictionId must be a valid integer',
          code: 'INVALID_PREDICTION_ID' 
        }, { status: 400 });
      }
      insertData.predictionId = parsedPredictionId;
    }

    if (originalCategoryId !== undefined && originalCategoryId !== null) {
      const parsedOriginalCategoryId = parseInt(originalCategoryId);
      if (isNaN(parsedOriginalCategoryId)) {
        return NextResponse.json({ 
          error: 'originalCategoryId must be a valid integer',
          code: 'INVALID_ORIGINAL_CATEGORY_ID' 
        }, { status: 400 });
      }
      insertData.originalCategoryId = parsedOriginalCategoryId;
    }

    if (notes) {
      insertData.notes = notes.trim();
    }

    const newFeedback = await db.insert(feedback)
      .values(insertData)
      .returning();

    return NextResponse.json(newFeedback[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json({ 
        error: 'Invalid reference: transactionId, predictionId, originalCategoryId, correctedCategoryId, or userId does not exist',
        code: 'FOREIGN_KEY_CONSTRAINT' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + errorMessage 
    }, { status: 500 });
  }
}