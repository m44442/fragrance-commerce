export interface User {
    id: string;
    name: string | null;
    image: string | null;
  }
  
  export interface Review {
    id: string;
    rating: number;
    comment: string | null;
    userId: string;
    productId: string;
    createdAt: string;
    updatedAt: string;
    isVerified: boolean;
    helpfulCount: number;
    user: User;
  }
  
  export interface ReviewFormData {
    rating: number;
    comment?: string;
  }
  
  export interface ProductReviewsResponse {
    reviews: Review[];
  }
  
  export interface ReviewHelpfulResponse {
    helpfulCount: number;
    message: string;
  }