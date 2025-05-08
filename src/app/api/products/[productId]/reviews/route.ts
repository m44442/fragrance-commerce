import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// レビュー一覧を取得
export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // 商品の存在確認
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // レビュー一覧を取得
    const reviews = await prisma.review.findMany({
      where: {
        productId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // 最新順
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// レビューを投稿・更新
export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { productId } = params;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // リクエストデータを取得
    const { rating, comment } = await request.json();
    
    // バリデーション
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '評価は1から5の間で入力してください' }, { status: 400 });
    }
    
    // 商品の存在確認
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 購入履歴から検証フラグを決定
    const purchaseHistory = await prisma.purchaseHistory.findFirst({
      where: {
        userId,
        productId,
      }
    });
    
    const isVerified = !!purchaseHistory;
    
    // 既存レビューの確認
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        }
      }
    });

    let review;
    
    if (existingReview) {
      // 既存レビューの更新
      review = await prisma.review.update({
        where: {
          id: existingReview.id,
        },
        data: {
          rating,
          comment,
          updatedAt: new Date(),
        },
      });
    } else {
      // 新規レビューの作成
      review = await prisma.review.create({
        data: {
          rating,
          comment,
          userId,
          productId,
          isVerified,
        },
      });

      // 商品の評価情報を更新
      await updateProductRating(productId);
    }

    return NextResponse.json({ review, message: '口コミを投稿しました。ありがとうございます！' });
  } catch (error) {
    console.error('Error creating/updating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// レビュー削除
export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { productId } = params;
    
    // 既存レビューの確認
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        }
      }
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // レビュー削除
    await prisma.review.delete({
      where: {
        id: existingReview.id,
      }
    });
    
    // 商品の評価情報を更新
    await updateProductRating(productId);

    return NextResponse.json({ message: '口コミを削除しました。' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 「参考になった」ボタン機能
export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const { reviewId, helpful } = await request.json();
    
    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }
    
    // レビューの存在確認
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    // helpfulCountの更新
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: helpful 
          ? { increment: 1 }  // 「参考になった」を増やす
          : { decrement: 1 }  // 「参考になった」を減らす (オプション)
      }
    });
    
    return NextResponse.json({ 
      helpfulCount: updatedReview.helpfulCount,
      message: helpful ? '参考になった！と評価しました' : '評価を取り消しました'
    });
  } catch (error) {
    console.error('Error updating helpful count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 商品の評価情報を更新する関数
async function updateProductRating(productId: string) {
  // 商品の全レビューを取得
  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });
  
  // レビューが0件の場合
  if (reviews.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: null,
        reviewCount: 0,
      },
    });
    return;
  }
  
  // 平均評価を計算
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  // 商品情報を更新
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: Math.round(averageRating * 10) / 10, // 小数点第1位まで
      reviewCount: reviews.length,
    },
  });
}