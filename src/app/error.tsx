"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーログを送信（本番環境では適切なログサービスに送信）
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* エラーアイコン */}
          <div className="mx-auto flex items-center justify-center h-32 w-32 rounded-full bg-red-100 mb-8">
            <AlertTriangle className="h-16 w-16 text-red-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            申し訳ございません
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            予期しないエラーが発生しました
          </h2>
          <p className="text-gray-600 mb-8 max-w-sm mx-auto">
            システムに一時的な問題が発生している可能性があります。しばらく経ってから再度お試しください。
          </p>

          {/* エラー詳細（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-8 p-4 bg-gray-100 rounded-lg text-left text-sm text-gray-700 max-w-lg mx-auto">
              <strong>エラー詳細:</strong>
              <pre className="mt-2 whitespace-pre-wrap">
                {error.message || 'Unknown error'}
              </pre>
              {error.digest && (
                <p className="mt-2">
                  <strong>Error ID:</strong> {error.digest}
                </p>
              )}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={reset}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              再試行
            </button>
            
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Home className="mr-2 h-4 w-4" />
              ホームに戻る
            </Link>
          </div>

          {/* サポート情報 */}
          <div className="mt-12 max-w-lg mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              問題が解決しない場合
            </h3>
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
              <p className="mb-2">
                エラーが継続する場合は、以下の方法でお問い合わせください：
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>メール: support@fragrance.com</li>
                <li>電話: 0120-xxx-xxx（平日9:00-18:00）</li>
                <li>お問い合わせの際は、エラーが発生した時間と操作内容をお知らせください</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}