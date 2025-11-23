import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { like, or } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');

    let query = db.select().from(users);

    if (search) {
      query = query.where(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    const results = await query.limit(limit).offset(offset);

    // Remove passwordHash from all results
    const usersWithoutPasswords = results.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(usersWithoutPasswords, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password } = body;

    // Validate required fields
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required and cannot be empty', code: 'MISSING_EMAIL' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required and cannot be empty', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { error: 'Password is required and cannot be empty', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const timestamp = new Date().toISOString();
    
    try {
      const newUser = await db.insert(users)
        .values({
          email: sanitizedEmail,
          name: sanitizedName,
          passwordHash,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning();

      // Remove passwordHash from response
      const { passwordHash: _, ...userWithoutPassword } = newUser[0];

      return NextResponse.json(userWithoutPassword, { status: 201 });
    } catch (dbError: any) {
      // Handle duplicate email error
      if (dbError.message && (dbError.message.includes('UNIQUE') || dbError.message.includes('unique'))) {
        return NextResponse.json(
          { error: 'Email already exists', code: 'DUPLICATE_EMAIL' },
          { status: 400 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}