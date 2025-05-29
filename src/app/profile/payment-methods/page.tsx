// src/app/profile/payment-methods/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const PaymentMethodsPage = () => {
  const { data: session } = useSession();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // テストデータを表示
    setPaymentMethods([
      { 
        id: "pm_test", 
        brand: "Visa", 
        last4: "4242",
        exp_month: 12,
        exp_year: 2024
      }
    ]);
    setIsLoading(false);
  }, [session]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-custom-peach rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">支払い方法</h1>
      
      {paymentMethods.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500 mb-4">登録されている支払い方法はありません</p>
          <button
            className="bg-custom-peach text-white px-4 py-2 rounded-lg"
          >
            支払い方法を追加
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg overflow-hidden border">
            <ul className="divide-y">
              {paymentMethods.map(method => (
                <li key={method.id} className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-12 h-8 bg-gray-200 rounded mr-3 flex items-center justify-center text-gray-500">
                      {method.brand}
                    </div>
                    <div>
                      <p className="font-medium">
                        {method.brand} •••• {method.last4}
                      </p>
                      <p className="text-sm text-gray-500">
                        有効期限: {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <button
            className="w-full bg-custom-peach text-white py-2 rounded-lg"
          >
            支払い方法を追加
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsPage;