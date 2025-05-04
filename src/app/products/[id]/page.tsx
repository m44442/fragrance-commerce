"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { getDetailProduct } from "@/lib/microcms/client";
import { useOptimistic } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PaymentComponent from "@/components/PaymentComponent";
import { useTransition } from "react";
import { Calendar, ShoppingBag } from "lucide-react";
import Link from "next/link";

const DetailProduct = () => {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [sampleSize, setSampleSize] = useState(false);
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const user: any = session?.user;

  const [optimisticLiked, addOptimisticLiked] = useOptimistic(
    isLiked,
    (_currentLiked, optimisticValue: boolean) => optimisticValue
  );

  const [optimisticAddedToCart, addOptimisticAddedToCart] = useOptimistic(
    isAddedToCart,
    (_currentAddedToCart, optimisticValue: boolean) => optimisticValue
  );

  useEffect(() => {
    const fetchProduct = async () => {
      if (!params?.id) return;
      if (typeof params.id === "string") {
        const productData = await getDetailProduct(params.id);
        setProduct(productData);
      }
    };
    
    const checkSubscriptionStatus = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/subscription`);
        if (response.ok) {
          const data = await response.json();
          setHasActiveSubscription(data.status === 'ACTIVE' || data.status === 'PAUSED');
        }
      } catch (error) {
        console.error("サブスクリプション情報の取得に失敗:", error);
      }
    };
    
    fetchProduct();
    if (session?.user) {
      checkSubscriptionStatus();
    }
  }, [params?.id, session]);

  const handleLike = async () => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    
    // 楽観的更新をstartTransitionでラップする
    startTransition(() => {
      addOptimisticLiked(!optimisticLiked);
    });
    
    try {
      await fetch(`/api/like/${params?.id}`, {
        method: "POST",
        body: JSON.stringify({ liked: !optimisticLiked }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      setIsLiked(!optimisticLiked);
    } catch (error) {
      console.error("Error liking the product:", error);
      // エラー時も楽観的更新の復元をトランジション内で行う
      startTransition(() => {
        addOptimisticLiked(optimisticLiked);
      });
    }
  };
  const handleAddToCart = async (isSample = false) => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    
    // お試しサイズを注文する場合はサブスク加入者かチェック
    if (isSample && !hasActiveSubscription) {
      alert("お試しサイズはサブスクリプション会員限定です");
      return;
    }

    startTransition(() => {
      addOptimisticAddedToCart(true); // 楽観的更新
    });
    
    try {
      const response = await fetch(`/api/cart/${params?.id}`, {
        method: "POST",
        body: JSON.stringify({ 
          added: true, 
          quantity: 1,
          isSample: isSample // お試しサイズの場合はtrueを送信
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(`カートに追加できませんでした: ${data.error || response.statusText}`);
        console.error("カート追加エラー:", data);
        return;
      }
      
      setIsAddedToCart(true);
      // 追加成功メッセージを表示
      alert(isSample ? "お試しサイズ(1.5ml)をカートに追加しました" : "商品をカートに追加しました");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("カートに追加できませんでした。もう一度お試しください。");
      
      startTransition(() => {
        addOptimisticAddedToCart(false); // エラー時は戻す
      });
    }
  };

  // カレンダーに追加する機能
  const handleAddToCalendar = () => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    
    // カレンダーページのURLに商品IDを付与して遷移
    router.push(`/subscription/calendar?productId=${params?.id}`);
  };

  const startCheckout = () => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    
    if (!product) {
      console.error("Product data is not loaded yet.");
      return;
    }
    
    setShowPayment(true);
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* 画像コンテナに相対配置と余白を追加 */}
        <div className="relative px-20 pt-10">
          <Image
            src={product.thumbnail.url}
            alt={product.title}
            className="w-full h-80 object-cover object-center rounded-lg"
            width={284}
            height={280}
          />
          
          {/* いいねボタンを右下に配置 */}
          <button
            onClick={handleLike}
            className="absolute bottom-3 right-9 p-5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md group"
            aria-label={optimisticLiked ? "いいね済み" : "いいね"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              className={`w-6 h-6 transition-all duration-50 ${
                optimisticLiked 
                  ? "stroke-red-600 fill-red-600 scale-110" 
                  : "stroke-gray-800 fill-transparent group-hover:stroke-red-500"
              }`}
              strokeWidth="1.5"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
              />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <h2 className="text-2xl font-bold">{product.title}</h2>
          <div
            className="text-gray-700 mt-2"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              公開日: {new Date(product.publishedAt as any).toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">
              最終更新: {new Date(product.updatedAt as any).toLocaleString()}
            </span>
          </div>

          <div className="mt-4 text-xl font-bold">
            ¥{product.price?.toLocaleString()}
          </div>
          
          <div className="mt-6 grid grid-cols-2 md:flex md:flex-wrap gap-3">

             {/* サブスク加入者用ボタン */}
            {hasActiveSubscription && (
              <>
              {/* カレンダー追加ボタン */}
                <button
                  className="group relative col-span-2 md:col-span-1 md:flex-1 min-w-[140px] px-4 py-3 flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:from-purple-600 hover:to-purple-700 active:scale-95"
                  onClick={handleAddToCalendar}
                >
                  <span className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-1" />
                    <span className="text-sm md:text-base">カレンダーに追加</span>
                  </span>
                </button>
                {/* お試しサイズボタン */}
                <button
                  className="group relative col-span-2 md:col-span-1 md:flex-1 min-w-[140px] px-4 py-3 flex items-center justify-center rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:from-teal-600 hover:to-teal-700 active:scale-95"
                  onClick={() => handleAddToCart(true)}
                >
                  <span className="flex items-center">
                    <ShoppingBag className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-1" />
                    <span className="text-sm md:text-base">お試しサイズ(1.5ml)</span>
                  </span>
                </button>
                
                
              </>
            )}


            {/* カート追加ボタン */}
            <button
              className={`group relative col-span-1 md:flex-1 min-w-[140px] px-4 py-3 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:from-blue-600 hover:to-blue-700 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                optimisticAddedToCart ? "bg-opacity-50" : ""
              }`}
              onClick={() => handleAddToCart(false)}
              disabled={optimisticAddedToCart}
            >
              <span className="flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2 transition-transform group-hover:-translate-y-1" />
                <span>カートに追加</span>
              </span>
            </button>
            
            {/* 今すぐ購入ボタン */}
            <button
              className="group relative col-span-1 md:flex-1 min-w-[140px] px-4 py-3 flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:from-indigo-600 hover:to-indigo-700 active:scale-95"
              onClick={startCheckout}
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>今すぐ購入</span>
              </span>
            </button>
            
           
            
            {/* いいねボタンは右下のハートに移動したため、ここから削除 */}
          </div>
          
          {/* サブスク非加入者用バナー */}
          {!hasActiveSubscription && (
            <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0 md:mr-6">
                  <h3 className="text-lg font-bold text-purple-800 mb-2">サブスクリプション会員特典</h3>
                  <p className="text-purple-700">毎月お気に入りの香水が届く！<br className="md:hidden" />お試しサイズ(1.5ml)も一緒に注文すると300円割引！</p>
                </div>
                <Link 
                  href="/subscription" 
                  className="group relative inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium transition-all duration-300 hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 active:scale-95"
                >
                  <span className="flex items-center">
                    <span>サブスクリプションを始める</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          )}
          
          {/* 決済コンポーネントの表示 (変更なし) */}
          {showPayment && (
            <div className="mt-8 border-t pt-6">
              <PaymentComponent 
                productId={product.id} 
                productName={product.title} 
                productPrice={product.price} 
                brandName={product.brand} 
                onPaymentComplete={() => setShowPayment(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailProduct;
