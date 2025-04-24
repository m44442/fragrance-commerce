// src/app/subscription/page.tsx
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

// 料金プラン
const plans = [
  { id: "MONTHLY", name: "月額プラン", price: 2390, period: "月額" },
  { id: "QUARTERLY", name: "3ヶ月プラン", price: 2190, period: "月額", discount: "年間¥2,400お得" },
  { id: "BIANNUAL", name: "半年プラン", price: 2090, period: "月額", discount: "年間¥3,600お得" },
  { id: "ANNUAL", name: "年間プラン", price: 1990, period: "月額", discount: "年間¥4,800お得" },
];

// ケースのオプション
const caseOptions = [
  { id: "BLACK", name: "ブラック", imageUrl: "/images/case-black.jpg" },
  { id: "SILVER", name: "シルバー", imageUrl: "/images/case-silver.jpg" },
];

const SubscriptionPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(plans[3]); // デフォルトで年間プラン
  const [selectedCase, setSelectedCase] = useState(caseOptions[0]); // デフォルトでブラック
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan.id,
          caseColor: selectedCase.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "サブスクリプションの作成に失敗しました");
      }

      const data = await response.json();
      
      // 支払いページがある場合はリダイレクト
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push("/subscription/success");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Rumini 香りの定期便
      </h1>
      
      <div className="bg-purple-50 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">サブスクリプションの特典</h2>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            <span>毎月、厳選された香水のサンプルをお届け</span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            <span>初回特典: 高級アトマイザーケースをプレゼント</span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            <span>お気に入りの香水は定価の10%オフで購入可能</span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">✓</span>
            <span>いつでも解約可能、初月は無料トライアル</span>
          </li>
        </ul>
      </div>
      
      {/* プラン選択 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">お支払いプラン</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 cursor-pointer transition ${
                selectedPlan.id === plan.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{plan.name}</h3>
                {selectedPlan.id === plan.id && (
                  <span className="text-sm bg-purple-500 text-white px-2 py-1 rounded">
                    選択中
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-purple-700">
                  ¥{plan.price.toLocaleString()}
                </span>
                <span className="text-gray-600 ml-1">/{plan.period}</span>
              </div>
              {plan.discount && (
                <p className="text-green-600 text-sm mt-1">{plan.discount}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* アトマイザーケース選択 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          初回特典: アトマイザーケース
        </h2>
        <p className="text-gray-600 mb-4">
          初回購入時にアトマイザーケースをプレゼント。お好きな色をお選びください。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {caseOptions.map((caseOption) => (
            <div
              key={caseOption.id}
              className={`border rounded-lg p-4 cursor-pointer transition ${
                selectedCase.id === caseOption.id
                  ? "border-purple-500"
                  : "border-gray-200 hover:border-purple-300"
              }`}
              onClick={() => setSelectedCase(caseOption)}
            >
              <div className="h-48 bg-gray-100 rounded mb-3 relative">
                {/* 実際の実装ではケースの画像を表示 */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  {caseOption.name}のケース画像
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={selectedCase.id === caseOption.id}
                  onChange={() => setSelectedCase(caseOption)}
                  className="mr-2 accent-purple-700"
                />
                <span className="font-medium">{caseOption.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 注文概要 */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">注文概要</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">選択プラン</span>
            <span className="font-medium">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">月額料金</span>
            <span className="font-medium">¥{selectedPlan.price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">アトマイザーケース</span>
            <span className="font-medium">{selectedCase.name}</span>
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between font-bold">
              <span>初月料金</span>
              <span className="text-green-600">¥0（無料トライアル）</span>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="flex flex-col space-y-4">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="bg-purple-600 text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              処理中...
            </div>
          ) : (
            "今すぐ申し込む"
          )}
        </button>
        
        <p className="text-center text-gray-500 text-sm">
          お申し込みには会員登録が必要です。初月は無料でお試しいただけます。いつでも解約可能です。
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;