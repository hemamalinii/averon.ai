import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, user } from '@/db/schema';
import { eq, like, or, and, gte, lte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const userId = searchParams.get('user_id');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const conditions = [];

    // Filter by userId (now accepts string)
    if (userId) {
      conditions.push(eq(transactions.userId, userId));
    }

    // Search in description and merchantName
    if (search) {
      const searchCondition = or(
        like(transactions.description, `%${search}%`),
        like(transactions.merchantName, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    // Date range filtering
    if (startDate) {
      try {
        const parsedStartDate = new Date(startDate).toISOString();
        conditions.push(gte(transactions.transactionDate, parsedStartDate));
      } catch (error) {
        return NextResponse.json({ 
          error: 'Invalid start_date format. Use ISO date format (YYYY-MM-DD)',
          code: 'INVALID_START_DATE'
        }, { status: 400 });
      }
    }

    if (endDate) {
      try {
        const parsedEndDate = new Date(endDate).toISOString();
        conditions.push(lte(transactions.transactionDate, parsedEndDate));
      } catch (error) {
        return NextResponse.json({ 
          error: 'Invalid end_date format. Use ISO date format (YYYY-MM-DD)',
          code: 'INVALID_END_DATE'
        }, { status: 400 });
      }
    }

    // Build complete query based on conditions to avoid type reassignment issues
    let results;
    if (conditions.length > 0) {
      results = await db.select()
        .from(transactions)
        .where(and(...conditions))
        .limit(limit)
        .offset(offset);
    } else {
      results = await db.select()
        .from(transactions)
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
    const { userId, description, amount, merchantName, transactionDate } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ 
        error: 'userId is required and must be a string',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ 
        error: 'description is required and must be a non-empty string',
        code: 'MISSING_DESCRIPTION'
      }, { status: 400 });
    }

    // Validate amount if provided
    let parsedAmount = null;
    if (amount !== undefined && amount !== null) {
      parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        return NextResponse.json({ 
          error: 'amount must be a valid number',
          code: 'INVALID_AMOUNT'
        }, { status: 400 });
      }
    }

    // Validate userId exists in user table
    const userExists = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (userExists.length === 0) {
      return NextResponse.json({ 
        error: 'User with specified userId does not exist',
        code: 'USER_NOT_FOUND'
      }, { status: 400 });
    }

    // Prepare transaction data
    const now = new Date().toISOString();
    const transactionData = {
      userId: userId,
      description: description.trim(),
      amount: parsedAmount,
      merchantName: merchantName ? merchantName.trim() : null,
      transactionDate: transactionDate || now,
      createdAt: now,
      updatedAt: now
    };

    // Insert transaction
    const newTransaction = await db.insert(transactions)
      .values(transactionData)
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle foreign key constraint errors
    if ((error as Error).message.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json({ 
        error: 'Invalid userId: User does not exist',
        code: 'FOREIGN_KEY_VIOLATION'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}