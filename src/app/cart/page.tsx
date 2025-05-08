"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import PaymentComponent from "@/components/PaymentComponent"; // 既存の決済コンポーネントをインポート

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice: number | null;
    brand: string;
    thumbnailUrl: string;
  };
}

interface CartData {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

const CartPage = () => {
  const { data: session } = useSession();
  const [cart, setCart] = useState<CartData>({ items: [], totalItems: 0, totalPrice: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPayment, setShowPayment] = useState(false); // 決済UIの表示制御
  
  useEffect(() => {
    const fetchCartData = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          setCart(data);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCartData();
  }, [session]);
  
  const updateCartItem = async (productId: string, added: boolean, quantity = 1) => {
    if (!session?.user) return;
    
    setIsUpdating(true);
    try {
      await fetch(`/api/cart/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ added, quantity }),
      });
      
      // カートデータを再取得
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleRemoveItem = (productId: string) => {
    updateCartItem(productId, false);
  };
  
  const handleQuantityChange = (productId: string, newQuantity: number) => {
  if (newQuantity <= 0) {
    handleRemoveItem(productId);
    return;
  }
  
  // 楽観的UIアップデート（APIレスポンスを待たずに画面を即時更新）
  setCart(prevCart => {
    const updatedItems = prevCart.items.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          quantity: newQuantity
        };
      }
      return item;
    });
    
    const newTotalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    const newTotalPrice = updatedItems.reduce((sum, item) => 
      sum + (item.product.discountPrice || item.product.price) * item.quantity, 0);
    
    return {
      ...prevCart,
      items: updatedItems,
      totalItems: newTotalItems,
      totalPrice: newTotalPrice
    };
  });
  
  // APIリクエストを送信して数量を更新
  setIsUpdating(true);
  fetch(`/api/cart/${productId}/update-quantity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: newQuantity }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }
      return response.json();
    })
    .then(data => {
      // サーバーからの最新データでカートを更新
      setCart(data);
    })
    .catch(error => {
      console.error("Error updating cart quantity:", error);
      
      // エラー時に元のデータを再取得して表示を元に戻す
      fetch('/api/cart')
        .then(response => response.json())
        .then(data => setCart(data))
        .catch(err => console.error("Error refreshing cart:", err));
    })
    .finally(() => {
      setIsUpdating(false);
    });
};
  
  // チェックアウトボタンクリック時の処理
  const handleCheckout = () => {
    setShowPayment(true);
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">ショッピングカート</h1>
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  if (!session?.user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">ショッピングカート</h1>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">カートを表示するにはログインが必要です</p>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent("/cart")}`}
            className="inline-block bg-custom-peach text-white px-4 py-2 rounded-lg hover:bg-custom-peach-dark transition"
          >
            ログイン
          </Link>
        </div>
      </div>
    );
  }
  
  if (cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">ショッピングカート</h1>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">カートに商品がありません</p>
          <Link
            href="/"
            className="inline-block bg-custom-peach text-white px-4 py-2 rounded-lg hover:bg-custom-peach-dark transition"
          >
            商品を探す
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">ショッピングカート</h1>
      
      {!showPayment ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* カートアイテム一覧 */}
            <div className="divide-y">
              {cart.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center">
                  {/* 商品画像 */}
                  <div className="h-24 w-24 bg-gray-100 rounded relative overflow-hidden mr-4">
                    {item.product.thumbnailUrl ? (
                      <Image
                        src={item.product.thumbnailUrl}
                        alt={item.product.name}
                        layout="fill"
                        objectFit="cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                  
                  {/* 商品情報 */}
                  <div className="flex-1">
                    <Link href={`/products/${item.productId}`} className="hover:underline">
                      <h3 className="font-medium">{item.product.name}</h3>
                    </Link>
                    <p className="text-sm text-gray-500">{item.product.brand}</p>
                    <p className="font-semibold mt-1">
                      ¥{(item.product.discountPrice || item.product.price).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* 数量調整 */}
                  <div className="flex items-center mr-4">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                      disabled={isUpdating}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="mx-2 w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                      disabled={isUpdating}
                      className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  
                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    disabled={isUpdating}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* 合計金額 */}
            <div className="bg-gray-50 p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500">合計（{cart.totalItems}点）</p>
                </div>
                <div className="text-xl font-bold">
                  ¥{cart.totalPrice.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          
          {/* チェックアウトボタン */}
          <button
            onClick={handleCheckout}
            className="block w-full bg-custom-peach text-white py-3 px-4 rounded-lg text-center font-medium hover:bg-custom-peach-dark transition"
          >
            レジに進む
          </button>
          
          <Link
            href="/"
            className="block text-center text-custom-peach hover:underline"
          >
            買い物を続ける
          </Link>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setShowPayment(false)}
            className="mb-6 text-purple-600 hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            カートに戻る
          </button>
          
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6 p-4">
            <h2 className="text-lg font-semibold mb-3">注文概要</h2>
            <div className="space-y-2 mb-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-gray-600">
                    {item.product.name} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    ¥{((item.product.discountPrice || item.product.price) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between font-bold">
                <span>合計</span>
                <span>¥{cart.totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* 既存の決済コンポーネントを使用 */}
          <PaymentComponent 
            productId="cart"  // カート全体を示す特別な値
            productName={`カート内商品（${cart.totalItems}点）`}
            productPrice={cart.totalPrice}
            brandName=""
            onPaymentComplete={() => {
              // 支払い完了後の処理
              // カートをクリアしてサクセスページに遷移など
              window.location.href = "/checkout/success";
            }}
          />
        </div>
      )}
    </div>
  );
};

export default CartPage;