// src/app/subscription/page.tsx の修正版
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

// 料金プラン
const plans = [
  {
    id: "MONTHLY",
    name: "1ヶ月コース",
    period: "月",
    items: [
      { id: "ITEM1", name: "1itemプラン", price: 2390 },
      { id: "ITEM2", name: "2itemプラン", price: 3990 },
      { id: "ITEM3", name: "3itemプラン", price: 5490 }
    ]
  },
  {
    id: "ANNUAL",
    name: "12ヶ月コース",
    period: "月",
    items: [
      { id: "ITEM1", name: "1itemプラン", price: 1990, discount: "年間¥4,800お得" },
      { id: "ITEM2", name: "2itemプラン", price: 3580, discount: "年間¥4,920お得" },
      { id: "ITEM3", name: "3itemプラン", price: 4770, discount: "年間¥8,640お得" }
    ]
  }
];

// ケースのオプション
const caseOptions = [
  { id: "BLACK", name: "ブラック", imageUrl: "/images/case-black.jpg" },
  { id: "SILVER", name: "シルバー", imageUrl: "/images/case-silver.jpg" },
];

const SubscriptionPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  
  // プランタイプとアイテム数を別々に管理
  const [selectedPlanType, setSelectedPlanType] = useState("ANNUAL"); // デフォルトで12ヶ月プラン
  const [selectedItemCount, setSelectedItemCount] = useState("ITEM1"); // デフォルトで1item
  const [selectedCase, setSelectedCase] = useState(caseOptions[0]); // デフォルトでブラック
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 選択中のプランタイプを取得
  const currentPlanType = plans.find(plan => plan.id === selectedPlanType) || plans[1];
  // 選択中のアイテム数のプラン詳細を取得
  const currentItem = currentPlanType.items.find(item => item.id === selectedItemCount) || currentPlanType.items[0];

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
          planType: selectedPlanType,
          itemPlan: selectedItemCount,
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
        サブスクリプション
      </h1>
      
      {/* 説明部分は省略 */}
      
      {/* コースタイプ選択 */}
      <div className="mb-8">
  <h2 className="text-xl font-semibold mb-4">コース期間を選ぶ</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {plans.map((plan) => (
      <div
        key={plan.id}
        className={`relative border rounded-lg p-4 cursor-pointer transition ${
          selectedPlanType === plan.id
            ? "border-custom-peach bg-custom-peach-dark"
            : "border-custom-peach hover:border-custom-peach-dark"
        }`}
        onClick={() => setSelectedPlanType(plan.id)}
      >
        {plan.id === "ANNUAL" && (
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
            <div className="bg-yellow-300 text-yellow-800 px-2 py-1 rounded-full text-2xs font-bold">
              人気
            </div>
          </div>
        )}
        <h3 className="font-medium text-lg">{plan.name}</h3>
        <p className="text-gray-600 text-sm mt-1">
          {plan.id === "ANNUAL" ? "長期割引適用" : "割引なし"}
        </p>
      </div>
    ))}
        </div>
      </div>
      {/* アイテム数選択 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">アイテム数を選ぶ</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 border text-left">プラン</th>
                {/* 選択中のプランタイプによって背景色を変更 */}
                <th className={`p-4 border text-center ${selectedPlanType === "MONTHLY" ? "bg-custom-peach" : ""}`}>
                  1ヶ月コース
                </th>
                <th className={`p-4 border text-center ${selectedPlanType === "ANNUAL" ? "bg-custom-peach" : ""}`}>
                  12ヶ月コース
                </th>
              </tr>
            </thead>
            <tbody>
              {plans[0].items.map((item, index) => (
                <tr 
                  key={item.id}
                  className={`cursor-pointer ${selectedItemCount === item.id ? "bg-purple-50" : "hover:bg-gray-50"}`}
                  onClick={() => setSelectedItemCount(item.id)}
                >
                  <td className="p-4 border">
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        checked={selectedItemCount === item.id}
                        onChange={() => setSelectedItemCount(item.id)}
                        className="mr-2 accent-custom-peach"
                      />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  {/* 各セルの背景色も選択中のプランタイプに応じて変更 */}
                  <td className={`p-4 border text-center ${selectedPlanType === "MONTHLY" ? "bg-custom-peach bg-opacity-70" : ""}`}>
                    ¥{plans[0].items[index].price.toLocaleString()}/月
                  </td>
                  <td className={`p-4 border text-center ${selectedPlanType === "ANNUAL" ? "bg-custom-peach bg-opacity-70" : ""}`}>
                    <div>
                      <div className="font-bold">¥{plans[1].items[index].price.toLocaleString()}/月</div>
                      {plans[1].items[index].discount && (
                        <div className="text-green-600 text-xs">{plans[1].items[index].discount}</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* ケース選択とその他の部分は変更なし */}
      
      {/* 注文概要 */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">注文概要</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">選択コース</span>
            <span className="font-medium">{currentPlanType.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">選択プラン</span>
            <span className="font-medium">{currentItem.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">月額料金</span>
            <span className="font-medium">¥{currentItem.price.toLocaleString()}</span>
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
          className="bg-custom-peach text-white py-3 px-6 rounded-lg font-medium disabled:opacity-50"
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