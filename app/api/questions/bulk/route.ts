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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, category } = body;

    if (!content || !category) {
      return NextResponse.json({ error: 'File content and category are required' }, { status: 400 });
    }

    const allQuestions = await getQuestions();

    if (!allQuestions[category]) {
      allQuestions[category] = [];
    }

    const sentences = content.split('\n').filter((line: string) => line.trim() !== '');
    if (sentences.length === 0) {
      return NextResponse.json({ error: 'File content is empty or invalid' }, { status: 400 });
    }

    // Find the max ID across ALL questions to ensure uniqueness
    let maxId = 0;
    Object.values(allQuestions).flat().forEach(q => {
        if(q.id > maxId) {
            maxId = q.id;
        }
    });

    const newQuestions: Question[] = sentences.map((sentence: string, index: number) => {
      return {
        id: maxId + 1 + index,
        text: sentence.trim(),
      };
    });

    allQuestions[category].push(...newQuestions);

    await fs.writeFile(questionsFilePath, JSON.stringify(allQuestions, null, 2));

    return NextResponse.json({ message: `${newQuestions.length} questions added successfully to category '${category}'` }, { status: 201 });

  } catch (error) {
    console.error('Failed to bulk write questions:', error);
    return NextResponse.json({ error: 'Failed to bulk write questions' }, { status: 500 });
  }
}
