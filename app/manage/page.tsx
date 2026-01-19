'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Question {
  id: number;
  text: string;
}

interface QuestionSet {
  id: string;
  name: string;
  questions: Question[];
}

interface CategoryData {
  sets: QuestionSet[];
}

export default function ManagePage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesData, setCategoriesData] = useState<Record<string, CategoryData>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [collapsedSets, setCollapsedSets] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const categoriesResponse = await fetch('/api/questions/categories', { cache: 'no-store' });
      if (!categoriesResponse.ok) {
        throw new Error('获取测试分类失败');
      }
      const categoriesData: string[] = await categoriesResponse.json();
      const normalizedCategories = Array.from(
        new Set([...categoriesData, 'number-naming']),
      );
      setCategories(normalizedCategories);

      const questionsEntries = await Promise.all(
        categoriesData.map(async (category) => {
          const response = await fetch(
            `/api/questions?category=${encodeURIComponent(category)}`,
            { cache: 'no-store' },
          );
          if (!response.ok) {
            throw new Error(`获取'${category}'类别的问题失败`);
          }
          const data: CategoryData = await response.json();
          return [category, data] as const;
        }),
      );

      const nextCategoriesData: Record<string, CategoryData> = Object.fromEntries(questionsEntries);

      const gridResponse = await fetch('/api/number-grid', { cache: 'no-store' });
      if (gridResponse.ok) {
        const gridData: number[][] = await gridResponse.json();
        if (Array.isArray(gridData) && gridData.length > 0) {
          const flattened = gridData.flat();
          nextCategoriesData['number-naming'] = {
            sets: [
              {
                id: 'number-grid',
                name: '数字表格',
                questions: flattened.map((value, index) => ({
                  id: index + 1,
                  text: String(value),
                })),
              },
            ],
          };
        } else {
          nextCategoriesData['number-naming'] = { sets: [] };
        }
      }

      setCategoriesData(nextCategoriesData);
      setCollapsedCategories((prev) => {
        const next: Record<string, boolean> = { ...prev };
        normalizedCategories.forEach((category) => {
          if (next[category] === undefined) {
            next[category] = false;
          }
        });
        return next;
      });
      setCollapsedSets((prev) => {
        const next: Record<string, boolean> = { ...prev };
        Object.values(nextCategoriesData).forEach((categoryData) => {
          categoryData.sets.forEach((set) => {
            if (next[set.id] === undefined) {
              next[set.id] = false;
            }
          });
        });
        return next;
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id: number) => {
    console.log('Deleting question with ID:', id);
    if (!confirm('确定要删除这个问题吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('问题删除成功！');
        // Refresh the questions list
        fetchQuestions();
      } else {
        setMessage(`删除失败: ${result.error}`);
      }
    } catch (error) {
      setMessage('删除时发生错误');
      console.error(error);
    }
  };

  const handleDeleteSet = async (category: string, setId: string) => {
    if (!confirm('确定要删除这个测试集吗？该测试集的所有题目将被移除。')) {
      return;
    }

    try {
      const response =
        category === 'number-naming'
          ? await fetch('/api/number-grid', { method: 'DELETE' })
          : await fetch(
              `/api/questions/sets?category=${encodeURIComponent(category)}&setId=${encodeURIComponent(setId)}`,
              { method: 'DELETE' },
            );

      const result = await response.json();

      if (response.ok) {
        setMessage('测试集删除成功！');
        fetchQuestions();
      } else {
        setMessage(`删除失败: ${result.error}`);
      }
    } catch (error) {
      setMessage('删除时发生错误');
      console.error(error);
    }
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleSet = (setId: string) => {
    setCollapsedSets((prev) => ({
      ...prev,
      [setId]: !prev[setId],
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>错误: {error}</p>
      </div>
    );
  }

  const categoryDisplayNames: { [key: string]: string } = {
    general: '通用问题测试',
    'rapid-reading-3-min': '三分钟快速阅读测试',
    'number-naming': '数字快速命名测验',
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 py-10 font-sans dark:bg-black">
      <main className="w-full max-w-2xl flex-col items-center justify-center gap-8 p-8">
        <h1 className="mb-8 text-center text-4xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
          管理测试题
        </h1>
        {message && <p className="mb-4 text-center text-zinc-600 dark:text-zinc-400">{message}</p>}
        <div className="space-y-10">
          {categories.length > 0 ? (
            categories.map((category) => {
              const categoryData = categoriesData[category];
              const sets = categoryData?.sets ?? [];
              const totalQuestions = sets.reduce((sum, set) => sum + set.questions.length, 0);
              const isCollapsed = collapsedCategories[category];
              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
                        {categoryDisplayNames[category] || category}
                      </h2>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        aria-expanded={!isCollapsed}
                        aria-controls={`category-${category}`}
                      >
                        {isCollapsed ? '展开' : '收起'}
                      </button>
                    </div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {totalQuestions} 题
                    </span>
                  </div>
                  {!isCollapsed && (
                    <div id={`category-${category}`}>
                      {sets.length > 0 ? (
                        <div className="space-y-6">
                          {sets.map((set) => {
                            const isSetCollapsed = collapsedSets[set.id];
                            return (
                              <div key={set.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                                      {set.name}
                                    </h3>
                                    <button
                                      type="button"
                                      onClick={() => toggleSet(set.id)}
                                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                      aria-expanded={!isSetCollapsed}
                                      aria-controls={`set-${set.id}`}
                                    >
                                      {isSetCollapsed ? '展开' : '收起'}
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                      {set.questions.length} 题
                                    </span>
                                    <button
                                      onClick={() => handleDeleteSet(category, set.id)}
                                      className="h-9 rounded-md bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700"
                                    >
                                      删除测试集
                                    </button>
                                  </div>
                                </div>
                                {!isSetCollapsed && (
                                  <div id={`set-${set.id}`} className="mt-4 space-y-3">
                                    {category === 'number-naming' ? (
                                      <div className="grid gap-2 sm:grid-cols-6">
                                        {set.questions.map((question) => (
                                          <div
                                            key={question.id}
                                            className="rounded-md bg-zinc-100 py-2 text-center text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                                          >
                                            {question.text}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      set.questions.map((question) => (
                                        <div key={question.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-zinc-900">
                                          <p className="text-base text-zinc-900 dark:text-zinc-50">
                                            {question.text}
                                          </p>
                                          <button
                                            onClick={() => handleDelete(question.id)}
                                            className="h-9 rounded-md bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700"
                                          >
                                            删除
                                          </button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-center text-zinc-600 dark:text-zinc-400">
                          该分类下没有题目。请先 <a href="/upload" className="underline">上传题目</a>。
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center text-zinc-600 dark:text-zinc-400">
              没有找到问题。请先 <a href="/upload" className="underline">上传题目</a>。
            </p>
          )}
        </div>
        <div className="mt-8 text-center">
          <Link href="/">
            <span className="text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
              返回主页
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
