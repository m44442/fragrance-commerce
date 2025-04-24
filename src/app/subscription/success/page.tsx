// src/app/subscription/success/page.tsx
"use client";
import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

const SubscriptionSuccessPage = () => {
  const { data: session, status } = useSession();
  
  // 認証されていない場合はログインページにリダイレクト
  if (status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-4">サブスクリプション登録完了！</h1>
        <p className="text-gray-600 mb-8">
          Rumini香りの定期便にご登録いただき、ありがとうございます。
          初回発送は30日以内に行われます。アトマイザーケースは初回発送時に同梱されます。
        </p>
        
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-6 mb-8 text-left">
          <h2 className="font-semibold text-lg mb-2">今後について</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>マイページからサブスクリプションの詳細や発送状況を確認できます</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>初月は無料でお試しいただけます</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">•</span>
              <span>いつでもマイページから簡単に解約できます</span>
            </li>
          </ul>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Link
            href="/profile/subscription"
            className="inline-block bg-purple-600 text-white py-3 px-8 rounded-lg font-medium"
          >
            マイサブスクリプションを表示
          </Link>
          <Link
            href="/"
            className="inline-block text-purple-600 underline hover:text-purple-800"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccessPage;