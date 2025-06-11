"use client";

import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 イラスト */}
          <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-gray-100 mb-8">
            <Search className="h-16 w-16 text-gray-400" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            ページが見つかりません
          </h2>
          <p className="text-gray-600 mb-8 max-w-sm mx-auto">
            申し訳ございません。お探しのページは移動、削除、または一時的に利用できない可能性があります。
          </p>

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Home className="mr-2 h-4 w-4" />
              ホームに戻る
            </Link>
            
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              前のページに戻る
            </button>
          </div>

          {/* 人気のページへのリンク */}
          <div className="mt-12">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              人気のページ
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
              <Link
                href="/new-arrivals"
                className="text-sm text-indigo-600 hover:text-indigo-700 p-2 rounded hover:bg-indigo-50 transition-colors"
              >
                新着商品
              </Link>
              <Link
                href="/rankings"
                className="text-sm text-indigo-600 hover:text-indigo-700 p-2 rounded hover:bg-indigo-50 transition-colors"
              >
                人気ランキング
              </Link>
              <Link
                href="/brands"
                className="text-sm text-indigo-600 hover:text-indigo-700 p-2 rounded hover:bg-indigo-50 transition-colors"
              >
                ブランド一覧
              </Link>
              <Link
                href="/search"
                className="text-sm text-indigo-600 hover:text-indigo-700 p-2 rounded hover:bg-indigo-50 transition-colors"
              >
                商品検索
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}