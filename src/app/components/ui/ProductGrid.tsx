"use client";

import React from 'react';
import { ProductCard } from './ProductCard';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  brand?: string;
  price: number;
  thumbnailUrl?: string;
  rating?: number;
  reviewCount?: number;
  category?: string[];
}

interface ProductGridProps {
  products: Product[];
  onLike?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  likedProducts?: Set<string>;
  className?: string;
  loading?: boolean;
  emptyState?: React.ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export function ProductGrid({
  products,
  onLike,
  onAddToCart,
  likedProducts = new Set(),
  className,
  loading = false,
  emptyState,
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
}: ProductGridProps) {
  const gridClasses = cn(
    'grid gap-3 sm:gap-4 md:gap-6',
    {
      'grid-cols-1': columns.mobile === 1,
      'grid-cols-2': columns.mobile === 2,
      'grid-cols-3': columns.mobile === 3,
      'sm:grid-cols-2': columns.tablet === 2,
      'sm:grid-cols-3': columns.tablet === 3,
      'sm:grid-cols-4': columns.tablet === 4,
      'lg:grid-cols-3': columns.desktop === 3,
      'lg:grid-cols-4': columns.desktop === 4,
      'lg:grid-cols-5': columns.desktop === 5,
      'lg:grid-cols-6': columns.desktop === 6,
    },
    className
  );

  if (loading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 12 }).map((_, index) => (
          <ProductCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        {emptyState || (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              商品が見つかりません
            </h3>
            <p className="text-gray-500 max-w-sm">
              検索条件を変更するか、別のカテゴリをお試しください。
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          brand={product.brand}
          price={product.price}
          thumbnailUrl={product.thumbnailUrl}
          rating={product.rating}
          reviewCount={product.reviewCount}
          category={product.category}
          isLiked={likedProducts.has(product.id)}
          onLike={onLike}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden animate-pulse">
      <div className="h-64 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-8 w-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}