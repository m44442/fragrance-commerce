// src/app/products/[id]/page.tsx
"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { getDetailProduct } from "@/lib/microcms/client";
import { useOptimistic } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PaymentComponent from "@/components/PaymentComponent";
import { useTransition } from "react";
import { Calendar, ShoppingBag, Droplet, Plus, ArrowRight } from "lucide-react";
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

  // 単品購入ボタンの処理 - カートに追加してカート画面へ遷移
  const handleBuyNow = async () => {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    
    if (!product) {
      console.error("Product data is not loaded yet.");
      return;
    }
    
    try {
      // カートに追加
      const response = await fetch(`/api/cart/${params?.id}`, {
        method: "POST",
        body: JSON.stringify({ 
          added: true, 
          quantity: 1
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        alert(`カートに追加できませんでした: ${data.error || response.statusText}`);
        console.error("カート追加エラー:", data);
        return;
      }
      
      // カート画面に遷移
      router.push('/cart');
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("カートに追加できませんでした。もう一度お試しください。");
    }
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
          
          {/* サブスク加入者用エリア */}
          {hasActiveSubscription ? (
            <div className="mt-4 space-y-4">
              {/* サブスクのアクション */}
              <div className="grid grid-cols-2 gap-4">
                {/* カレンダー追加ボタン - 左側 */}
                <button
                  className="relative col-span-1 min-w-[140px] py-3 flex items-center justify-center rounded-lg bg-custom-peach text-white font-medium transition-all duration-300 hover:bg-custom-peach-dark active:scale-95"
                  onClick={handleAddToCalendar}
                >
                  <span className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    <span className="text-sm md:text-base">カレンダーに追加</span>
                  </span>
                </button>
                
                {/* お試しサイズボタン - 右側 */}
                <button
                  className="relative col-span-1 min-w-[140px] py-3 flex items-center justify-center rounded-lg bg-teal-600 text-white font-medium transition-all duration-300 hover:bg-teal-700 active:scale-95"
                  onClick={() => handleAddToCart(true)}
                >
                  <span className="flex items-center">
                    <Droplet className="w-5 h-5 mr-2" />
                    <span className="text-sm md:text-base">お試しサイズ</span>
                  </span>
                </button>
              </div>
              
              {/* 単品購入ボタン - 下段に全幅 */}
              <button
                onClick={handleBuyNow}
                className="relative w-full py-4 flex items-center justify-center rounded-lg bg-gray-100 border border-gray-300 font-medium transition-all duration-300 hover:bg-gray-200 active:scale-95"
              >
                <div className="flex items-center">
                  <span className="font-medium">単品購入</span>
                  <span className="ml-2 text-lg font-semibold">¥{product.price?.toLocaleString()}</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* サブスク未加入者用エリア */}
              {/* サブスクリプションバナー - 画像をそのまま使用 */}
              <div className="relative rounded-lg overflow-hidden mb-6">
                {/* バナー画像 */}
                <Image 
                  src="/subscription_banner.jpg" 
                  alt="12ヶ月コースなら年間最大¥8,520お得！" 
                  width={600}
                  height={300}
                  className="w-full rounded-lg"
                />
                
                {/* サブスク開始ボタン */}
                <button
                  onClick={() => router.push('/subscription')}
                  className="mt-4 w-full py-3 flex items-center justify-center bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  <span>このアイテムでサブスクを始める</span>
                </button>
                
                <div className="mt-2 text-center">
                  <Link href="/subscription" className="text-sm text-[#E9A68D] flex items-center justify-center">
                    サブスクについてもっとみる
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              
              {/* 単品購入ボタン */}
              <button
                onClick={handleBuyNow}
                className="relative w-full py-4 flex items-center justify-center rounded-lg bg-gray-100 border border-gray-300 font-medium transition-all duration-300 hover:bg-gray-200 active:scale-95"
              >
                <div className="flex items-center">
                  <span className="font-medium">単品購入(専用アトマイザーでお届け)</span>
                  <span className="ml-2 text-lg font-semibold">¥{product.price?.toLocaleString()}</span>
                </div>
              </button>
              
              {/* お試しサイズボタン - 未加入者も表示するが、クリック時にサブスク加入を促す */}
              <button
                onClick={() => alert("お試しサイズはサブスクリプション会員限定です。サブスクリプションに加入すると利用できます。")}
                className="relative w-full py-3 flex items-center justify-center rounded-lg border border-teal-600 text-teal-600 font-medium transition-all duration-300 hover:bg-teal-50 active:scale-95"
              >
                <span className="flex items-center">
                  <Droplet className="w-5 h-5 mr-2" />
                  <span>お試しサイズ</span>
                </span>
              </button>
            </div>
          )}
          
          {/* 決済コンポーネントの表示 */}
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
