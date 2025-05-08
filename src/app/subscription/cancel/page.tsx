// src/app/subscription/cancel/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, XCircle, CheckCircle, ArrowLeft } from "lucide-react";

const SubscriptionCancelPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSurveyRequired, setIsSurveyRequired] = useState(true);

  // サブスク情報取得
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/subscription`);
        
        if (response.status === 404) {
          router.push("/subscription");
          return;
        }

        if (!response.ok) {
          throw new Error("サブスクリプション情報の取得に失敗しました");
        }

        const data = await response.json();
        setSubscription(data);
      } catch (err: any) {
        console.error("Error fetching subscription:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchSubscription();
    } else if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/subscription/cancel");
    }
  }, [session, status, router]);

  // サブスクリプションをキャンセルする
  const handleCancel = async () => {
    if (!session?.user?.id || !subscription) return;
    
    // アンケートが必須だが回答していない場合
    if (isSurveyRequired && !cancelReason) {
      setError("解約理由を選択してください");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/subscription/${subscription.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: cancelReason
        })
      });

      if (!response.ok) {
        throw new Error("キャンセル処理中にエラーが発生しました");
      }

      // キャンセル成功
      setSuccess(true);
      
      // レスポンスを取得して状態を更新
      const data = await response.json();
      setSubscription(data);
      
      // 5秒後にマイページにリダイレクト
      setTimeout(() => {
        router.push("/profile/subscription");
      }, 5000);
      
    } catch (err: any) {
      console.error("Error canceling subscription:", err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="flex justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  // キャンセル成功画面
  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">サブスクリプションをキャンセルしました</h1>
          <p className="text-gray-600 mb-6">
            ご利用いただきありがとうございました。サブスクリプションは正常にキャンセルされました。
            またのご利用をお待ちしております。
          </p>
          <p className="text-sm text-gray-500 mb-6">
            5秒後にマイページに移動します...
          </p>
          <Link 
            href="/profile/subscription" 
            className="inline-block bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            マイページに戻る
          </Link>
        </div>
      </div>
    );
  }

  // サブスクリプションが存在しない場合
  if (!subscription) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">サブスクリプションが見つかりません</h1>
          <p className="text-gray-600 mb-6">
            アクティブなサブスクリプションが見つかりませんでした。
          </p>
          <Link 
            href="/subscription" 
            className="inline-block bg-custom-peach text-white px-6 py-2 rounded-lg hover:bg-custom-peach-dark transition"
          >
            サブスクリプションに登録する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-md p-8">
        <Link href="/profile/subscription" className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span>サブスクリプション管理に戻る</span>
        </Link>
        
        <div className="flex items-center mb-6">
          <XCircle className="w-8 h-8 text-red-500 mr-3" />
          <h1 className="text-2xl font-bold">サブスクリプションをキャンセル</h1>
        </div>
        
        <div className="bg-red-50 border border-red-100 p-4 rounded-lg mb-8 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">サブスクリプションのキャンセルについて</p>
            <p className="text-red-600 text-sm mt-1">
              キャンセルすると、サブスクリプションは直ちに停止され、今後の請求は発生しません。
              ただし、すでに出荷済みのお届け分については配送されます。
            </p>
          </div>
        </div>
        
        {/* 現在のサブスクリプション情報 */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">現在のサブスクリプション</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">プラン</p>
                <p className="font-medium">{subscription.planName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ステータス</p>
                <p className="font-medium">
                  <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    アクティブ
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">月額料金</p>
                <p className="font-medium">¥{subscription.price?.toLocaleString() || "2,390"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">次回請求日</p>
                <p className="font-medium">
                  {subscription.nextBillingDate 
                    ? new Date(subscription.nextBillingDate).toLocaleDateString('ja-JP') 
                    : '未定'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* キャンセル理由のアンケート */}
        {isSurveyRequired && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3">キャンセル理由</h2>
            <p className="text-gray-600 text-sm mb-4">
              サービス改善のため、よろしければ解約理由をお聞かせください。
            </p>
            
            <div className="space-y-3">
              {[
                { id: "price", label: "料金が高いと感じる" },
                { id: "notused", label: "サービスを利用する機会がない" },
                { id: "disappointed", label: "サービス内容に満足できなかった" },
                { id: "found_alternative", label: "他のサービスの方が良いと感じた" },
                { id: "financial", label: "経済的な理由" },
                { id: "other", label: "その他" }
              ].map(reason => (
                <label key={reason.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason.id}
                    checked={cancelReason === reason.id}
                    onChange={() => setCancelReason(reason.id)}
                    className="mr-3"
                  />
                  <span>{reason.label}</span>
                </label>
              ))}
            </div>
            
            {error && (
              <div className="mt-4 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
        
        {/* キャンセルボタン */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                処理中...
              </div>
            ) : (
              'サブスクリプションをキャンセルする'
            )}
          </button>
          
          <Link
            href="/profile/subscription"
            className="text-center text-gray-600 hover:text-gray-800"
          >
            キャンセルせずに戻る
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelPage;