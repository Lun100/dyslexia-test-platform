
import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const questionsFilePath = path.join(process.cwd(), 'app', 'data', 'questions.json');

interface Question {
  id: number;
  text: string;
}

interface AllQuestions {
  [category: string]: Question[];
}

// Helper function to read questions safely
async function getQuestions(): Promise<AllQuestions> {
  try {
    const data = await fs.readFile(questionsFilePath, 'utf8');
    if (data.trim() === '') {
      return { general: [], 'rapid-reading-3-min': [] };
    }
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { general: [], 'rapid-reading-3-min': [] };
    }
    throw error;
  }
}


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

    const allQuestions = await getQuestions();
    let questionFound = false;

    // Find the question and remove it
    for (const category in allQuestions) {
      const questionsInCategory = allQuestions[category];
      const questionIndex = questionsInCategory.findIndex(q => q.id === idToDelete);

      if (questionIndex !== -1) {
        questionsInCategory.splice(questionIndex, 1);
        questionFound = true;
        break; // Stop searching once found and removed
      }
    }

    if (!questionFound) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    await fs.writeFile(questionsFilePath, JSON.stringify(allQuestions, null, 2));

    return NextResponse.json({ message: 'Question deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Failed to delete question:', error);
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 });
  }
}
