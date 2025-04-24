"use client";
import React from "react";
import Link from "next/link";

const SubscriptionBanner = () => {
  return (
    <div className="px-4 py-6">
      {/* メインのサブスクリプションバナー */}
      <div className="relative bg-purple-500 text-white p-6 rounded-lg">
        <div className="z-10 relative">
          <h3 className="text-3xl font-bold mb-2">12ヶ月コース</h3>
          <p className="text-white mb-2 line-through">¥2,390/item</p>
          <div className="text-2xl font-bold">
            <span className="text-3xl">¥1,990</span>
            <span className="text-sm">/item</span>
          </div>
          <p className="text-white text-sm mt-2">1年で¥4,800以上お得！</p>
        </div>
        
        {/* 右側のイラスト要素 */}
        <div className="absolute right-4 bottom-0">
          <div className="w-32 h-32">
            {/* ここにイラストまたはユーザーアイコンを配置 */}
            <div className="h-full w-full rounded-full bg-purple-400 opacity-50"></div>
          </div>
        </div>
      </div>

      {/* 詳細情報バナー */}
      <div className="bg-pink-100 p-4 rounded-lg mt-4 text-center">
        <Link href="/subscription" className="text-pink-700 text-sm font-medium">
          サブスクリプションに興味のある方はこちら！
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionBanner;