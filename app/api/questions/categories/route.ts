import { NextResponse } from 'next/server';
import { getAllQuestions } from '@/lib/questions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allQuestions = await getAllQuestions();
    const categories = Object.keys(allQuestions);
    console.log('[questions][categories][GET] categories=', categories);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('[questions][categories][GET] Failed to read categories:', error);
    return NextResponse.json({ error: 'Failed to read categories' }, { status: 500 });
  }
}
