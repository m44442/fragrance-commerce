"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// 新着商品の型定義
interface NewProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  isNew: boolean;
}

const NewArrivalsSection = () => {
  const [products, setProducts] = useState<NewProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // データ取得用の関数
  useEffect(() => {
    const fetchNewProducts = async () => {
      try {
        // 実際の実装ではAPIからデータを取得
        // const response = await fetch('/api/products/new');
        // const data = await response.json();
        
        // デモ用のモックデータ
        const mockData: NewProduct[] = [
          { 
            id: "1", 
            name: "ウッディ コロン", 
            brand: "HERMÈS", 
            price: 12000, 
            imageUrl: "/images/new1.jpg",
            isNew: true
          },
          { 
            id: "2", 
            name: "ローズ ミスト", 
            brand: "Dior", 
            price: 15000, 
            imageUrl: "/images/new2.jpg",
            isNew: true
          },
          { 
            id: "3", 
            name: "シトラス サンセット", 
            brand: "Tom Ford", 
            price: 22000, 
            imageUrl: "/images/new3.jpg",
            isNew: true
          },
          { 
            id: "4", 
            name: "アクア ディ パルマ", 
            brand: "Le Labo", 
            price: 18000, 
            imageUrl: "/images/new4.jpg",
            isNew: true
          },
        ];
        
        setProducts(mockData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch new products:", error);
        setLoading(false);
      }
    };

    fetchNewProducts();
  }, []);

  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">新着商品</h2>
        <Link href="/new-arrivals" className="text-gray-500 text-sm">
          もっと見る &gt;
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="block">
              <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
                {/* 新着バッジ */}
                {product.isNew && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    NEW
                  </div>
                )}
                
                {/* 商品画像 */}
                <div className="h-40 bg-gray-200 relative">
                  {product.imageUrl ? (
                    <Image 
                      src={product.imageUrl} 
                      alt={product.name} 
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
                  <h3 className="text-sm font-medium truncate">{product.name}</h3>
                  <p className="text-xs font-semibold mt-1">¥{product.price.toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewArrivalsSection;