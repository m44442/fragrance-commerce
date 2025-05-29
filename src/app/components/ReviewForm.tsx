// src/app/components/ReviewForm.tsx
import React, { useState } from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  };
  isVerifiedPurchase?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ 
  productId, 
  onReviewSubmitted, 
  existingReview,
  isVerifiedPurchase = false
}) => {
  // セッション情報を取得
  const { data: session, status } = useSession();
  const [rating, setRating] = useState<number>(existingReview?.rating || 0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // ログイン状態のチェック
    if (status !== 'authenticated') {
      setError('レビューを投稿するにはログインが必要です');
      return;
    }

    setIsSubmitting(true);

    if (rating === 0) {
      setError('評価を選択してください');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log(`Submitting review to: /api/products/${productId}/reviews`);
      
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Error response:', data);
        throw new Error(data.error || '口コミの投稿に失敗しました');
      }

      const data = await response.json();
      console.log('Review submission successful:', data);
      
      setSuccess(data.message || '口コミを投稿しました。ありがとうございます！');
      
      // 新規投稿の場合はフォームをリセット
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
      
      // 親コンポーネントに通知
      onReviewSubmitted();
      
      // 成功メッセージを3秒後に非表示
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Submit error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('口コミの投稿中にエラーが発生しました');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview || !confirm('本当にこの口コミを削除しますか？')) {
      return;
    }
    
    // ログイン状態のチェック
    if (status !== 'authenticated') {
      setError('レビューを削除するにはログインが必要です');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '口コミの削除に失敗しました');
      }

      const data = await response.json();
      console.log('Review deletion successful:', data);
      
      setSuccess('口コミを削除しました');
      setRating(0);
      setComment('');
      
      // 親コンポーネントに通知
      onReviewSubmitted();
      
      // 2秒後にメッセージを非表示
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('口コミの削除中にエラーが発生しました');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ログインしていない場合のメッセージを表示
  if (status === 'unauthenticated') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md my-4 border">
        <h3 className="text-xl font-bold mb-4">口コミを投稿</h3>
        <div className="bg-blue-50 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
          口コミを投稿するには<a href="/login" className="font-bold underline">ログイン</a>が必要です。
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md my-4 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">
          {existingReview ? 'あなたの口コミを編集' : '口コミを投稿'}
        </h3>
        {isVerifiedPurchase && (
          <div className="flex items-center text-green-600 text-sm bg-green-50 px-2 py-1 rounded-md">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span>購入済み</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-3">
            評価 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingChange(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
              >
                <Star
                  size={32}
                  fill={(hoverRating || rating) >= value ? '#FFB800' : 'none'}
                  stroke="#FFB800"
                  className="transition-all duration-150 hover:scale-110"
                />
              </button>
            ))}
            <span className="ml-3 text-gray-600">
              {rating > 0 ? (
                <span className="flex items-center">
                  <span className="font-medium">{rating}</span>
                  <span className="text-sm ml-1">
                    {rating === 5 ? '(最高!)' : 
                     rating === 4 ? '(良い)' : 
                     rating === 3 ? '(普通)' : 
                     rating === 2 ? '(いまいち)' : 
                     '(悪い)'}
                  </span>
                </span>
              ) : (
                '評価を選択してください'
              )}
            </span>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
            コメント <span className="text-gray-400 text-xs">(任意)</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#E9A68D] focus:border-transparent resize-none"
            rows={4}
            maxLength={500}
            placeholder="この商品の感想を教えてください（500文字以内）"
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {comment.length}/500文字
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="bg-[#E9A68D] hover:bg-[#E9A68D]/90 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                送信中...
              </span>
            ) : (
              existingReview ? '更新する' : '投稿する'
            )}
          </button>
          
          {existingReview && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              削除する
            </button>
          )}
        </div>
      </form>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>※ 不適切な内容の口コミは予告なく削除される場合があります</p>
        <p>※ 購入済みの商品には「購入済み」バッジが表示されます</p>
      </div>
    </div>
  );
};

export default ReviewForm;