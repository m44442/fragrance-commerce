// src/app/components/CategorySection.tsx
"use client";
import React from "react";
import Link from "next/link";
import { 
  ShoppingBag, // ブランド用
  Award, // ランキング用
  Sparkles, // 新着用
  Droplet, // カテゴリ（香りの系統）用
  Heart, // 推し香水用
} from "lucide-react";

// カテゴリの定義
const categories = [
  { id: 1, name: "ブランド", icon: ShoppingBag, href: "/brands" },
  { id: 2, name: "ランキング", icon: Award, href: "/rankings" },
  { id: 3, name: "新着", icon: Sparkles, href: "/new-arrivals" },
  { id: 4, name: "カテゴリ", icon: Droplet, href: "/categories" },
  { id: 5, name: "推し香水", icon: Heart, href: "/favorites" },
];

const CategorySection = () => {
  return (
    <div className="px-4 py-6">
      <h2 className="text-xl font-bold mb-6">探す</h2>
      <div className="grid grid-cols-5 gap-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="flex flex-col items-center"
          >
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-2 shadow-sm">
              <category.icon className="w-6 h-6 text-gray-600" />
            </div>
            <span className="text-sm text-center">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategorySection;