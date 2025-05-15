// src/app/admin/layout.tsx
"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  if (status === 'loading') {
    return <div className="text-center p-10">読み込み中...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm p-4">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">管理画面</h1>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 hover:text-gray-800">
                サイトに戻る
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-wrap">
          {/* サイドバー */}
          <div className="w-full md:w-1/5 pr-4">
            <div className="bg-white p-4 rounded shadow">
              <ul className="space-y-2">
                <li>
                  <Link href="/admin/orders" className="block p-2 hover:bg-gray-100 rounded">
                    注文管理
                  </Link>
                </li>
                <li>
                  <Link href="/admin/users" className="block p-2 hover:bg-gray-100 rounded">
                    ユーザー管理
                  </Link>
                </li>
                {/* 他の管理メニュー */}
              </ul>
            </div>
          </div>
          
          {/* メインコンテンツ */}
          <div className="w-full md:w-4/5 mt-4 md:mt-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}