import { NextRequest, NextResponse } from 'next/server';
import { getAllQuestions, getMaxQuestionId, writeAllQuestions } from '@/lib/questions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, category, setName } = body;

    if (!content || !category) {
      return NextResponse.json({ error: 'File content and category are required' }, { status: 400 });
    }

    const allQuestions = await getAllQuestions();

    if (!allQuestions[category]) {
      allQuestions[category] = { sets: [] };
    }

    const sentences = content.split('\n').filter((line: string) => line.trim() !== '');
    if (sentences.length === 0) {
      return NextResponse.json({ error: 'File content is empty or invalid' }, { status: 400 });
    }

    let maxId = getMaxQuestionId(allQuestions);
    let nextSetIndex = allQuestions[category].sets.length + 1;
    let insertedCount = 0;
    const trimmedSetName = typeof setName === 'string' ? setName.trim() : '';

    const shouldChunk = category === 'rapid-reading-3-min' && sentences.length > 100;
    const chunkSize = shouldChunk ? 100 : sentences.length;

    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunk = sentences.slice(i, i + chunkSize);
      const questions = chunk.map((sentence: string) => {
        maxId += 1;
        return {
          id: maxId,
          text: sentence.trim(),
        };
      });

      const setNumber = nextSetIndex;
      const resolvedSetName = trimmedSetName
        ? shouldChunk
          ? `${trimmedSetName} ${setNumber}`
          : trimmedSetName
        : `测试集 ${setNumber}`;

      allQuestions[category].sets.push({
        id: `set-${nextSetIndex}`,
        name: resolvedSetName,
        questions,
      });

      nextSetIndex += 1;
      insertedCount += questions.length;
    }

    await writeAllQuestions(allQuestions);

    return NextResponse.json(
      { message: `${insertedCount} questions added successfully to category '${category}'` },
      { status: 201 },
    );

  } catch (error) {
    console.error('Failed to bulk write questions:', error);
    return NextResponse.json({ error: 'Failed to bulk write questions' }, { status: 500 });
  }
}
