// src/app/components/NewArrivalsSection.tsx
"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/microcms/client";
import { productType } from "@/types/types";

const NewArrivalsSection = async () => {
  const { contents } = await getAllProducts();
  
  // 新着商品のみをフィルタリング (最新5件)
  const newProducts = contents
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">新着商品</h2>
        <Link href="/new-arrivals" className="text-gray-500 text-sm">
          もっと見る &gt;
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {newProducts.map((product: productType) => (
          <Link key={product.id} href={`/products/${product.id}`} className="block">
            <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
              {/* 新着バッジ */}
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                NEW
              </div>
              
              {/* 商品画像 */}
              <div className="h-40 bg-gray-200 relative">
                {product.thumbnail?.url ? (
                  <Image 
                    src={product.thumbnail.url} 
                    alt={product.title} 
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
                <p className="text-xs text-gray-500">{product.brand}</p>
                <h3 className="text-sm font-medium truncate">{product.title}</h3>
                <p className="text-xs font-semibold mt-1">¥{product.price.toLocaleString()}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default NewArrivalsSection;