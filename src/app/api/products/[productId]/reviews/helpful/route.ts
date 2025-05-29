// src/app/api/products/[productId]/reviews/helpful/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from "@/lib/prisma";

// 「参考になった」投票の処理
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(nextAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await request.json();
    const userId = session.user.id;

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    // レビューの存在確認
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { 
        id: true, 
        userId: true, 
        helpfulCount: true 
      }
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // 自分のレビューには投票できない
    if (review.userId === userId) {
      return NextResponse.json({ 
        error: "自分のレビューには評価できません" 
      }, { status: 400 });
    }

    // 既に投票済みかチェック
    const existingVote = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId
        }
      }
    });

    if (existingVote) {
      return NextResponse.json({ 
        error: "既に評価済みです" 
      }, { status: 400 });
    }

    // トランザクションで投票記録の作成とカウント更新を実行
    const result = await prisma.$transaction(async (tx) => {
      // 投票記録を作成
      await tx.reviewHelpful.create({
        data: {
          reviewId,
          userId
        }
      });

      // レビューのhelpfulCountを更新
      const updatedReview = await tx.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: { increment: 1 }
        },
        select: { helpfulCount: true }
      });

      return updatedReview;
    });

    return NextResponse.json({
      helpfulCount: result.helpfulCount,
      message: "参考になった！と評価しました",
      voted: true
    });

  } catch (error) {
    console.error("Error processing helpful vote:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ユーザーの投票状態を取得
export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(nextAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ voted: {} });
    }

    const url = new URL(request.url);
    const reviewIds = url.searchParams.get('reviewIds')?.split(',') || [];

    if (reviewIds.length === 0) {
      return NextResponse.json({ voted: {} });
    }

    // ユーザーの投票状態を取得
    const votes = await prisma.reviewHelpful.findMany({
      where: {
        userId: session.user.id,
        reviewId: { in: reviewIds }
      },
      select: { reviewId: true }
    });

    const votedMap = votes.reduce((acc, vote) => {
      acc[vote.reviewId] = true;
      return acc;
    }, {} as Record<string, boolean>);

    return NextResponse.json({ voted: votedMap });

  } catch (error) {
    console.error("Error fetching vote status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}