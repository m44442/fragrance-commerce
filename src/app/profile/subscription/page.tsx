// src/app/profile/subscription/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { ja } from "date-fns/locale";

const SubscriptionPage = () => {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPausing, setIsPausing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/subscription`);
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
          setDeliveries(data.deliveries || []);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubscription();
  }, [session]);
  
  const handlePauseSubscription = async () => {
    if (!subscription?.id) return;
    
    setIsPausing(true);
    try {
      const response = await fetch(`/api/subscription/${subscription.id}/pause`, {
        method: "POST",
      });
      
      if (response.ok) {
        const updatedSubscription = await response.json();
        setSubscription(updatedSubscription);
      }
    } catch (error) {
      console.error("Error pausing subscription:", error);
    } finally {
      setIsPausing(false);
    }
  };
  
  const handleResumeSubscription = async () => {
    if (!subscription?.id) return;
    
    setIsPausing(true);
    try {
      const response = await fetch(`/api/subscription/${subscription.id}/resume`, {
        method: "POST",
      });
      
      if (response.ok) {
        const updatedSubscription = await response.json();
        setSubscription(updatedSubscription);
      }
    } catch (error) {
      console.error("Error resuming subscription:", error);
    } finally {
      setIsPausing(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!subscription?.id) return;
    
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/subscription/${subscription.id}/cancel`, {
        method: "POST",
      });
      
      if (response.ok) {
        const updatedSubscription = await response.json();
        setSubscription(updatedSubscription);
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
    } finally {
      setIsCancelling(false);
    }
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
        <h1 className="text-2xl font-bold mb-6">サブスクリプション</h1>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">現在アクティブなサブスクリプションはありません</p>
          <Link
            href="/subscription"
            className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            サブスクリプションに登録する
          </Link>
        </div>
      </div>
    );
  }

  const planName = {
    MONTHLY: "月額プラン",
    QUARTERLY: "3ヶ月プラン",
    BIANNUAL: "半年プラン",
    ANNUAL: "年間プラン"
  }[subscription.plan] || "月額プラン";
  
  const planPrice = {
    MONTHLY: 2390,
    QUARTERLY: 2190,
    BIANNUAL: 2090,
    ANNUAL: 1990
  }[subscription.plan] || 2390;
  
  const nextDeliveryDate = subscription.nextDeliveryDate 
    ? new Date(subscription.nextDeliveryDate) 
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">サブスクリプション管理</h1>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold">あなたのプラン: {planName}</h2>
            <p className="text-gray-500">¥{planPrice.toLocaleString()}/月</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            subscription.status === 'PAUSED' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {
              subscription.status === 'ACTIVE' ? 'アクティブ' :
              subscription.status === 'PAUSED' ? '一時停止中' :
              subscription.status === 'CANCELED' ? '解約済み' : 
              '期限切れ'
            }
          </span>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">次回発送予定日</p>
            <p className="font-medium">
              {nextDeliveryDate 
                ? format(nextDeliveryDate, "yyyy年MM月dd日", { locale: ja })
                : "未定"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">開始日</p>
            <p className="font-medium">
              {format(new Date(subscription.startDate), "yyyy年MM月dd日", { locale: ja })}
            </p>
          </div>
        </div>
        
        {subscription.status === 'ACTIVE' && (
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={handlePauseSubscription}
              disabled={isPausing}
              className="px-4 py-2 border border-orange-400 text-orange-600 rounded hover:bg-orange-50 transition"
            >
              {isPausing ? "処理中..." : "一時停止する"}
            </button>
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="px-4 py-2 border border-red-400 text-red-600 rounded hover:bg-red-50 transition"
            >
              {isCancelling ? "処理中..." : "解約する"}
            </button>
          </div>
        )}
        
        {subscription.status === 'PAUSED' && (
          <div className="mt-6">
            <button
              onClick={handleResumeSubscription}
              disabled={isPausing}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              {isPausing ? "処理中..." : "サブスクリプションを再開する"}
            </button>
          </div>
        )}
      </div>
      
      <h2 className="text-xl font-semibold mb-4">配送履歴</h2>
      
      {deliveries.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">配送履歴はまだありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <div>
                  <p className="text-sm">
                    {delivery.status === 'DELIVERED' ? '配送完了' : 
                     delivery.status === 'SHIPPED' ? '配送中' : 
                     delivery.status === 'PROCESSING' ? '準備中' : '未発送'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {delivery.shippingDate ? 
                      `発送日: ${format(new Date(delivery.shippingDate), "yyyy年MM月dd日", { locale: ja })}` : 
                      `予定発送日: ${format(new Date(delivery.createdAt), "yyyy年MM月dd日", { locale: ja })}`}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                  delivery.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                  delivery.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {
                    delivery.status === 'DELIVERED' ? '配送完了' :
                    delivery.status === 'SHIPPED' ? '配送中' :
                    delivery.status === 'PROCESSING' ? '準備中' :
                    'お届け予定'
                  }
                </span>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium">{delivery.productName}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;