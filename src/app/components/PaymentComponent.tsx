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

// Stripeの初期化
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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

  // 購入履歴を手動で作成する関数
  const createPurchaseRecord = async (productId: string, paymentIntentId: string) => {
    try {
      console.log('Creating purchase record for productId:', productId);
      const response = await fetch('/api/purchase-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          paymentIntentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Purchase record created:', data);
      } else {
        console.error('Failed to create purchase record:', response.status);
      }
    } catch (error) {
      console.error('Error creating purchase record:', error);
    }
  };

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
            // 購入履歴を手動で作成
            createPurchaseRecord(productId, paymentIntent.id);
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

    try {
      // elements.submit()で選択された決済方法を取得
      const { error: submitError, selectedPaymentMethod } = await elements.submit();

      if (submitError) {
        setMessage(submitError.message || "フォームの送信中にエラーが発生しました。");
        setIsLoading(false);
        return;
      }

      // elements.submit()で選択された決済方法を取得
      const submitResult = await elements.submit();

      if (submitResult.error) {
        setMessage(submitResult.error.message || "フォームの送信中にエラーが発生しました。");
        setIsLoading(false);
        return;
      }

      // Stripe決済の確認
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
        redirect: 'if_required'
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message || "決済エラーが発生しました。");
        } else {
          setMessage("予期せぬエラーが発生しました。");
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // 決済成功時に購入履歴を作成
        setMessage("決済が完了しました！");
        await createPurchaseRecord(productId, paymentIntent.id);
        onPaymentComplete();
        // 成功ページにリダイレクト
        window.location.href = `${window.location.origin}/checkout/success`;
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      setMessage("決済処理中にエラーが発生しました。");
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
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
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full bg-custom-peach text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50"
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
        const response = await fetch("/api/checkout", {
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

  // エラーがある場合
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#9333ea',
    },
  };

  const options = {
    clientSecret,
    appearance,
    locale: 'ja' as const,
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