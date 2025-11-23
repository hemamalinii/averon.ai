import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feedback } from '@/db/schema';
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

    const record = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, parseInt(id)))
      .limit(1);

    if (record.length === 0) {
      return NextResponse.json(
        { error: 'Feedback not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(record[0], { status: 200 });
  } catch (error) {
    console.error('GET feedback error:', error);
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
    const { predictionId, originalCategoryId, correctedCategoryId, notes } = body;

    const existingRecord = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Feedback not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: any = {};

    if (predictionId !== undefined) {
      if (predictionId !== null) {
        const parsed = parseInt(predictionId);
        if (isNaN(parsed)) {
          return NextResponse.json(
            { error: 'predictionId must be a valid integer or null', code: 'INVALID_PREDICTION_ID' },
            { status: 400 }
          );
        }
        updates.predictionId = parsed;
      } else {
        updates.predictionId = null;
      }
    }

    if (originalCategoryId !== undefined) {
      if (originalCategoryId !== null) {
        const parsed = parseInt(originalCategoryId);
        if (isNaN(parsed)) {
          return NextResponse.json(
            { error: 'originalCategoryId must be a valid integer or null', code: 'INVALID_ORIGINAL_CATEGORY_ID' },
            { status: 400 }
          );
        }
        updates.originalCategoryId = parsed;
      } else {
        updates.originalCategoryId = null;
      }
    }

    if (correctedCategoryId !== undefined) {
      const parsed = parseInt(correctedCategoryId);
      if (isNaN(parsed)) {
        return NextResponse.json(
          { error: 'correctedCategoryId must be a valid integer', code: 'INVALID_CORRECTED_CATEGORY_ID' },
          { status: 400 }
        );
      }
      updates.correctedCategoryId = parsed;
    }

    if (notes !== undefined) {
      updates.notes = notes ? notes.trim() : null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update', code: 'NO_UPDATES' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(feedback)
      .set(updates)
      .where(eq(feedback.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Feedback not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PATCH feedback error:', error);
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

    const existingRecord = await db
      .select()
      .from(feedback)
      .where(eq(feedback.id, parseInt(id)))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Feedback not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(feedback)
      .where(eq(feedback.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: 'Feedback deleted successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}