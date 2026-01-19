'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

interface Question {
  id: number;
  text: string;
}

// UI for the Rapid Reading Test
const RapidReadingTest = ({
  questions,
  category,
  setName,
  setId,
}: {
  questions: Question[];
  category: string;
  setName: string | null;
  setId: string | null;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [showIntro, setShowIntro] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [testStartedAt, setTestStartedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'no-session'>(
    'idle',
  );

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

  useEffect(() => {
    if (!testFinished || saveStatus !== 'idle') return;

    const submitResults = async () => {
      setSaveStatus('saving');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setSaveStatus('no-session');
        return;
      }

      const questionTextMap = new Map(questions.map((question) => [question.id, question.text]));
      const payload = {
        category,
        setId,
        setName,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId: Number(questionId),
          questionText: questionTextMap.get(Number(questionId)) || '',
          answer,
        })),
        startedAt: testStartedAt,
        finishedAt: new Date().toISOString(),
        durationSeconds: Math.max(0, 180 - timeLeft),
        totalQuestions: questions.length,
        answeredCount: Object.keys(answers).length,
      };

      try {
        const response = await fetch('/api/results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          setSaveStatus('error');
          return;
        }

        setSaveStatus('saved');
      } catch (error) {
        console.error('[test][submitResults] error', error);
        setSaveStatus('error');
      }
    };

    submitResults();
  }, [answers, category, questions.length, saveStatus, testFinished, testStartedAt, timeLeft]);

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

  if (showIntro && !testStarted) {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">三分钟快速阅读测试</h2>
        {setName && (
          <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">测试集：{setName}</p>
        )}
        <p className="mb-8 text-lg leading-relaxed">
          一共有3分钟的时间进行阅读，题目很多，肯定做不完的，所以没做完也没关系，只要尽快做就好了。
        </p>
        <button
          onClick={() => {
            setShowIntro(false);
            setTestStartedAt(new Date().toISOString());
            setTestStarted(true);
          }}
          className="rounded-full bg-green-600 px-8 py-4 text-2xl font-bold text-white transition-transform hover:scale-105"
        >
          开始测试
        </button>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">三分钟快速阅读测试</h2>
        {setName && (
          <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">测试集：{setName}</p>
        )}
        <p className="mb-8 text-lg">准备好后，点击下面的按钮开始测试。</p>
        <button
          onClick={() => setShowIntro(true)}
          className="rounded-full bg-green-600 px-8 py-4 text-2xl font-bold text-white transition-transform hover:scale-105"
        >
          开始测试
        </button>
      </div>
    );
  }

  if (testFinished) {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-3xl font-bold">测试完成！</h2>
        <p className="text-xl">你一共回答了 {Object.keys(answers).length} 个句子。</p>
        {saveStatus === 'saving' && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">正在保存测试结果...</p>
        )}
        {saveStatus === 'saved' && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">测试结果已保存。</p>
        )}
        {saveStatus === 'no-session' && (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
            请先 <a className="underline" href="/login">登录</a> 以保存测试结果。
          </p>
        )}
        {saveStatus === 'error' && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">测试结果保存失败。</p>
        )}
        {/* You can add more result details here */}
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      <div className="fixed right-8 top-8 rounded-full bg-blue-600 px-6 py-3 text-2xl font-bold text-white shadow-lg">
        {formatTime(timeLeft)}
      </div>
      {setName && (
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">测试集：{setName}</p>
      )}
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

