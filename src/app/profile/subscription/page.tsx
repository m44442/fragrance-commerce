"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SubscriptionPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  // サブスクリプション情報を取得
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/subscription`);
        
        if (response.status === 404) {
          // サブスクリプションが見つからない場合
          setSubscription(null);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("サブスクリプション情報の取得に失敗しました");
        }

        const data = await response.json();
        setSubscription(data);
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
      router.push("/login?callbackUrl=/profile/subscription");
    }
  }, [session, status, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">サブスクリプション</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
        <Link
          href="/"
          className="text-purple-600 hover:underline"
        >
          ホームに戻る
        </Link>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">サブスクリプション</h1>
        <div className="bg-white rounded-lg p-6 text-center shadow-sm">
          <p className="mb-4">アクティブなサブスクリプションがありません。</p>
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

  // サブスクリプションステータスの表示用文字列
  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'アクティブ';
      case 'PAUSED':
        return '一時停止中';
      case 'CANCELED':
        return 'キャンセル済み';
      default:
        return '不明';
    }
  };

  // 日付のフォーマット
  const formatDate = (dateString) => {
    if (!dateString) return '未定';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">サブスクリプション</h1>
      
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">サブスクリプション概要</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              subscription.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {getStatusText(subscription.status)}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">プラン</p>
                <p className="font-medium">{subscription.planName || "標準プラン"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">月額料金</p>
                <p className="font-medium">
                  ¥{subscription.monthlyPrice || "2,390"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">次回お届け日</p>
                <p className="font-medium">
                  {formatDate(subscription.nextDeliveryDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">次回請求日</p>
                <p className="font-medium">
                  {formatDate(subscription.nextBillingDate)}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href="/subscription/setting"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                サブスクリプション設定
              </Link>
              <Link
                href="/profile/delivery-history"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                配送履歴を見る
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* お届け予定の商品があれば表示 */}
      {subscription.upcomingDeliveries && subscription.upcomingDeliveries.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">お届け予定の商品</h2>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4">
              {subscription.upcomingDeliveries.map((delivery, index) => (
                <div key={index} className="flex items-center py-3 border-b last:border-b-0">
                  <div className="h-16 w-16 bg-gray-100 rounded relative overflow-hidden mr-4">
                    {delivery.productThumbnail && (
                      <img
                        src={delivery.productThumbnail}
                        alt={delivery.productName}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{delivery.productName}</h3>
                    <p className="text-sm text-gray-500">
                      お届け予定日: {formatDate(delivery.shippingDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* おすすめの商品 */}
      <div>
        <h2 className="text-lg font-semibold mb-4">おすすめの商品</h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-500">
            お客様の好みに合わせたおすすめ商品は準備中です
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;