// src/app/api/products/[productId]/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from "@/lib/prisma";
import { resolveProductId } from "@/lib/product-helpers";

export const dynamic = 'force-dynamic';

// レビュー一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    console.log("GET /api/products/[productId]/reviews called with ID:", productId);

    // 商品IDを解決する（MicroCMS ID → Prisma ID）
    const resolvedId = await resolveProductId(productId);
    
    if (!resolvedId) {
      console.log("Product not found for ID:", productId);
      return NextResponse.json({ 
        error: "Product not found", 
        reviews: [] 
      }, { status: 404 });
    }

    console.log("Resolved product ID:", resolvedId);

    // レビュー一覧を取得
    const reviews = await prisma.review.findMany({
      where: {
        productId: resolvedId,
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
      orderBy: [
        { isVerified: 'desc' }, // 購入済みレビューを優先
        { helpfulCount: 'desc' }, // 参考になった数順
        { createdAt: "desc" }, // 最新順
      ],
    });

    console.log(`Found ${reviews.length} reviews for product ID: ${resolvedId}`);

    // 統計情報を計算
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(review => review.rating === rating).length
    }));

    return NextResponse.json({ 
      reviews,
      statistics: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return NextResponse.json(
      { error: "Internal server error", reviews: [] },
      { status: 500 }
    );
  }
}

// レビューを投稿・更新
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);

    // セッションのデバッグ出力
    console.log("Session data:", JSON.stringify({
      status: session ? 'authenticated' : 'unauthenticated',
      userId: session?.user?.id || null,
      email: session?.user?.email || null
    }));

    if (!session?.user?.id) {
      console.log("Authentication failed: No valid session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { productId } = await params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    console.log("POST /api/products/[productId]/reviews called with ID:", productId);

    // リクエストデータを取得
    const { rating, comment } = await request.json();
    
    console.log("Review data:", { rating, comment });

    // バリデーション
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "評価は1から5の間で入力してください" },
        { status: 400 }
      );
    }

    // 商品IDを解決する
    const resolvedId = await resolveProductId(productId);
    
    if (!resolvedId) {
      console.log("商品が見つかりません:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    console.log("Resolved product ID for review:", resolvedId);

    // 購入履歴の確認（購入済みフラグの設定）
    const purchaseHistory = await prisma.purchase.findFirst({
      where: {
        userId,
        fragranceId: resolvedId
      }
    });
    
    const isVerified = !!purchaseHistory;

    // 既存レビューの確認
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: resolvedId,
        },
      },
    });

    let review;

    if (existingReview) {
      console.log("Updating existing review:", existingReview.id);
      // 既存レビューの更新
      review = await prisma.review.update({
        where: {
          id: existingReview.id,
        },
        data: {
          rating,
          comment: comment || null,
          isVerified,
          updatedAt: new Date(),
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
      });
    } else {
      console.log("Creating new review for product:", resolvedId);
      // 新規レビューの作成
      review = await prisma.review.create({
        data: {
          rating,
          comment: comment || null,
          userId,
          productId: resolvedId,
          isVerified,
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
      });
    }

    // 商品の評価情報を更新
    await updateProductRating(resolvedId);

    return NextResponse.json({
      review,
      message: existingReview 
        ? "口コミを更新しました。ありがとうございます！"
        : "口コミを投稿しました。ありがとうございます！",
    });
  } catch (error) {
    console.error("Error creating/updating review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// レビュー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { productId } = await params;

    console.log("DELETE /api/products/[productId]/reviews called with ID:", productId);

    // 商品IDを解決する
    const resolvedId = await resolveProductId(productId);
    
    if (!resolvedId) {
      console.log("Product not found for ID:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 既存レビューの確認
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: resolvedId,
        },
      },
    });

    if (!existingReview) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    console.log("Deleting review:", existingReview.id);
    // レビュー削除
    await prisma.review.delete({
      where: {
        id: existingReview.id,
      },
    });

    // 商品の評価情報を更新
    await updateProductRating(resolvedId);

    return NextResponse.json({ message: "口コミを削除しました。" });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 「参考になった」ボタン機能
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = await params;
    const { reviewId, helpful } = await request.json();

    console.log("PATCH /api/products/[productId]/reviews called with:", { productId, reviewId, helpful });

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // レビューの存在確認
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // 自分のレビューには「参考になった」をつけられない
    if (review.userId === session.user.id) {
      return NextResponse.json({ 
        error: "自分のレビューには評価できません" 
      }, { status: 400 });
    }

    // 「参考になった」記録のチェック（重複防止）
    // 実際の実装では、ReviewHelpfulテーブルなどを作成して重複チェックを行う
    // ここでは簡略化してhelpfulCountを直接更新

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: helpful 
          ? { increment: 1 } 
          : Math.max(0, review.helpfulCount - 1), // 0未満にならないように
      },
    });

    console.log("Updated review helpful count:", updatedReview.helpfulCount);

    return NextResponse.json({
      helpfulCount: updatedReview.helpfulCount,
      message: helpful
        ? "参考になった！と評価しました"
        : "評価を取り消しました",
    });
  } catch (error) {
    console.error("Error updating helpful count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 商品の評価情報を更新する関数
async function updateProductRating(productId: string) {
  try {
    // 商品の全レビューを取得
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    console.log(`Updating product rating for ${productId} with ${reviews.length} reviews`);

    // レビューが0件の場合
    if (reviews.length === 0) {
      await prisma.product.update({
        where: { id: productId },
        data: {
          averageRating: null,
          reviewCount: 0,
        },
      });
      console.log(`Reset rating for product ${productId} (no reviews)`);
      return;
    }

    // 平均評価を計算
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // 商品情報を更新
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: Math.round(averageRating * 10) / 10, // 小数点第1位まで
        reviewCount: reviews.length,
      },
    });

    console.log(`Updated rating for product ${productId}: ${updatedProduct.averageRating} (${updatedProduct.reviewCount} reviews)`);
  } catch (error) {
    console.error(`Error updating product rating for ${productId}:`, error);
    // エラーが発生してもレビュー投稿自体は成功させる
  }
}