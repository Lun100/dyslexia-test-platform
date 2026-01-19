import { NextRequest, NextResponse } from 'next/server';
import { getAllQuestions, writeAllQuestions } from '@/lib/questions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const setId = searchParams.get('setId');

    if (!category || !setId) {
      return NextResponse.json({ error: 'Category and setId are required' }, { status: 400 });
    }

    const allQuestions = await getAllQuestions();
    const categoryData = allQuestions[category];
    if (!categoryData) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const nextSets = categoryData.sets.filter((set) => set.id !== setId);
    if (nextSets.length === categoryData.sets.length) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 });
    }

    allQuestions[category] = { ...categoryData, sets: nextSets };
    await writeAllQuestions(allQuestions);

    return NextResponse.json({ message: 'Set deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[questions][sets][DELETE] Failed to delete set:', error);
    return NextResponse.json({ error: 'Failed to delete set' }, { status: 500 });
  }
}
