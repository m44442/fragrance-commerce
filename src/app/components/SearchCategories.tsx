"use client";

import Link from "next/link";
import React from "react";
import { Flower2, TreePine, Citrus, Cookie } from "lucide-react";

const categories = [
  { id: 1, name: "ブランド", Icon: Flower2 },
  { id: 2, name: "ランキング", Icon: TreePine },
  { id: 3, name: "人気のテーマ", Icon: Citrus },
  { id: 4, name: "香水診断", Icon: Cookie },
  { id: 5, name: "カテゴリ", Icon: Cookie },
];

const SearchCategories = () => {
  return (
    <div className="w-full max-w-[790px] mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">探す</h1>
      <div className="flex justify-between items-start gap-4">
        {categories.map(({ id, name, Icon }) => (
          <Link
            key={id}
            href={`/categories/${id}`}
            className="flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <span className="text-center">{name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SearchCategories;
