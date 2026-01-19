import { promises as fs } from 'fs';
import path from 'path';

export interface Question {
  id: number;
  text: string;
}

export interface QuestionSet {
  id: string;
  name: string;
  questions: Question[];
}

export interface CategoryData {
  sets: QuestionSet[];
}

export interface AllQuestions {
  [category: string]: CategoryData;
}

const questionsFilePath = path.join(process.cwd(), 'app', 'data', 'questions.json');

const defaultCategories: AllQuestions = {
  general: { sets: [] },
  'rapid-reading-3-min': { sets: [] },
};

const normalizeCategory = (rawCategory: any): CategoryData => {
  if (!rawCategory) {
    return { sets: [] };
  }

  if (Array.isArray(rawCategory)) {
    return {
      sets: [
        {
          id: 'set-1',
          name: '测试集 1',
          questions: rawCategory,
        },
      ],
    };
  }

  if (Array.isArray(rawCategory.sets)) {
    return {
      sets: rawCategory.sets.map((set: any, index: number) => ({
        id: typeof set.id === 'string' ? set.id : `set-${index + 1}`,
        name: typeof set.name === 'string' ? set.name : `测试集 ${index + 1}`,
        questions: Array.isArray(set.questions) ? set.questions : [],
      })),
    };
  }

  return { sets: [] };
};

export const getAllQuestions = async (): Promise<AllQuestions> => {
  try {
    const data = await fs.readFile(questionsFilePath, 'utf8');
    if (data.trim() === '') {
      return { ...defaultCategories };
    }

    const parsed = JSON.parse(data);
    const normalized: AllQuestions = {};

    Object.keys(parsed).forEach((category) => {
      normalized[category] = normalizeCategory(parsed[category]);
    });

    return { ...defaultCategories, ...normalized };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...defaultCategories };
    }
    throw error;
  }
};

export const writeAllQuestions = async (allQuestions: AllQuestions) => {
  await fs.writeFile(questionsFilePath, JSON.stringify(allQuestions, null, 2));
};

export const flattenQuestions = (allQuestions: AllQuestions, category?: string) => {
  const categories = category ? { [category]: allQuestions[category] } : allQuestions;
  return Object.values(categories)
    .flatMap((categoryData) => categoryData?.sets ?? [])
    .flatMap((set) => set.questions);
};

export const getMaxQuestionId = (allQuestions: AllQuestions) => {
  const ids = flattenQuestions(allQuestions).map((question) => question.id);
  return ids.length > 0 ? Math.max(...ids) : 0;
};
