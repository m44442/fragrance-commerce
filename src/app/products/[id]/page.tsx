"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { getDetailProduct } from "@/lib/microcms/client";
import { useOptimistic } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import PaymentComponent from "@/components/PaymentComponent"; // 新しく作成するコンポーネントをインポート

const DetailProduct = () => {
  const params = useParams();
  const [product, setProduct] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false); // 決済UIの表示制御
  const { data: session } = useSession();
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
        console.log("Fetched product data:", productData);
        setProduct(productData);
      }
    };
    fetchProduct();
  }, [params?.id]);

  const handleLike = async () => {
    // ログインチェック
    if (!session) {
      // ログインページにリダイレクト
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    
    addOptimisticLiked(!optimisticLiked);
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
      addOptimisticLiked(optimisticLiked);
    }
  };

  const handleAddToCart = async () => {
    // ログインチェック
    if (!session) {
      // ログインページにリダイレクト
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    
    addOptimisticAddedToCart(!optimisticAddedToCart);
    try {
      await fetch(`/api/cart/${params?.id}`, {
        method: "POST",
        body: JSON.stringify({ added: !optimisticAddedToCart }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      setIsAddedToCart(!optimisticAddedToCart);
    } catch (error) {
      console.error("Error adding to cart:", error);
      addOptimisticAddedToCart(optimisticAddedToCart);
    }
  };

  // 変更: チェックアウトボタンクリック時に決済UIを表示
  const startCheckout = () => {
    // ログインチェック
    if (!session) {
      // ログインページにリダイレクト
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    
    if (!product) {
      console.error("Product data is not loaded yet.");
      return;
    }
    
    // 決済UIを表示
    setShowPayment(true);
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <Image
          src={product.thumbnail.url}
          alt={product.title}
          className="w-full h-80 object-cover object-center"
          width={284}
          height={280}
        />
        <div className="p-4">
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

          {/* 金額表示を追加 */}
          <div className="mt-4 text-xl font-bold">
            ¥{product.price?.toLocaleString()}
          </div>

          <div className="flex justify-between items-center mt-4">
            <button
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 ${optimisticAddedToCart ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleAddToCart}
              disabled={optimisticAddedToCart}
            >
              {optimisticAddedToCart ? "カートに追加済み" : "カートに追加"}
            </button>
            <button
              className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700`}
              onClick={startCheckout}
            >
              今すぐ購入
            </button>
            <button
              className={`px-4 py-2 rounded ml-2 ${optimisticLiked ? "bg-red-700" : "bg-red-500"} text-white hover:bg-red-700`}
              onClick={handleLike}
            >
              {optimisticLiked ? "♥ いいね済み" : "♥ いいね"}
            </button>
          </div>
          
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
