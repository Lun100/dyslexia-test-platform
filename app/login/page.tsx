'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMessage(error.message);
        } else {
          setMessage('注册成功，请检查邮箱完成验证后再登录。');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(error.message);
        } else {
          setMessage('登录成功。');
        }
      }
    } catch (error) {
      console.error('[login] error', error);
      setMessage('登录发生错误，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">登录</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full bg-blue-600 text-base font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? '处理中...' : mode === 'sign-up' ? '注册' : '登录'}
          </button>
        </form>
        {message && <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>}
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
            className="underline"
          >
            {mode === 'sign-in' ? '没有账号？注册' : '已有账号？登录'}
          </button>
          <Link className="underline" href="/">
            返回主页
          </Link>
        </div>
      </main>
    </div>
  );
}
