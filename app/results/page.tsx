'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface TestResult {
  id: string;
  user_id: string;
  category: string;
  set_id: string | null;
  set_name: string | null;
  answers: { questionId: number; questionText?: string; answer: boolean }[];
  audio_path: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_seconds: number | null;
  total_questions: number | null;
  answered_count: number | null;
  created_at: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [questionsByCategory, setQuestionsByCategory] = useState<
    Record<string, Record<number, string>>
  >({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) {
          setError('请先登录');
          return;
        }

        const response = await fetch('/api/results', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        });

        if (response.status === 403) {
          setError('没有权限查看测试数据');
          return;
        }

        if (!response.ok) {
          setError('获取测试数据失败');
          return;
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error('[results][page] error', err);
        setError('获取测试数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  useEffect(() => {
    const fetchQuestions = async () => {
      const categories = Array.from(new Set(results.map((result) => result.category))).filter(
        (category) => category !== 'number-naming',
      );
      const nextMap: Record<string, Record<number, string>> = {};

      await Promise.all(
        categories.map(async (category) => {
          try {
            const response = await fetch(
              `/api/questions?category=${encodeURIComponent(category)}&flatten=1`,
              { cache: 'no-store' },
            );
            if (!response.ok) {
              return;
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
              return;
            }
            nextMap[category] = Object.fromEntries(
              data.map((q) => [q.id, q.text]),
            );
          } catch (err) {
            console.error('[results][questions] error', err);
          }
        }),
      );

      setQuestionsByCategory(nextMap);
    };

    if (results.length > 0) {
      fetchQuestions();
    }
  }, [results]);

  useEffect(() => {
    const fetchAudioUrls = async () => {
      const urls: Record<string, string> = {};
      await Promise.all(
        results.map(async (result) => {
          if (!result.audio_path) return;
          const { data, error } = await supabase.storage
            .from('recordings')
            .createSignedUrl(result.audio_path, 60 * 60);
          if (!error && data?.signedUrl) {
            urls[result.id] = data.signedUrl;
          }
        }),
      );
      setAudioUrls(urls);
    };

    if (results.length > 0) {
      fetchAudioUrls();
    }
  }, [results]);

  const toggleExpanded = (resultId: string) => {
    setExpandedResults((prev) => ({
      ...prev,
      [resultId]: !prev[resultId],
    }));
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 py-10 font-sans dark:bg-black">
      <main className="w-full max-w-4xl space-y-6 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">测试数据</h1>
          <Link className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400" href="/">
            返回主页
          </Link>
        </div>
        {loading && <p>加载中...</p>}
        {error && <p className="text-zinc-600 dark:text-zinc-400">{error}</p>}
        {!loading && !error && (
          <div className="space-y-4">
            {results.length > 0 ? (
              results.map((result) => (
                <div key={result.id} className="rounded-lg bg-white p-4 shadow-md dark:bg-zinc-900">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      用户: {result.user_id}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      分类: {result.category}
                    </div>
                    {result.set_name && (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        测试集: {result.set_name}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    回答题数: {result.answered_count ?? 0} / {result.total_questions ?? 0} |
                    用时: {result.duration_seconds ?? 0} 秒
                  </div>
                  {result.audio_path && (
                    <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                      <div className="mb-2">录音：</div>
                      {audioUrls[result.id] ? (
                        <audio controls src={audioUrls[result.id]} className="w-full" />
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">录音加载中...</span>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(result.id)}
                    className="mt-3 text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {expandedResults[result.id] ? '收起答题详情' : '展开答题详情'}
                  </button>
                  {expandedResults[result.id] && (
                    <div className="mt-4 space-y-3">
                      {result.answers.length > 0 ? (
                        result.answers.map((answer, index) => {
                          const questionText =
                            answer.questionText ||
                            questionsByCategory[result.category]?.[answer.questionId] ||
                            `题目 ${answer.questionId}`;
                          return (
                            <div
                              key={`${result.id}-${answer.questionId}-${index}`}
                              className="rounded-md border border-zinc-200 p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                            >
                              <div className="font-medium text-zinc-900 dark:text-zinc-50">
                                {questionText}
                              </div>
                              <div className="mt-1">
                                学生答案: {answer.answer ? '是' : '否'}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">暂无答题明细。</p>
                      )}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    提交时间: {new Date(result.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-600 dark:text-zinc-400">暂无测试数据。</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
