"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const SubscriptionBanner = () => {
  return (
    <div className="px-4 py-6">
      {/* メインのサブスクリプションバナー */}
      <div className="relative bg-custom-peach text-white p-6 rounded-lg">
        <div className="z-10 relative">
          <h3 className="text-2xl font-bold mb-2 whitespace-nowrap">12ヶ月コース</h3>
          <p className="text-white mb-2">最大<span className="text-5xl font-bold">¥8,640</span> お得！</p>
          <div className="flex items-center mt-2">
            <div className="bg-yellow-300 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
              人気
            </div>
          </div>
        </div>
        
        {/* 右側のイラスト要素 */}
        <div className="absolute right-4 bottom-0">
          <div className="w-32 h-32">
            {/* ここにイラストまたはユーザーアイコンを配置 */}
            <div className="h-full w-full rounded-full bg-custom-peach-dark opacity-50"></div>
            <Image 
            src={"/Rumini.jpg"} 
            alt={"イラスト"} 
            width={128} height={128} 
            className="absolute top-0 left-0 w-full h-full rounded-full">
            </Image>
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