import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq, isNull, or, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('user_id');
    const includeDefaults = searchParams.get('include_defaults');

    // Build query conditionally to avoid type issues
    let results;
    
    if (userId) {
      if (includeDefaults === 'true') {
        // Include both user-specific and default categories
        results = await db.select()
          .from(categories)
          .where(
            or(
              eq(categories.userId, userId),
              isNull(categories.userId)
            )
          )
          .limit(limit)
          .offset(offset);
      } else {
        // Only user-specific categories
        results = await db.select()
          .from(categories)
          .where(eq(categories.userId, userId))
          .limit(limit)
          .offset(offset);
      }
    } else {
      // If no userId provided, return all categories
      results = await db.select()
        .from(categories)
        .limit(limit)
        .offset(offset);
    }

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, colorHex, icon, userId } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ 
        error: 'Name is required and cannot be empty',
        code: 'MISSING_NAME' 
      }, { status: 400 });
    }

    if (!colorHex || typeof colorHex !== 'string') {
      return NextResponse.json({ 
        error: 'Color hex is required',
        code: 'MISSING_COLOR_HEX' 
      }, { status: 400 });
    }

    // Validate colorHex format (hex color pattern)
    const hexColorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorPattern.test(colorHex)) {
      return NextResponse.json({ 
        error: 'Invalid color hex format. Expected format: #RRGGBB or #RGB',
        code: 'INVALID_COLOR_HEX' 
      }, { status: 400 });
    }

    // Validate userId if provided
    let validatedUserId: string | null = null;
    if (userId !== undefined && userId !== null) {
      if (typeof userId !== 'string') {
        return NextResponse.json({ 
          error: 'Invalid userId format - must be a string',
          code: 'INVALID_USER_ID' 
        }, { status: 400 });
      }
      validatedUserId = userId;
    }

    // Prepare insert data
    const insertData = {
      name: name.trim(),
      description: description ? description.trim() : null,
      colorHex: colorHex.trim(),
      icon: icon ? icon.trim() : null,
      userId: validatedUserId,
      createdAt: new Date().toISOString()
    };

    // Insert category
    const newCategory = await db.insert(categories)
      .values(insertData)
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);

    // Handle duplicate name error
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ 
        error: 'Category name already exists',
        code: 'DUPLICATE_NAME' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}