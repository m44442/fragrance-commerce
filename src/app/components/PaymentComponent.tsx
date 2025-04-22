// src/app/components/PaymentComponent.tsx
"use client";
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  AddressElement,
} from "@stripe/react-stripe-js";
import { useSession } from "next-auth/react";

// 環境変数からStripeのキーを取得 - ここが重要
// undefinedの場合は早期に対処
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

// Stripeの初期化
const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

// PaymentFormコンポーネント
const PaymentForm = ({
  productId,
  productName,
  productPrice,
  brandName,
  clientSecret,
  onPaymentComplete,
}: {
  productId: string;
  productName: string;
  productPrice: number;
  brandName: string;
  clientSecret: string;
  onPaymentComplete: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("card");

  useEffect(() => {
    if (!stripe) return;

    // URLからステータスパラメータを取得
    const clientSecretParam = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecretParam) return;

    stripe
      .retrievePaymentIntent(clientSecretParam)
      .then(({ paymentIntent }) => {
        if (!paymentIntent) return;
        
        switch (paymentIntent.status) {
          case "succeeded":
            setMessage("決済が完了しました！");
            onPaymentComplete();
            break;
          case "processing":
            setMessage("決済処理中です。完了までお待ちください。");
            break;
          case "requires_payment_method":
            setMessage("決済に失敗しました。別の決済方法をお試しください。");
            break;
          default:
            setMessage("エラーが発生しました。しばらくしてからお試しください。");
            break;
        }
      });
  }, [stripe, onPaymentComplete]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    // ここでPaidyの処理を分岐させることができます
    if (selectedPaymentMethod === "paidy") {
      try {
        // Paidyの処理（バックエンドへリクエスト）
        const response = await fetch('/api/checkout/paidy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            quantity: 1
          }),
        });
        
        const data = await response.json();
        
        if (data.checkout_url) {
          // Paidyの決済ページにリダイレクト
          window.location.href = data.checkout_url;
        } else {
          setMessage("Paidy決済の準備に失敗しました。");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Paidy決済エラー:", error);
        setMessage("Paidy決済の処理中にエラーが発生しました。");
        setIsLoading(false);
      }
      return;
    }

    // Stripe決済の処理
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "決済エラーが発生しました。");
      } else {
        setMessage("予期せぬエラーが発生しました。");
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">お支払い方法を選択</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod("card")}
            className={`p-4 border rounded-lg flex flex-col items-center ${
              selectedPaymentMethod === "card" ? "border-purple-500 bg-purple-50" : "border-gray-200"
            }`}
          >
            <span className="text-lg mb-2">💳</span>
            <span className="font-medium">クレジットカード</span>
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedPaymentMethod("paidy")}
            className={`p-4 border rounded-lg flex flex-col items-center ${
              selectedPaymentMethod === "paidy" ? "border-purple-500 bg-purple-50" : "border-gray-200"
            }`}
          >
            <span className="text-lg mb-2">📱</span>
            <span className="font-medium">あと払い</span>
            <span className="text-xs text-gray-500 mt-1">Paidy</span>
          </button>
        </div>
      </div>

      {/* カード情報の入力フォーム - カード選択時のみ表示 */}
      {selectedPaymentMethod === "card" && (
        <>
          <PaymentElement className="mb-6" />
          <AddressElement 
            options={{
              mode: 'shipping',
              allowedCountries: ['JP'],
              fields: {
                phone: 'always',
              },
            }} 
            className="mb-6" 
          />
        </>
      )}

      {/* Paidyの場合は住所情報のみ取得 */}
      {selectedPaymentMethod === "paidy" && (
        <AddressElement 
          options={{
            mode: 'shipping',
            allowedCountries: ['JP'],
            fields: {
              phone: 'always',
            },
          }} 
          className="mb-6" 
        />
      )}

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">商品</span>
          <span className="font-medium">{productName}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">ブランド</span>
          <span>{brandName}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>合計</span>
          <span>¥{productPrice.toLocaleString()}</span>
        </div>
      </div>

      <button
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50"
      >
        {isLoading ? "処理中..." : "今すぐ支払う"}
      </button>

      {message && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-center text-gray-700">
          {message}
        </div>
      )}
    </form>
  );
};

// メインのPaymentComponentコンポーネント
const PaymentComponent = ({
  productId,
  productName,
  productPrice,
  brandName,
  onPaymentComplete = () => {},
}: {
  productId: string;
  productName: string;
  productPrice: number;
  brandName: string;
  onPaymentComplete?: () => void;
}) => {
  const { data: session } = useSession();
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ログインしていない場合は処理しない
    if (!session?.user) return;

    // PaymentIntent作成
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: productId,
            amount: productPrice,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("決済の準備に失敗しました。");
        }
      } catch (error) {
        console.error("Error creating PaymentIntent:", error);
        setError("決済の準備中にエラーが発生しました。");
      }
    };

    createPaymentIntent();
  }, [session, productId, productPrice]);

  // stripePromiseがnullの場合の処理
  if (!stripePromise) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Stripe設定エラー: 環境変数が正しく設定されていません。
      </div>
    );
  }

  // エラーがある場合
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#9333ea',
    },
  };

  const options = {
    clientSecret,
    appearance,
    locale: 'ja',
    externalPaymentMethodTypes: ['external_paidy'],
  };

  return (
    <div className="py-6">
      {clientSecret ? (
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm
            productId={productId}
            productName={productName}
            productPrice={productPrice}
            brandName={brandName}
            clientSecret={clientSecret}
            onPaymentComplete={onPaymentComplete}
          />
        </Elements>
      ) : (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

export default PaymentComponent;