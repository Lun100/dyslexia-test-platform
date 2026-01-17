'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const categoryDisplayNames: { [key: string]: string } = {
  'general': '通用问题测试',
  'rapid-reading-3-min': '三分钟快速阅读测试',
};

export default function TestSelectionPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/questions/categories');
        if (!response.ok) {
          throw new Error('获取测试分类失败');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

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

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 py-10 font-sans dark:bg-black">
      <main className="w-full max-w-2xl flex-col items-center justify-center gap-8 p-8">
        <h1 className="mb-8 text-center text-4xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
          选择一个测试
        </h1>
        <div className="w-full space-y-4">
          {categories.length > 0 ? (
            categories.map((category) => (
              <Link href={`/test/${category}`} key={category}>
                <div className="block w-full rounded-lg bg-white p-6 text-center text-xl font-semibold text-blue-600 shadow-md transition-transform hover:scale-105 hover:bg-blue-50 dark:bg-zinc-900 dark:text-blue-400 dark:hover:bg-zinc-800">
                  {categoryDisplayNames[category] || category}
                </div>
              </Link>
            ))
          ) : (
            <p className="text-center text-zinc-600 dark:text-zinc-400">
              没有可用的测试。请先 <a href="/upload" className="underline">上传题目</a>。
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
