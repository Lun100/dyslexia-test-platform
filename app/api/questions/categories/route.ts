import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const questionsFilePath = path.join(process.cwd(), 'app', 'data', 'questions.json');

interface AllQuestions {
  [category: string]: any[];
}

export async function GET() {
  try {
    let categories: string[] = [];
    try {
      const data = await fs.readFile(questionsFilePath, 'utf8');
      if (data.trim() === '') {
        categories = [];
      } else {
        const allQuestions: AllQuestions = JSON.parse(data);
        categories = Object.keys(allQuestions);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
      // If file does not exist, return empty array
    }
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to read categories:', error);
    return NextResponse.json({ error: 'Failed to read categories' }, { status: 500 });
  }
}
