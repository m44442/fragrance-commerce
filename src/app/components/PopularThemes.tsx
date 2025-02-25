"use client";
import React from "react";
import Link from "next/link";

const themes = [
  { id: 1, title: "テーマ1", imageUrl: "/images/theme1.jpg" },
  { id: 2, title: "テーマ2", imageUrl: "/images/theme2.jpg" },
  // 他のテーマデータ...
];

const ThemeCard = ({ theme }:any) => (
  <div className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <img src={theme.imageUrl} alt={theme.title} className="w-full h-32 object-cover rounded-t-lg" />
    <h3 className="mt-2 text-lg font-semibold">{theme.title}</h3>
  </div>
);

const PopularThemes = () => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">人気のテーマ</h2>
        <Link href="/themes" className="text-blue-500 hover:underline">もっと見る</Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {themes.map((theme) => (
          <ThemeCard key={theme.id} theme={theme} />
        ))}
      </div>
    </div>
  );
};

export default PopularThemes;