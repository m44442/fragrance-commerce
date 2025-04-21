import React from "react";
import SubscriptionBanner from "@/components/SubscriptionBanner";
import CategorySection from "@/components/CategorySection";
import PopularRankingSection from "@/components/PopularRankingSection";
import BrandSection from "@/components/BrandSection";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import PopularThemeSection from "@/components/PopularThemeSection";
import TrendingRankings from "./components/TrendingRankings";

export default function Home() {
  return (
    <>
      {/* サブスクリプションバナー */}
      <SubscriptionBanner />
      
      {/* カテゴリ検索 */}
      <CategorySection />

      {/* 人気テーマ */}
      {<TrendingRankings />}
      
      {/* 急上昇ランキング */}
      <PopularRankingSection />
      
      {/* ブランド特集 */}
      <BrandSection />
      
      {/* 新着商品 */}
      <NewArrivalsSection />
    </>
  );
}