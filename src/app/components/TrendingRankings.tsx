"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/microcms/client";
import { productType } from "@/types/types";

const TrendingRankings = () => {
  const [contents, setContents] = useState<productType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { contents: fetchedContents } = await getAllProducts();
        console.log(fetchedContents);
        setContents(fetchedContents);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const sortedContents = contents.sort((a: productType, b: productType) => (a.rank || 0) - (b.rank || 0));

  if (loading) {
    return (
      <div className="px-4 py-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">人気のアイテム</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">人気のアイテム</h2>
        <Link href="/rankings" className="text-gray-500 text-sm">
          もっと見る &gt;
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        この1週間でアクセス数が急増したアイテムをご紹介します。
      </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sortedContents.map((contents: productType) => (
            <Link key={contents.id} href={`/products/${contents.id}`} className="block">
              <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
                {/* ランキング表示 */}
                <div className="absolute top-0 left-0 w-8 h-8 bg-yellow-500 text-white flex items-center justify-center font-bold z-10">
                  {contents.rank}
                </div>
                
                {/* 商品画像 */}
                <div className="h-40 bg-gray-200 relative">
                  {contents.thumbnail?.url ? (
                    <Image 
                      src={contents.thumbnail.url} 
                      alt={contents.title} 
                      layout="fill" 
                      objectFit="cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                
                {/* 商品情報 */}
                <div className="p-3">
                  <p className="text-xs text-gray-500">{contents.brand}</p>
                  <h3 className="text-sm font-medium truncate">{contents.title}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-pink-500">{contents.category}</p>
                    <p className="text-xs font-semibold">¥{contents.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
    </div>
  );
};

export default TrendingRankings;