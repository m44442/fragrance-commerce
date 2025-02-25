"use client";
import React from "react";
import Link from "next/link";

const brands = [
  { id: 1, name: "PARFUM SATORI", nameJp: "パルファン サトリ", promoText: "特集テキスト", imageUrl: "/images/brand1.jpg" },
  { id: 2, name: "JO MALONE LONDON", nameJp: "ジョー マローン ロンドン", promoText: "特集テキスト", imageUrl: "/images/brand2.jpg" },
  // 他のブランドデータ...
];

const BrandCard = ({ brand }:any) => (
  <div className="relative w-64 h-64 bg-white rounded-lg shadow-md overflow-hidden">
    <img src={brand.imageUrl} alt={brand.name} className="w-full h-full object-cover" />
    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
      <h3 className="text-white text-lg font-semibold">{brand.name}</h3>
      <p className="text-white text-sm">{brand.nameJp}</p>
      <p className="text-white text-xs">{brand.promoText}</p>
    </div>
  </div>
);

const FeaturedBrands = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">特集ブランド</h2>
        <Link href="/brands" className="text-blue-500 hover:underline">もっと見る</Link>
      </div>
      <div className="flex overflow-x-scroll space-x-4">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </div>
  );
};

export default FeaturedBrands;