const NumberNamingTest = ({
  grid,
  category,
}: {
  grid: number[][];
  category: string;
}) => {
  const [showIntro, setShowIntro] = useState(true);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'no-session'>(
    'idle',
  );
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testStartedAt, setTestStartedAt] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startTimer = () => {
    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    if (typeof window === 'undefined' || !('MediaRecorder' in window)) {
      throw new Error('当前浏览器不支持录音');
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.start();
    recorderRef.current = recorder;
  };

  const stopRecording = async () => {
    const recorder = recorderRef.current;
    if (!recorder) {
      return null;
    }

    return new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        resolve(blob);
      };
      recorder.stop();
    });
  };

  const handleStart = async () => {
    setShowIntro(false);
    setTestStarted(true);
    setTestFinished(false);
    setTestStartedAt(new Date().toISOString());
    setElapsedSeconds(0);
    setRecordingError(null);
    setSaveError(null);
    startTimer();
    try {
      await startRecording();
    } catch (error) {
      console.error('[number-naming][recording] error', error);
      setRecordingError('无法开始录音，请检查麦克风权限或浏览器支持。');
      setSaveStatus('error');
    }
  };

  const handleStop = async () => {
    stopTimer();
    setTestStarted(false);
    setTestFinished(true);

    if (!recorderRef.current) {
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');

    try {
      const audioBlob = await stopRecording();
      if (!audioBlob) {
        setSaveStatus('error');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      const accessToken = sessionData.session?.access_token;

      if (!user || !accessToken) {
        setSaveStatus('no-session');
        return;
      }

      const fileName = `${Date.now()}.webm`;
      const filePath = `${user.id}/${category}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filePath, audioBlob, { contentType: 'audio/webm' });

      if (uploadError) {
        console.error('[number-naming][upload] error', uploadError);
        setSaveError(uploadError.message);
        setSaveStatus('error');
        return;
      }

      const payload = {
        category,
        answers: [],
        audioPath: filePath,
        startedAt: testStartedAt,
        finishedAt: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        totalQuestions: 0,
        answeredCount: 0,
      };

      const response = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        if (result?.error) {
          setSaveError(result.error);
        }
        setSaveStatus('error');
        return;
      }

      setSaveStatus('saved');
    } catch (error) {
      console.error('[number-naming][save] error', error);
      setSaveError('保存失败，请重试。');
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, []);

  if (grid.length === 0) {
    return <p className="text-center text-zinc-600 dark:text-zinc-400">没有可用的数字表格。</p>;
  }

  if (showIntro) {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">数字快速命名测验</h2>
        <p className="mb-8 text-lg leading-relaxed">
          按顺序读完屏幕上的所有数字，读完了就按结束的按钮。
        </p>
        {recordingError && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{recordingError}</p>
        )}
        <button
          onClick={handleStart}
          className="rounded-full bg-green-600 px-8 py-4 text-2xl font-bold text-white transition-transform hover:scale-105"
        >
          开始测试
        </button>
      </div>
    );
  }

  if (testFinished) {
    return (
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">数字快速命名测验</h2>
        <p className="mb-4 text-lg">完成时间：{elapsedSeconds} 秒</p>
        {saveStatus !== 'idle' && (
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {saveStatus === 'saving' && '正在保存录音和结果...'}
            {saveStatus === 'saved' && '录音和结果已保存。'}
            {saveStatus === 'no-session' && (
              <span>
                请先 <a className="underline" href="/login">登录</a> 以保存测试结果。
              </span>
            )}
            {saveStatus === 'error' && (saveError || '保存失败，请重试。')}
          </div>
        )}
        <button
          onClick={() => {
            setShowIntro(true);
            setSaveStatus('idle');
          }}
          className="mt-6 rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-transform hover:scale-105"
        >
          再测一次
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          计时：{elapsedSeconds}s
        </div>
        <button
          onClick={handleStop}
          className="rounded-full bg-red-600 px-6 py-3 text-base font-semibold text-white transition-transform hover:scale-105"
        >
          结束
        </button>
      </div>
      <div
        className="grid gap-3 rounded-2xl bg-white p-6 text-center text-2xl font-semibold text-zinc-900 shadow-md dark:bg-zinc-900 dark:text-zinc-50"
        style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 1}, minmax(0, 1fr))` }}
      >
        {grid.flatMap((row, rowIndex) =>
          row.map((value, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="rounded-lg bg-zinc-100 py-4 dark:bg-zinc-800"
            >
              {value}
            </div>
          )),
        )}
      </div>
    </div>
  );
};


export default function TestPage() {
  const params = useParams();
  const category = typeof params?.category === 'string' ? params.category : '';
  const [questions, setQuestions] = useState<Question[]>([]);
  const [setName, setSetName] = useState<string | null>(null);
  const [setId, setSetId] = useState<string | null>(null);
  const [numberGrid, setNumberGrid] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;
    const fetchQuestions = async () => {
      try {
        console.log('[test][fetchQuestions] category=', category);
        if (category === 'number-naming') {
          const response = await fetch('/api/number-grid', { cache: 'no-store' });
          if (!response.ok) {
            throw new Error('获取数字表格失败');
          }
          const data = await response.json();
          setNumberGrid(Array.isArray(data) ? data : []);
          return;
        }

        const response = await fetch(
          `/api/questions?category=${encodeURIComponent(category)}&randomSet=1`,
          { cache: 'no-store' },
        );
        if (!response.ok) {
          console.error('[test][fetchQuestions] response not ok', response.status);
          throw new Error(`获取'${category}'类别的题目失败`);
        }
        const data = await response.json();
        console.log('[test][fetchQuestions] received count=', data?.questions?.length);
        setQuestions(data?.questions ?? []);
        setSetId(data?.setId ?? null);
        setSetName(data?.setName ?? null);
      } catch (err) {
        console.error('[test][fetchQuestions] error', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [category]);

  const renderTest = () => {
    if (category !== 'number-naming' && questions.length === 0 && !loading) {
       return <p className="text-center text-zinc-600 dark:text-zinc-400">
              该分类下没有题目。请先 <a href="/upload" className="underline">上传题目</a>。
            </p>
    }
    switch (category) {
      case 'number-naming':
        return <NumberNamingTest grid={numberGrid} category={category} />;
      case 'rapid-reading-3-min':
        return (
          <RapidReadingTest
            questions={questions}
            category={category}
            setName={setName}
            setId={setId}
          />
        );
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
