"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SubscriptionSettingPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [isAutoSelection, setIsAutoSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // サブスクリプション情報を取得
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/subscription`);
        if (!response.ok) {
          if (response.status === 404) {
            // サブスクリプションが見つからない場合
            router.push("/subscription");
            return;
          }
          throw new Error("サブスクリプション情報の取得に失敗しました");
        }

        const data = await response.json();
        setSubscription(data);
        setIsAutoSelection(!!data.preferCustomSelection);
      } catch (err) {
        console.error("Error fetching subscription:", err);
        setError("サブスクリプション情報の取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchSubscription();
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/subscription/setting");
    }
  }, [session, status, router]);

  // おまかせ配送設定を切り替え
  const toggleAutoSelection = async () => {
    if (!session?.user?.id || !subscription) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}/subscription/update-delivery-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferCustomSelection: !isAutoSelection,
        }),
      });

      if (!response.ok) {
        throw new Error("設定の更新に失敗しました");
      }

      const data = await response.json();
      setSubscription(data);
      setIsAutoSelection(!isAutoSelection);
      setSuccessMessage("設定を更新しました");
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error updating preference:", err);
      setError("設定の更新中にエラーが発生しました");
      
      // 3秒後にエラーメッセージを消す
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // サブスクリプションプラン停止
  const pauseSubscription = async () => {
    if (!session?.user?.id || !subscription) return;
    
    if (!confirm("サブスクリプションを一時停止しますか？再開はいつでも可能です。")) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}/subscription/pause`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("サブスクリプションの一時停止に失敗しました");
      }

      const data = await response.json();
      setSubscription(data);
      setSuccessMessage("サブスクリプションを一時停止しました");
    } catch (err) {
      console.error("Error pausing subscription:", err);
      setError("サブスクリプションの一時停止中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  // サブスクリプションプラン再開
  const resumeSubscription = async () => {
    if (!session?.user?.id || !subscription) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${session.user.id}/subscription/resume`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("サブスクリプションの再開に失敗しました");
      }

      const data = await response.json();
      setSubscription(data);
      setSuccessMessage("サブスクリプションを再開しました");
    } catch (err) {
      console.error("Error resuming subscription:", err);
      setError("サブスクリプションの再開中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">サブスクリプション設定</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="mb-4">サブスクリプションが見つかりません。</p>
          <Link
            href="/subscription"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            サブスクリプションに登録する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">サブスクリプション設定</h1>
      
      {/* 成功メッセージ */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{successMessage}</span>
        </div>
      )}
      
      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* サブスクリプション情報 */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">サブスクリプション情報</h2>
        
        <div className="mb-6">
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">ステータス</span>
            <span className={`font-medium ${
              subscription.status === 'ACTIVE' ? 'text-green-600' :
              subscription.status === 'PAUSED' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {subscription.status === 'ACTIVE' ? 'アクティブ' :
               subscription.status === 'PAUSED' ? '一時停止中' :
               subscription.status === 'CANCELED' ? 'キャンセル済み' : '不明'}
            </span>
          </div>
          
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">プラン</span>
            <span className="font-medium">
              {subscription.planName || '標準プラン'}
            </span>
          </div>
          
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">毎月のお届け数</span>
            <span className="font-medium">
              {subscription.itemCount || 1}個
            </span>
          </div>
          
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">次回請求日</span>
            <span className="font-medium">
              {subscription.nextBillingDate ? 
                new Date(subscription.nextBillingDate).toLocaleDateString('ja-JP') : 
                '未定'}
            </span>
          </div>
          
          <div className="flex justify-between py-3">
            <span className="text-gray-600">次回お届け日</span>
            <span className="font-medium">
              {subscription.nextDeliveryDate ? 
                new Date(subscription.nextDeliveryDate).toLocaleDateString('ja-JP') : 
                '未定'}
            </span>
          </div>
        </div>
        
        {/* サブスクリプション操作ボタン */}
        <div className="flex flex-col sm:flex-row gap-3">
          {subscription.status === 'ACTIVE' ? (
            <button
              onClick={pauseSubscription}
              disabled={isLoading}
              className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded hover:bg-yellow-50 transition-colors disabled:opacity-50"
            >
              一時停止する
            </button>
          ) : subscription.status === 'PAUSED' ? (
            <button
              onClick={resumeSubscription}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              サブスクリプションを再開する
            </button>
          ) : null}
          
          <Link 
            href="/subscription/history" 
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors text-center"
          >
            配送履歴を見る
          </Link>
        </div>
      </div>
      
      {/* おまかせ配送設定 */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">配送設定</h2>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-medium mb-1">香水の選択方法</h3>
            <p className="text-sm text-gray-600">
              配送される香水の選択方法を設定します
            </p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <span className="mr-2 text-sm text-gray-700">おまかせ配送</span>
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={isAutoSelection} 
                onChange={toggleAutoSelection}
                disabled={isLoading || subscription.status !== 'ACTIVE'}
              />
              <div className={`block w-14 h-8 rounded-full ${isAutoSelection ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white transform transition-transform ${isAutoSelection ? 'translate-x-6' : ''}`}></div>
            </div>
          </label>
        </div>
        
        {isAutoSelection ? (
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="font-medium">「おまかせ配送」が有効です</p>
            <p className="text-sm text-gray-600 mt-2">
              毎月のお届け商品はお客様の好みや過去の購入履歴に基づいて自動で選択されます。お気に入り登録した香水が優先的に選ばれます。
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-2">カレンダーから希望の配送日を選択できます</p>
            <Link 
              href="/subscription/calendar" 
              className="text-purple-600 font-medium flex items-center"
            >
              カレンダーを開く
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        )}
      </div>
      
      {/* 配送先情報 */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">配送先情報</h2>
        
        <div className="mb-4">
          <p className="text-gray-800">
            {subscription.shippingAddress?.postalCode || '〒000-0000'}<br />
            {subscription.shippingAddress?.prefecture || '都道府県'}
            {subscription.shippingAddress?.city || '市区町村'}
            {subscription.shippingAddress?.address1 || '番地等'}<br />
            {subscription.shippingAddress?.address2 || ''}<br />
            {subscription.shippingAddress?.name || 'お名前'} 様
          </p>
        </div>
        
        <Link 
          href="/profile/address" 
          className="text-purple-600 font-medium flex items-center"
        >
          配送先を変更
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
      
      {/* 支払い方法 */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">お支払い方法</h2>
        
        <div className="mb-4">
          <div className="flex items-center">
            <div className="w-12 h-8 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-500">
              {subscription.paymentMethod?.brand || 'カード'}
            </div>
            <div>
              <p className="font-medium">
                {subscription.paymentMethod?.brand || 'クレジットカード'} •••• 
                {subscription.paymentMethod?.last4 || '****'}
              </p>
              <p className="text-sm text-gray-500">
                有効期限: {subscription.paymentMethod?.expMonth || '**'}/{subscription.paymentMethod?.expYear || '**'}
              </p>
            </div>
          </div>
        </div>
        
        <Link 
          href="/profile/payment-methods" 
          className="text-purple-600 font-medium flex items-center"
        >
          支払い方法を変更
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionSettingPage;