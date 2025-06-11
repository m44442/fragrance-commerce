"use client";

// src/components/ReviewList.tsx
import React, { useState } from 'react';
import { Star, ThumbsUp, Check } from 'lucide-react';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  image: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  userId: string;
  createdAt: string;
  isVerified: boolean;
  helpfulCount: number;
  user: User;
}

interface ReviewListProps {
  reviews: Review[];
  currentUserId?: string;
  userReviewId?: string;
  onMarkHelpful: (reviewId: string) => Promise<void>;
}

const ReviewList: React.FC<ReviewListProps> = ({ 
  reviews, 
  currentUserId,
  userReviewId,
  onMarkHelpful
}) => {
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());
  const [loadingHelpful, setLoadingHelpful] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (loadingHelpful || helpfulReviews.has(reviewId)) return;
    
    setLoadingHelpful(reviewId);
    try {
      await onMarkHelpful(reviewId);
      setHelpfulReviews(prev => {
        const updated = new Set(prev);
        updated.add(reviewId);
        return updated;
      });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    } finally {
      setLoadingHelpful(null);
    }
  };

  // レビューなしの場合のメッセージ
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">この商品にはまだ口コミがありません</p>
        {currentUserId && !userReviewId && (
          <p className="mt-2 text-[#E9A68D]">最初の口コミを投稿してみませんか？</p>
        )}
      </div>
    );
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    // 自分のレビューを最上部に
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;

    // 検証済みレビューを優先
    if (a.isVerified && !b.isVerified) return -1;
    if (!a.isVerified && b.isVerified) return 1;

    // 参考になった数で降順
    if (a.helpfulCount !== b.helpfulCount) {
      return b.helpfulCount - a.helpfulCount;
    }

    // 最後に日付で降順
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // レーティングの集計
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const ratingCounts = reviews.reduce((counts, review) => {
    counts[review.rating - 1]++;
    return counts;
  }, [0, 0, 0, 0, 0]);

  return (
    <div className="mt-6">
      {/* レーティングサマリー */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  fill={star <= Math.round(averageRating) ? '#FFB800' : 'none'}
                  stroke="#FFB800"
                  className="w-5 h-5"
                />
              ))}
            </div>
            <div className="text-sm text-gray-500">({reviews.length}件の口コミ)</div>
          </div>
          
          <div className="mt-4 md:mt-0 w-full md:w-1/2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center my-1">
                <div className="w-12 text-sm text-right mr-2">{rating}★</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-[#FFB800] h-2 rounded-full" 
                    style={{ width: `${(ratingCounts[rating-1] / reviews.length) * 100}%` }} 
                  ></div>
                </div>
                <div className="w-12 text-sm ml-2">{ratingCounts[rating-1]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* レビューリスト */}
      <div className="space-y-6">
        {sortedReviews.map((review) => (
          <div 
            key={review.id} 
            className={`p-4 border rounded-lg ${review.userId === currentUserId ? 'bg-[#FDF8F6] border-[#E9A68D]' : 'bg-white'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {review.user.image ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <Image 
                      src={review.user.image} 
                      alt={review.user.name || 'ユーザー'} 
                      width={40} 
                      height={40}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">
                      {(review.user.name || 'ユーザー').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div>
                  <div className="font-medium">
                    {review.user.name || 'ユーザー'}
                    {review.userId === currentUserId && (
                      <span className="text-xs ml-2 font-normal text-gray-500">あなたの口コミ</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
                </div>
              </div>
              
              {review.isVerified && (
                <div className="flex items-center text-green-600 text-sm">
                  <Check className="w-4 h-4 mr-1" />
                  <span>購入済み</span>
                </div>
              )}
            </div>
            
            <div className="flex mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  fill={star <= review.rating ? '#FFB800' : 'none'}
                  stroke="#FFB800"
                  className="w-5 h-5"
                />
              ))}
            </div>
            
            {review.comment && (
              <div className="mt-3 text-gray-700">{review.comment}</div>
            )}
            
            <div className="mt-4 flex justify-between items-center">
              <button 
                className={`flex items-center text-sm ${
                  helpfulReviews.has(review.id) 
                    ? 'text-[#E9A68D]' 
                    : 'text-gray-500 hover:text-[#E9A68D]'
                } transition-colors disabled:opacity-50`}
                onClick={() => handleMarkHelpful(review.id)}
                disabled={loadingHelpful === review.id || helpfulReviews.has(review.id) || review.userId === currentUserId}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                <span>
                  {loadingHelpful === review.id 
                    ? '...' 
                    : helpfulReviews.has(review.id) 
                      ? '参考になった！' 
                      : '参考になった'}
                </span>
                {review.helpfulCount > 0 && (
                  <span className="ml-1">
                    ({review.helpfulCount + (helpfulReviews.has(review.id) ? 1 : 0)})
                  </span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;