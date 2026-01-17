'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Question {
  id: number;
  text: string;
}

export default function ManagePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/questions');
      if (!response.ok) {
        throw new Error('获取问题失败');
      }
      const data = await response.json();
      setQuestions(data);
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
          管理测试题
        </h1>
        {message && <p className="mb-4 text-center text-zinc-600 dark:text-zinc-400">{message}</p>}
        <div className="space-y-6">
          {questions.length > 0 ? (
            questions.map((question) => (
              <div key={question.id} className="flex items-center justify-between rounded-lg bg-white p-4 shadow-md dark:bg-zinc-900">
                <p className="text-xl text-zinc-900 dark:text-zinc-50">
                  {question.text}
                </p>
                <button
                  onClick={() => handleDelete(question.id)}
                  className="h-10 rounded-md bg-red-600 px-4 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  删除
                </button>
              </div>
            ))
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
