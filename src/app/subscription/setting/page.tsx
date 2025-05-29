"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Package, Pause, Play, XCircle } from "lucide-react";

const SubscriptionSettingPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [deliveryOption, setDeliveryOption] = useState("same"); // "same", "favorite", "recommended"
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        
        // 配送オプションを設定
        if (data.preferCustomSelection === true) {
          setDeliveryOption("favorite");
        } else {
          setDeliveryOption("same");
        }
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
      router.push("/login?callbackUrl=/profile/subscription/setting");
    }
  }, [session, status, router]);

  // おまかせ配送設定を切り替え
  const updateDeliveryPreference = async () => {
    if (!session?.user?.id || !subscription) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const preferCustomSelection = deliveryOption === "favorite";
      
      const response = await fetch(`/api/users/${session.user.id}/subscription/update-delivery-preference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferCustomSelection,
        }),
      });

      if (!response.ok) {
        throw new Error("設定の更新に失敗しました");
      }

      const data = await response.json();
      setSubscription(data);
      setSuccessMessage("配送設定を変更しました");
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error updating preference:", err);
      setError(err.message || "設定の更新中にエラーが発生しました");
      
      // 3秒後にエラーメッセージを消す
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // サブスクリプションプラン停止
  const pauseSubscription = async () => {
    if (!session?.user?.id || !subscription) return;
    
    if (!confirm("サブスクリプションを一時停止しますか？再開はいつでも可能です。")) {
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch(`/api/subscription/${subscription.id}/pause`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("サブスクリプションの一時停止に失敗しました");
      }

      const data = await response.json();
      setSubscription(data);
      setSuccessMessage("サブスクリプションを一時停止しました");
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error pausing subscription:", err);
      setError(err.message || "サブスクリプションの一時停止中にエラーが発生しました");
      
      // 3秒後にエラーメッセージを消す
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // サブスクリプションプラン再開
  const resumeSubscription = async () => {
    if (!session?.user?.id || !subscription) return;
    
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch(`/api/subscription/${subscription.id}/resume`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("サブスクリプションの再開に失敗しました");
      }

      const data = await response.json();
      setSubscription(data);
      setSuccessMessage("サブスクリプションを再開しました");
      
      // 3秒後に成功メッセージを消す
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error("Error resuming subscription:", err);
      setError(err.message || "サブスクリプションの再開中にエラーが発生しました");
      
      // 3秒後にエラーメッセージを消す
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // 日付のフォーマット
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未定';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
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
      <div className="bg-white border rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">サブスクリプション情報</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            subscription.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {subscription.status === 'ACTIVE' ? 'アクティブ' :
             subscription.status === 'PAUSED' ? '一時停止中' :
             subscription.status === 'CANCELED' ? 'キャンセル済み' : '不明'}
          </span>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">プラン</span>
            <span className="font-medium">{subscription.planName || '標準プラン'}</span>
          </div>
          
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">月額料金</span>
            <span className="font-medium">¥{subscription.price?.toLocaleString() || '2,390'}</span>
          </div>
          
          <div className="flex justify-between py-3 border-b">
            <span className="text-gray-600">次回配送予定日</span>
            <span className="font-medium">{formatDate(subscription.nextDeliveryDate)}</span>
          </div>
          
          <div className="flex justify-between py-3">
            <span className="text-gray-600">次回請求日</span>
            <span className="font-medium">{formatDate(subscription.nextBillingDate)}</span>
          </div>
        </div>
        
       {/* サブスクリプション操作ボタン */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {subscription.status === 'ACTIVE' ? (
            <>
              <button
                onClick={pauseSubscription}
                disabled={isProcessing}
                className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <Pause className="w-4 h-4 mr-2" />
                一時停止する
              </button>
              
              {/* キャンセル（解約）へのリンクを追加 */}
              <Link 
                href="/subscription/cancel" 
                className="px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
              >
                <XCircle className="w-4 h-4 mr-2" />
                解約する
              </Link>
            </>
          ) : subscription.status === 'PAUSED' ? (
            <button
              onClick={resumeSubscription}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Play className="w-4 h-4 mr-2" />
              サブスクリプションを再開する
            </button>
          ) : null}
          
          <Link 
            href="/profile/delivery-history" 
            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-center flex items-center justify-center"
          >
            <Package className="w-4 h-4 mr-2" />
            配送履歴を見る
          </Link>
        </div>
      </div>
      
      {/* おまかせ配送設定 */}
      
      {/* カレンダー自動追加設定 */}
      <div className="bg-white border rounded-lg p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">次回お届け商品の設定</h2>
        
        <div className="space-y-4">
          {/* 設定オプション */}
          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="radio"
                name="deliveryOption"
                value="same"
                checked={deliveryOption === "same"}
                onChange={() => setDeliveryOption("same")}
                className="mt-1 mr-2"
              />
              <div>
                <p className="font-medium">前回と同じアイテム</p>
                <p className="text-sm text-gray-500">前回にお届けした商品と同じものをお届けします。</p>
              </div>
            </label>
            
            <label className="flex items-start">
              <input
                type="radio"
                name="deliveryOption"
                value="favorite"
                checked={deliveryOption === "favorite"}
                onChange={() => setDeliveryOption("favorite")}
                className="mt-1 mr-2"
              />
              <div>
                <p className="font-medium">気になるリスト</p>
                <p className="text-sm text-gray-500">気になるリストにご登録いただいている商品から厳選したアイテムをお届けします。</p>
              </div>
            </label>
            
            <label className="flex items-start">
              <input
                type="radio"
                name="deliveryOption"
                value="recommended"
                checked={deliveryOption === "recommended"}
                onChange={() => setDeliveryOption("recommended")}
                className="mt-1 mr-2"
              />
              <div>
                <p className="font-medium">厳選アイテム</p>
                <p className="text-sm text-gray-500">前回注文をもとに、お客様に合ったアイテムをお届けします。</p>
              </div>
            </label>
          </div>
          
          <button
            onClick={updateDeliveryPreference}
            disabled={isProcessing}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                更新中...
              </span>
            ) : (
              '設定を保存'
            )}
          </button>
          
          <div className="pt-4 text-center">
            <p className="text-sm text-gray-500 mb-2">特定の日付に配送をご希望の場合は、カレンダーから日付を選択してください</p>
            <Link
              href="/subscription/calendar"
              className="inline-flex items-center text-purple-600 hover:text-purple-800"
            >
              <Calendar className="w-4 h-4 mr-1" />
              カレンダーを開く
            </Link>
          </div>
        </div>
      </div>
      
      {/* 配送先情報 */}
      <div className="bg-white border rounded-lg p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">配送先情報</h2>
        
        <div className="mb-4">
          <p className="text-gray-800">
            {subscription.shippingAddress?.postalCode ? `〒${subscription.shippingAddress.postalCode}` : ''}
            <br />
            {subscription.shippingAddress?.prefecture || ''}
            {subscription.shippingAddress?.city || ''}
            {subscription.shippingAddress?.address || ''}
            <br />
            {subscription.shippingAddress?.name ? `${subscription.shippingAddress.name} 様` : ''}
          </p>
        </div>
        
        <Link 
          href="/profile/addresses" 
          className="inline-flex items-center text-purple-600 hover:text-purple-800"
        >
          配送先を変更
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
      
      {/* 支払い方法 */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">お支払い方法</h2>
        
        {subscription.paymentMethod ? (
          <div className="mb-4">
            <div className="flex items-center">
              <div className="w-12 h-8 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-500">
                {subscription.paymentMethod.brand || 'カード'}
              </div>
              <div>
                <p className="font-medium">
                  {subscription.paymentMethod.brand || 'クレジットカード'} •••• 
                  {subscription.paymentMethod.last4 || '****'}
                </p>
                <p className="text-sm text-gray-500">
                  有効期限: {subscription.paymentMethod.expMonth || '**'}/{subscription.paymentMethod.expYear || '**'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 mb-4">支払い方法が設定されていません</p>
        )}
        
        <Link 
          href="/profile/payment-methods" 
          className="inline-flex items-center text-purple-600 hover:text-purple-800"
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