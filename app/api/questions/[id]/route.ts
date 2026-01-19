
import { NextRequest, NextResponse } from 'next/server';
import { getAllQuestions, writeAllQuestions } from '@/lib/questions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await (context as any).params; // The error indicates params is a Promise
    const idToDelete = parseInt(params.id, 10);

    if (isNaN(idToDelete)) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }

    const allQuestions = await getAllQuestions();
    let questionFound = false;

    // Find the question and remove it
    for (const category in allQuestions) {
      const categorySets = allQuestions[category].sets;
      for (const set of categorySets) {
        const questionIndex = set.questions.findIndex(q => q.id === idToDelete);
        if (questionIndex !== -1) {
          set.questions.splice(questionIndex, 1);
          questionFound = true;
          break;
        }
      }
      if (questionFound) {
        break;
      }
    }

    if (!questionFound) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    await writeAllQuestions(allQuestions);

    return NextResponse.json({ message: 'Question deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
