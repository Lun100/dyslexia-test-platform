
import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const questionsFilePath = path.join(process.cwd(), 'app', 'data', 'questions.json');

interface Question {
  id: number;
  text: string;
}

// New interface for the entire data structure
interface AllQuestions {
  [category: string]: Question[];
}

// Helper function to read questions safely
async function getQuestions(): Promise<AllQuestions> {
  try {
    const data = await fs.readFile(questionsFilePath, 'utf8');
    // If the file is empty, JSON.parse will fail. Return a default structure.
    if (data.trim() === '') {
      return { general: [], 'rapid-reading-3-min': [] };
    }
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If file does not exist, return default structure
      return { general: [], 'rapid-reading-3-min': [] };
    }
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const allQuestions = await getQuestions();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    if (category) {
      const categoryQuestions = allQuestions[category] || [];
      return NextResponse.json(categoryQuestions);
    }

    // For backward compatibility with the manage page, flatten all questions
    const flattenedQuestions = Object.values(allQuestions).flat();
    return NextResponse.json(flattenedQuestions);
  } catch (error) {
    console.error('Failed to read questions:', error);
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

    const allQuestions = await getQuestions();

    if (!allQuestions[category]) {
      // If the category doesn't exist, create it.
      allQuestions[category] = [];
    }

    // Find the max ID across ALL questions to ensure uniqueness
    const allIds = Object.values(allQuestions).flat().map(q => q.id);
    const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;

    const newQuestion: Question = {
      id: maxId + 1,
      text,
    };

    allQuestions[category].push(newQuestion);

    await fs.writeFile(questionsFilePath, JSON.stringify(allQuestions, null, 2));

    return NextResponse.json({ message: 'Question added successfully', question: newQuestion }, { status: 201 });

  } catch (error) {
    console.error('Failed to write question:', error);
    return NextResponse.json({ error: 'Failed to write question' }, { status: 500 });
  }
}
