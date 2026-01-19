
import { NextRequest, NextResponse } from 'next/server';
import {
  flattenQuestions,
  getAllQuestions,
  getMaxQuestionId,
  writeAllQuestions,
} from '@/lib/questions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log('[questions][GET] url=', req.url);
    const allQuestions = await getAllQuestions();
    console.log('[questions][GET] categories=', Object.keys(allQuestions));
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const randomSet = searchParams.get('randomSet');
    const flatten = searchParams.get('flatten');

    if (category) {
      const categoryData = allQuestions[category];

      if (!categoryData) {
        return NextResponse.json({ sets: [] });
      }

      if (randomSet === '1') {
        const availableSets = categoryData.sets.filter((set) => set.questions.length > 0);
        if (availableSets.length === 0) {
          return NextResponse.json({ setId: null, setName: null, questions: [] });
        }
        const randomIndex = Math.floor(Math.random() * availableSets.length);
        const selectedSet = availableSets[randomIndex];
        console.log('[questions][GET] random set=', selectedSet.id);
        return NextResponse.json({
          setId: selectedSet.id,
          setName: selectedSet.name,
          questions: selectedSet.questions,
        });
      }

      if (flatten === '1') {
        const flattened = flattenQuestions(allQuestions, category);
        return NextResponse.json(flattened);
      }

      return NextResponse.json(categoryData);
    }

    // For backward compatibility with the manage page, flatten all questions
    const flattenedQuestions = flattenQuestions(allQuestions);
    console.log('[questions][GET] flattened_count=', flattenedQuestions.length);
    return NextResponse.json(flattenedQuestions);
  } catch (error) {
    console.error('[questions][GET] Failed to read questions:', error);
    return NextResponse.json({ error: 'Failed to read questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, category = 'general' } = body; // Default to 'general'

    if (!text) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    const allQuestions = await getAllQuestions();
    if (!allQuestions[category]) {
      allQuestions[category] = { sets: [] };
    }

    const maxId = getMaxQuestionId(allQuestions);
    const newQuestion = {
      id: maxId + 1,
      text,
    };

    if (!allQuestions[category].sets[0]) {
      allQuestions[category].sets.push({
        id: 'set-1',
        name: '测试集 1',
        questions: [],
      });
    }

    allQuestions[category].sets[0].questions.push(newQuestion);

    await writeAllQuestions(allQuestions);

    return NextResponse.json({ message: 'Question added successfully', question: newQuestion }, { status: 201 });

  } catch (error) {
    console.error('Failed to write question:', error);
    return NextResponse.json({ error: 'Failed to write question' }, { status: 500 });
  }
}
