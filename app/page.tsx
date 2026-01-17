import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center justify-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-6xl">
          儿童阅读障碍测试
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          别担心，这是一个有趣的小游戏，来帮助我们更好地了解你的阅读习惯。
        </p>
        <Link href="/test">
          <button className="h-12 w-48 rounded-full bg-blue-600 px-5 text-base font-medium text-white transition-colors hover:bg-blue-700">
            开始测试
          </button>
        </Link>

        <div className="flex gap-8">
          <Link href="/upload">
            <span className="text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
              上传题目
            </span>
          </Link>
          <Link href="/manage">
            <span className="text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300">
              管理题目
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
