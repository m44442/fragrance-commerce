"use client";
import React from "react";
import Image from "next/image";

const rankingFragrance = [
  { id: 1, rank: 1, brand: "ブランド1", title: "商品1", price: 2500, priceIncrease: 500, tags: ["オリエンタル", "フローラル"], thumbnail: "/public/globe.svg" },
  { id: 2, rank: 2, brand: "ブランド2", title: "商品2", price: 3000, priceIncrease: 700, tags: ["ウッディ", "シトラス"], thumbnail: "/public/globe.svg" },
  // 他のランキングデータ...
];

const RankingItem = ({ fragrance }: any) => (
  <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-md">
    <Image src={fragrance?.thumbnail} alt={fragrance?.title || "香水のタイトル"} width={64} height={64} className="w-16 h-16 object-cover rounded-full" />
    <div>
      <h3 className="text-lg font-semibold">{fragrance.rank}. {fragrance.title}</h3>
      <p className="text-sm text-gray-500">{fragrance.brand}</p>
      <p className="text-sm text-gray-500">値段：{fragrance.price}円 (+{fragrance.priceIncrease}円)</p>
      <div className="flex space-x-2">
        {fragrance.tags.map((tag: string, index: number) => (
          <span key={index} className="text-xs bg-gray-200 rounded-full px-2 py-1">{tag}</span>
        ))}
      </div>
    </div>
  </div>
);

const TrendingRankings = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">トレンドランキング</h2>
      <div className="grid grid-cols-1 gap-4">
        {rankingFragrance.map((fragrance) => (
          <RankingItem key={fragrance.id} fragrance={fragrance} />
        ))}
      </div>
    </div>
  );
};

export default TrendingRankings;