'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('rapid-reading-3-min');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('请选择一个文件');
      return;
    }
    if (!category) {
      setMessage('请选择一个测试分类');
      return;
    }

    setLoading(true);
    setMessage('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') {
        setMessage('无法读取文件内容');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/questions/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content, category }),
        });

        const result = await response.json();

        if (response.ok) {
          setMessage(result.message);
          setFile(null);
          // Reset the file input visually
          const fileInput = document.getElementById('file-upload') as HTMLInputElement;
          if(fileInput) fileInput.value = '';

        } else {
          setMessage(`上传失败: ${result.error}`);
        }
      } catch (error) {
        setMessage('上传时发生未知错误');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
        setMessage('读取文件时发生错误');
        setLoading(false);
    }

    reader.readAsText(file);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center justify-center gap-8 p-8">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-5xl">
          批量上传测试题
        </h1>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label htmlFor="category" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              选择测试分类
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 p-4 text-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value="rapid-reading-3-min">三分钟快速阅读测试</option>
              <option value="general">通用问题</option>
            </select>
          </div>
          <div>
            <label htmlFor="file-upload" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              选择题目文件 (.txt)
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="w-full rounded-lg border border-zinc-300 text-lg file:mr-4 file:border-0 file:bg-zinc-100 file:px-4 file:py-3 hover:file:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:file:bg-zinc-800 dark:file:text-zinc-200 dark:hover:file:bg-zinc-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-blue-600 px-5 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {loading ? '上传中...' : '开始上传'}
          </button>
        </form>
        {message && <p className="mt-4 text-center text-zinc-600 dark:text-zinc-400">{message}</p>}
        <Link href="/">
          <span className="text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
            返回主页
          </span>
        </Link>
      </main>
    </div>
  );
}
