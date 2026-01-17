'use client';

import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

interface Question {
  id: number;
  text: string;
}

// UI for the Rapid Reading Test
const RapidReadingTest = ({ questions }: { questions: Question[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);

  useEffect(() => {
    if (!testStarted || testFinished) return;

    if (timeLeft <= 0) {
      setTestFinished(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, testFinished, timeLeft]);

  const handleAnswer = (answer: boolean) => {
    setAnswers((prev) => ({ ...prev, [questions[currentIndex].id]: answer }));
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setTestFinished(true);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (!testStarted) {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">三分钟快速阅读测试</h2>
        <p className="mb-8 text-lg">准备好后，点击下面的按钮开始测试。</p>
        <button
          onClick={() => setTestStarted(true)}
          className="rounded-full bg-green-600 px-8 py-4 text-2xl font-bold text-white transition-transform hover:scale-105"
        >
          开始测试
        </button>
      </div>
    );
  }

  if (testFinished) {
    const correctCount = Object.values(answers).filter(Boolean).length;
    const incorrectCount = Object.values(answers).length - correctCount;
    return (
      <div className="text-center">
        <h2 className="mb-4 text-3xl font-bold">测试完成！</h2>
        <p className="text-xl">你一共回答了 {Object.keys(answers).length} 个句子。</p>
        {/* You can add more result details here */}
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <div className="fixed right-8 top-8 rounded-full bg-blue-600 px-6 py-3 text-2xl font-bold text-white shadow-lg">
        {formatTime(timeLeft)}
      </div>
      <div className="mb-12 min-h-[100px]">
        <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          {questions[currentIndex].text}
        </p>
      </div>
      <div className="flex justify-center gap-8">
        <button
          onClick={() => handleAnswer(true)}
          className="flex h-32 w-32 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110"
        >
          <Check size={64} />
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="flex h-32 w-32 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
        >
          <X size={64} />
        </button>
      </div>
    </div>
  );
};

// Fallback UI for other test types
const GeneralTest = ({ questions }: { questions: Question[] }) => (
  <div className="space-y-6">
    {questions.length > 0 ? (
      questions.map((question, index) => (
        <div key={question.id} className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-900">
          <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            问题 {index + 1}:
          </p>
          <p className="mt-2 text-xl text-zinc-900 dark:text-zinc-50">
            {question.text}
          </p>
        </div>
      ))
    ) : (
      <p className="text-center text-zinc-600 dark:text-zinc-400">
        没有找到问题。请先 <a href="/upload" className="underline">上传题目</a>。
      </p>
    )}
  </div>
);


export default function TestPage({ params }: { params: { category: string } }) {
  const { category } = params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/questions?category=${category}`);
        if (!response.ok) {
          throw new Error(`获取'${category}'类别的题目失败`);
        }
        const data = await response.json();
        setQuestions(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category]);

  const renderTest = () => {
    if (questions.length === 0 && !loading) {
       return <p className="text-center text-zinc-600 dark:text-zinc-400">
              该分类下没有题目。请先 <a href="/upload" className="underline">上传题目</a>。
            </p>
    }
    switch (category) {
      case 'rapid-reading-3-min':
        return <RapidReadingTest questions={questions} />;
      case 'general':
      default:
        return <GeneralTest questions={questions} />;
    }
  };

  const categoryDisplayNames: { [key: string]: string } = {
      'general': '通用问题测试',
      'rapid-reading-3-min': '三分钟快速阅读测试',
  };


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 py-10 font-sans dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 p-8">
         <h1 className="mb-4 text-center text-4xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
          {categoryDisplayNames[category] || '测试'}
        </h1>
        {loading && <p>加载题目中...</p>}
        {error && <p>错误: {error}</p>}
        {!loading && !error && renderTest()}
         <div className="mt-12 text-center">
          <Link href="/test">
            <span className="text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
              返回测试列表
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
