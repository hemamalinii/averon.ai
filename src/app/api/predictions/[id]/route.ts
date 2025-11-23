import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { predictions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const prediction = await db
      .select()
      .from(predictions)
      .where(eq(predictions.id, parseInt(id)))
      .limit(1);

    if (prediction.length === 0) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prediction[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { categoryId, confidence, influentialTokens, modelVersion } = body;

    // Check if prediction exists
    const existingPrediction = await db
      .select()
      .from(predictions)
      .where(eq(predictions.id, parseInt(id)))
      .limit(1);

    if (existingPrediction.length === 0) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    // Validate confidence if provided
    if (confidence !== undefined) {
      if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
        return NextResponse.json(
          {
            error: 'Confidence must be a number between 0 and 1',
            code: 'INVALID_CONFIDENCE',
          },
          { status: 400 }
        );
      }
    }

    // Validate categoryId if provided
    if (categoryId !== undefined) {
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return NextResponse.json(
          {
            error: 'Category ID must be a valid positive integer',
            code: 'INVALID_CATEGORY_ID',
          },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {};

    if (categoryId !== undefined) {
      updates.categoryId = categoryId;
    }

    if (confidence !== undefined) {
      updates.confidence = confidence;
    }

    if (influentialTokens !== undefined) {
      updates.influentialTokens = influentialTokens;
    }

    if (modelVersion !== undefined) {
      updates.modelVersion = modelVersion;
    }

    // Return early if no valid updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          error: 'No valid fields provided for update',
          code: 'NO_UPDATE_FIELDS',
        },
        { status: 400 }
      );
    }

    const updated = await db
      .update(predictions)
      .set(updates)
      .where(eq(predictions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if prediction exists before deleting
    const existingPrediction = await db
      .select()
      .from(predictions)
      .where(eq(predictions.id, parseInt(id)))
      .limit(1);

    if (existingPrediction.length === 0) {
      return NextResponse.json(
        { error: 'Prediction not found' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(predictions)
      .where(eq(predictions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'Prediction deleted successfully',
        deleted: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}