"use client";

import SearchCategories from "./components/SearchCategories";
import PopularThemes from "./components/PopularThemes";
import FeaturedBrands from "./components/FeaturedBrands";
import TrendingRankings from "./components/TrendingRankings";

// 疑似データ
const fragrance = [
  {
    id: 1,
    title: "Fragrance 1",
    thumbnail: "/thumbnails/discord-clone-udemy.png",
    price: 2980,
    author: {
      id: 1,
      name: "Author 1",
      description: "Author 1 description",
      profile_icon: "https://source.unsplash.com/random/2",
    },
    content: "Content 1",
    created_at: new Date().toString(),
    updated_at: new Date().toString(),
  },
  {
    id: 2,
    title: "Fragrance 2",
    thumbnail: "/thumbnails/notion-udemy.png",
    price: 1980,
    author: {
      id: 2,
      name: "Author 2",
      description: "Author 2 description",
      profile_icon: "https://source.unsplash.com/random/3",
    },
    content: "Content 2",
    created_at: new Date().toString(),
    updated_at: new Date().toString(),
  },
  {
    id: 3,
    title: "Fragrance 3",
    price: 4980,
    thumbnail: "/thumbnails/openai-chatapplication-udem.png",
    author: {
      id: 3,
      name: "Author 3",
      description: "Author 3 description",
      profile_icon: "https://source.unsplash.com/random/4",
    },
    content: "Content 3",
    created_at: new Date().toString(),
    updated_at: new Date().toString(),
  },
  // 他の本のデータ...
];

export default function Home() {
  return (
    <>
      <main className="flex flex-wrap justify-center items-center md:mt-32 mt-20">
        <SearchCategories />
        <PopularThemes />
        <FeaturedBrands />
        <TrendingRankings />
      </main>
    </>
  );
}
