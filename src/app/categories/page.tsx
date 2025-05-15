// src/app/categories/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Tag, Droplet, ChevronRight } from "lucide-react";
import { client } from "@/lib/microcms/client";

// カテゴリの型定義
interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

const CategoriesPage = () => {
  const [scentCategories, setScentCategories] = useState<Category[]>([]);
  const [sceneCategories, setSceneCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState("scent"); // 'scent' or 'scene'
  const [isLoading, setIsLoading] = useState(true);

  // カテゴリデータ取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // 香りの系統カテゴリを取得
        const scentResult = await client.getList({
          endpoint: 'categories',
          queries: {
            filters: 'type[equals]scent',
            limit: 100
          }
        });

        // シーン別カテゴリを取得
        const sceneResult = await client.getList({
          endpoint: 'categories',
          queries: {
            filters: 'type[equals]scene',
            limit: 100
          }
        });

        // 各カテゴリの商品数を取得
        const scentCategoriesWithCount = await Promise.all(
          (scentResult.contents || []).map(async (category) => {
            try {
              // 各カテゴリに関連する商品数を取得
              const productResult = await client.getList({
                endpoint: 'rumini',
                queries: {
                  filters: `category[contains]${category.id}`,
                  limit: 1,
                  fields: 'id'
                }
              });
              
              return {
                id: category.id,
                name: category.name,
                description: category.description || '',
                imageUrl: category.imageUrl || category.thumbnail?.url,
                productCount: productResult.totalCount || 0
              };
            } catch (countError) {
              console.error(`Failed to fetch product count for category ${category.id}:`, countError);
              return {
                id: category.id,
                name: category.name,
                description: category.description || '',
                imageUrl: category.imageUrl || category.thumbnail?.url,
                productCount: 0
              };
            }
          })
        );

        const sceneCategoriesWithCount = await Promise.all(
          (sceneResult.contents || []).map(async (category) => {
            try {
              // 各カテゴリに関連する商品数を取得
              const productResult = await client.getList({
                endpoint: 'rumini',
                queries: {
                  filters: `scenes[contains]${category.id}`,
                  limit: 1,
                  fields: 'id'
                }
              });
              
              return {
                id: category.id,
                name: category.name,
                description: category.description || '',
                imageUrl: category.imageUrl || category.thumbnail?.url,
                productCount: productResult.totalCount || 0
              };
            } catch (countError) {
              console.error(`Failed to fetch product count for category ${category.id}:`, countError);
              return {
                id: category.id,
                name: category.name,
                description: category.description || '',
                imageUrl: category.imageUrl || category.thumbnail?.url,
                productCount: 0
              };
            }
          })
        );

        setScentCategories(scentCategoriesWithCount);
        setSceneCategories(sceneCategoriesWithCount);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ヘッダー部分 */}
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">カテゴリ</h1>
      </div>

      {/* タブ切り替え */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "scent"
              ? "text-custom-peach border-b-2 border-custom-peach"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("scent")}
        >
          <div className="flex items-center justify-center">
            <Droplet className="w-5 h-5 mr-1" />
            香りの系統
          </div>
        </button>
        <button
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === "scene"
              ? "text-custom-peach border-b-2 border-custom-peach"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("scene")}
        >
          <div className="flex items-center justify-center">
            <Tag className="w-5 h-5 mr-1" />
            シーン別
          </div>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-10 w-10 border-4 border-custom-peach rounded-full border-t-transparent"></div>
        </div>
      ) : (
        // カテゴリ一覧
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === "scent" ? scentCategories : sceneCategories).map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="h-40 bg-gray-200 relative">
                {category.imageUrl ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-1">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {category.productCount}個の商品
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;