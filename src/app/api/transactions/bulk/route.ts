import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactions: transactionsArray } = body;

    // Validate transactions array exists
    if (!transactionsArray) {
      return NextResponse.json(
        {
          error: 'transactions field is required',
          code: 'MISSING_TRANSACTIONS_FIELD',
        },
        { status: 400 }
      );
    }

    // Validate transactions is an array
    if (!Array.isArray(transactionsArray)) {
      return NextResponse.json(
        {
          error: 'transactions must be an array',
          code: 'INVALID_TRANSACTIONS_TYPE',
        },
        { status: 400 }
      );
    }

    // Validate array is not empty
    if (transactionsArray.length === 0) {
      return NextResponse.json(
        {
          error: 'transactions array cannot be empty',
          code: 'EMPTY_TRANSACTIONS_ARRAY',
        },
        { status: 400 }
      );
    }

    // Validate and prepare each transaction
    const preparedTransactions = [];
    const currentTimestamp = new Date().toISOString();

    for (let i = 0; i < transactionsArray.length; i++) {
      const transaction = transactionsArray[i];

      // Validate required fields
      if (!transaction.userId || typeof transaction.userId !== 'string') {
        return NextResponse.json(
          {
            error: `Transaction at index ${i} is missing required field: userId (must be a string)`,
            code: 'MISSING_USER_ID',
          },
          { status: 400 }
        );
      }

      if (!transaction.description) {
        return NextResponse.json(
          {
            error: `Transaction at index ${i} is missing required field: description`,
            code: 'MISSING_DESCRIPTION',
          },
          { status: 400 }
        );
      }

      // Prepare transaction object
      const preparedTransaction: any = {
        userId: transaction.userId,
        description: transaction.description.trim(),
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
      };

      // Handle optional amount field
      if (transaction.amount !== undefined && transaction.amount !== null) {
        const amount = parseFloat(transaction.amount);
        if (isNaN(amount)) {
          return NextResponse.json(
            {
              error: `Transaction at index ${i} has invalid amount: must be a number`,
              code: 'INVALID_AMOUNT',
            },
            { status: 400 }
          );
        }
        preparedTransaction.amount = amount;
      }

      // Handle optional merchantName field
      if (transaction.merchantName !== undefined && transaction.merchantName !== null) {
        preparedTransaction.merchantName = transaction.merchantName.trim();
      }

      // Handle optional transactionDate field
      if (transaction.transactionDate !== undefined && transaction.transactionDate !== null) {
        preparedTransaction.transactionDate = transaction.transactionDate;
      } else {
        // Default to current timestamp if not provided
        preparedTransaction.transactionDate = currentTimestamp;
      }

      preparedTransactions.push(preparedTransaction);
    }

    // Insert all transactions in a single batch operation
    const insertedTransactions = await db
      .insert(transactions)
      .values(preparedTransactions)
      .returning();

    return NextResponse.json(
      {
        success: true,
        count: insertedTransactions.length,
        transactions: insertedTransactions,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST bulk transactions error:', error);

    // Handle foreign key constraint errors
    if (error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      return NextResponse.json(
        {
          error: 'One or more userId references do not exist',
          code: 'FOREIGN_KEY_CONSTRAINT',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error: ' + error.message,
      },
      { status: 500 }
    );
  }
}