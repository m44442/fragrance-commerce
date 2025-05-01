// src/app/profile/subscription/manage/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SubscriptionManagePage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  useEffect(() => {
    // テストデータ
    setSubscription({
      id: "sub_test",
      status: "ACTIVE",
      plan: "MONTHLY",
      planName: "月額プラン",
      itemCount: 1,
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      nextDeliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    });
    setIsLoading(false);
  }, [session]);
  
  const handleCancel = async () => {
    if (!confirm("サブスクリプションをキャンセルしますか？この操作は取り消せません。")) {
      return;
    }
    
    setIsProcessing(true);
    // 実際のAPI呼び出しはここで行う
    setTimeout(() => {
      setMessage("サブスクリプションがキャンセルされました");
      setSubscription({
        ...subscription,
        status: "CANCELED"
      });
      setIsProcessing(false);
    }, 1000);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (!subscription) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">サブスクリプション管理</h1>
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500 mb-4">アクティブなサブスクリプションがありません</p>
          <Link
            href="/subscription"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg inline-block"
          >
            サブスクリプションに登録
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">サブスクリプション管理</h1>
      
      {message && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
          {message}
        </div>
      )}
      
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">サブスクリプション情報</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">ステータス</span>
            <span className={`font-medium ${
              subscription.status === 'ACTIVE' ? 'text-green-600' :
              subscription.status === 'PAUSED' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {subscription.status === 'ACTIVE' ? 'アクティブ' :
               subscription.status === 'PAUSED' ? '一時停止中' :
               subscription.status === 'CANCELED' ? 'キャンセル済み' : '不明'}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">プラン</span>
            <span className="font-medium">{subscription.planName}</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">月額</span>
            <span className="font-medium">¥2,390</span>
          </div>
          
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">次回請求日</span>
            <span className="font-medium">
              {subscription.nextBillingDate.toLocaleDateString('ja-JP')}
            </span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="text-gray-600">次回お届け日</span>
            <span className="font-medium">
              {subscription.nextDeliveryDate.toLocaleDateString('ja-JP')}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {subscription.status === 'ACTIVE' && (
          <>
            <Link
              href="/profile/calendar"
              className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-center"
            >
              配送日を変更
            </Link>
            
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full border border-red-500 text-red-600 py-2 px-4 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              {isProcessing ? "処理中..." : "サブスクリプションをキャンセル"}
            </button>
          </>
        )}
        
        <Link
          href="/profile/subscription"
          className="block w-full text-purple-600 text-center"
        >
          サブスクリプション一覧に戻る
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionManagePage;