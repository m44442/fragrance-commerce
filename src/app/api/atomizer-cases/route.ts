// src/app/api/atomizer-cases/route.ts
import { NextResponse } from 'next/server';
import { getAtomizerCases } from '@/lib/microcms/client';

export async function GET() {
  try {
    const atomizerCases = await getAtomizerCases();
    return NextResponse.json(atomizerCases);
  } catch (error) {
    console.error('Failed to fetch atomizer cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch atomizer cases' },
      { status: 500 }
    );
  }
}