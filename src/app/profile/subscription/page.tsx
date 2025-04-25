// src/app/subscription/page.tsx
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
    default: false,
    items: [
      { id: "ITEM1", name: "1itemプラン", price: 2390, discount: null },
      { id: "ITEM2", name: "2itemプラン", price: 3990, discount: null },
      { id: "ITEM3", name: "3itemプラン", price: 5490, discount: null }
    ]
  },
  {
    id: "ANNUAL",
    name: "12ヶ月コース",
    default: true,
    popular: true,
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
      // サブスクリプションAPIを呼び出す
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
      
      // Stripeのチェックアウトページがある場合はリダイレクト
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // すでにサブスクリプションが作成されている場合は成功ページに遷移
        router.push("/subscription/success");
      }
    } catch (err: any) {
      console.error("Subscription error:", err);
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
            <span>選んだプランに応じた香水のサンプルをお届け</span>
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
      
      {/* コースタイプ選択 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">コース期間</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border rounded-lg p-4 cursor-pointer transition ${
                selectedPlanType === plan.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
              onClick={() => setSelectedPlanType(plan.id)}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                  <div className="bg-yellow-300 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
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
        <h2 className="text-xl font-semibold mb-4">アイテム数選択</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 border text-left">プラン</th>
                <th className="p-4 border text-center">1ヶ月コース</th>
                <th className="p-4 border text-center bg-purple-50">12ヶ月コース</th>
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
                        className="mr-2 accent-purple-700"
                      />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="p-4 border text-center">¥{plans[0].items[index].price.toLocaleString()}/月</td>
                  <td className="p-4 border text-center bg-purple-50">
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