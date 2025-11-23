import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_TAXONOMY = {
  categories: [
    'Groceries',
    'Dining',
    'Fuel',
    'Shopping',
    'Bills',
    'Entertainment',
    'Transport',
    'Healthcare',
    'Other',
  ],
};

let currentTaxonomy = { ...DEFAULT_TAXONOMY };

export async function GET() {
  return NextResponse.json(currentTaxonomy);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categories } = body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'Categories must be a non-empty array' },
        { status: 400 }
      );
    }

    currentTaxonomy = { categories };

    return NextResponse.json({
      success: true,
      taxonomy: currentTaxonomy,
    });
  } catch (error) {
    console.error('Taxonomy update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
