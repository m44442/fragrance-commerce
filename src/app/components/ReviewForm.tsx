// src/components/ReviewForm.tsx
import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
  existingReview?: {
    id: string;
    rating: number;
    comment: string;
  };
}

const ReviewForm: React.FC<ReviewFormProps> = ({ 
  productId, 
  onReviewSubmitted, 
  existingReview 
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 0);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || '口コミの投稿に失敗しました');
      }

      setSuccess(data.message || '口コミを投稿しました。ありがとうございます！');
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
      
      // 親コンポーネントに通知
      onReviewSubmitted();
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

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '口コミの削除に失敗しました');
      }

      setSuccess('口コミを削除しました');
      setRating(0);
      setComment('');
      
      // 親コンポーネントに通知
      onReviewSubmitted();
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md my-4">
      <h3 className="text-xl font-bold mb-4">
        {existingReview ? 'あなたの口コミを編集' : '口コミを投稿'}
      </h3>
      
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
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            評価
          </label>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                onClick={() => handleRatingChange(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                fill={(hoverRating || rating) >= value ? '#FFB800' : 'none'}
                stroke="#FFB800"
                className="w-8 h-8 cursor-pointer transition-transform hover:scale-110"
              />
            ))}
            <span className="ml-2 text-gray-600">
              {rating > 0 ? `${rating}` : '評価を選択してください'}
            </span>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
            コメント
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E9A68D]"
            rows={4}
            placeholder="この商品の感想を教えてください（任意）"
          ></textarea>
        </div>
        
        <div className="flex justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#E9A68D] hover:bg-[#E9A68D]/90 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : existingReview ? '更新する' : '投稿する'}
          </button>
          
          {existingReview && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              削除する
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;