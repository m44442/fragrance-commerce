"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  brand?: string;
  price: number;
  thumbnailUrl?: string;
  rating?: number;
  reviewCount?: number;
  category?: string[];
  isLiked?: boolean;
  onLike?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductCard({
  id,
  name,
  brand,
  price,
  thumbnailUrl,
  rating = 0,
  reviewCount = 0,
  category = [],
  isLiked = false,
  onLike,
  onAddToCart,
  className,
  size = 'md',
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

  const handleLike = async () => {
    if (!onLike || isLikeLoading) return;
    setIsLikeLoading(true);
    try {
      await onLike(id);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!onAddToCart || isCartLoading) return;
    setIsCartLoading(true);
    try {
      await onAddToCart(id);
    } finally {
      setIsCartLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-full max-w-xs',
    md: 'w-full max-w-sm',
    lg: 'w-full max-w-md',
  };

  const imageClasses = {
    sm: 'aspect-square',
    md: 'aspect-square',
    lg: 'aspect-[4/5]',
  };

  return (
    <div className={cn('bg-white rounded-lg shadow overflow-hidden group hover:shadow-lg transition-all duration-300', sizeClasses[size], className)}>
      <div className="relative">
        <Link href={`/products/${id}`}>
          <div className="relative h-64 bg-gray-100 overflow-hidden">
            {thumbnailUrl && !imageError ? (
              <Image
                src={thumbnailUrl}
                alt={name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                  <p className="text-xs">No Image</p>
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* Rating Badge */}
        {rating > 0 && (
          <div className="absolute top-4 left-4 bg-yellow-400 text-white px-3 py-1 rounded-full flex items-center">
            <Star className="w-4 h-4 mr-1 fill-current" />
            <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isLikeLoading}
          className={cn(
            "absolute top-4 right-4 w-10 h-10 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-white transition-all",
            isLiked && "text-red-500",
            isLikeLoading && "opacity-50"
          )}
          title={isLiked ? "お気に入りから削除" : "お気に入りに追加"}
        >
          <Heart 
            className={cn(
              "w-5 h-5 transition-all",
              isLiked && "fill-current"
            )} 
          />
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between mb-2">
          {brand && (
            <span className="text-sm text-gray-500">{brand}</span>
          )}
          {category.length > 0 && (
            <span className="text-sm text-custom-peach">{category[0]}</span>
          )}
        </div>
        
        <Link href={`/products/${id}`}>
          <h2 className="text-lg font-medium mb-2 group-hover:text-indigo-600 transition-colors">{name}</h2>
        </Link>
        
        {/* Rating and Reviews */}
        {(rating > 0 || reviewCount > 0) && (
          <div className="flex items-center space-x-1 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={`star-${id}-${i}`}
                  className={cn(
                    "w-4 h-4",
                    i < Math.floor(rating)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-200"
                  )}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-sm text-gray-600">({reviewCount})</span>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">¥{price?.toLocaleString() || '0'}</span>
          <Button
            size="sm"
            variant="primary"
            onClick={handleAddToCart}
            loading={isCartLoading}
            className="bg-custom-peach hover:bg-custom-peach-dark text-white px-4 py-2 rounded"
          >
            詳細を見る
          </Button>
        </div>
      </div>
    </div>
  );
}