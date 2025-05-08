import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from "@/lib/prisma";
import { getMicroCmsProduct } from "@/lib/microcms/client";

// レビュー一覧を取得
export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    console.log(
      "GET /api/products/[productId]/reviews called with ID:",
      productId
    );

    // まず通常のIDで検索
    let product = await prisma.product.findUnique({
      where: { id: productId },
    });

    // 見つからない場合はmicroCmsIdで検索
    if (!product) {
      product = await prisma.product.findFirst({
        where: { microCmsId: productId },
      });
    }

    if (!product) {
      console.log("Product not found for ID:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 見つかった商品のIDを使用
    const resolvedProductId = product.id;
    console.log("Resolved product ID:", resolvedProductId);

    // レビュー一覧を取得
    const reviews = await prisma.review.findMany({
      where: {
        productId: resolvedProductId,
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
        createdAt: "desc", // 最新順
      },
    });

    console.log(
      `Found ${reviews.length} reviews for product ID: ${resolvedProductId}`
    );
    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { productId } = params;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    console.log(
      "POST /api/products/[productId]/reviews called with ID:",
      productId
    );

    // リクエストデータを取得
    const { rating, comment } = await request.json();

    // バリデーション
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "評価は1から5の間で入力してください" },
        { status: 400 }
      );
    }

    // まず通常のIDで検索
    let product = await prisma.product.findUnique({
      where: { id: productId },
    });

    // 見つからない場合はmicroCmsIdで検索
    if (!product) {
      product = await prisma.product.findFirst({
        where: { microCmsId: productId },
      });

      // それでも見つからない場合、フォールバックで製品を作成
      if (!product) {
        try {
            console.log(
              "商品がデータベースに存在しません。フォールバックレコードを作成します。"
            );
          
            // デフォルトブランドの取得または作成
            let defaultBrandId = null;
            const defaultBrand = await prisma.brand.findFirst({
              where: { name: "Unknown" },
            });
          
            if (defaultBrand) {
              defaultBrandId = defaultBrand.id;
            }
          
            // 商品をデータベースに登録
            product = await prisma.product.create({
              data: {
                name: `Product ${productId}`,
                brandId: defaultBrandId, // nullable の場合は null でOK
                price: 0,
                stock: 0,
                microCmsId: productId,
                microCmsUpdatedAt: new Date(),
              },
            });
          
            console.log("フォールバック商品レコードを作成しました:", product.id);
          } catch (err) {
            console.error("フォールバック商品の作成に失敗:", err);
            return NextResponse.json(
              { error: "Failed to create product record" },
              { status: 500 }
            );
          }
      }
    }

    if (!product) {
      console.log("商品が見つかりません:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 見つかった商品のIDを使用
    const resolvedProductId = product.id;
    console.log("Resolved product ID for review:", resolvedProductId);

    // 購入履歴検証フラグ
    let isVerified = false;

    // 既存レビューの確認
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: resolvedProductId,
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
          comment,
          updatedAt: new Date(),
        },
      });
    } else {
      console.log("Creating new review for product:", resolvedProductId);
      // 新規レビューの作成
      review = await prisma.review.create({
        data: {
          rating,
          comment,
          userId,
          productId: resolvedProductId,
          isVerified,
        },
      });

      // 商品の評価情報を更新
      await updateProductRating(resolvedProductId);
    }

    return NextResponse.json({
      review,
      message: "口コミを投稿しました。ありがとうございます！",
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
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(nextAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { productId } = params;

    console.log(
      "DELETE /api/products/[productId]/reviews called with ID:",
      productId
    );

    // まず通常のIDで検索
    let product = await prisma.product.findUnique({
      where: { id: productId },
    });

    // 見つからない場合はmicroCmsIdで検索
    if (!product) {
      product = await prisma.product.findFirst({
        where: { microCmsId: productId },
      });
    }

    if (!product) {
      console.log("Product not found for ID:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 見つかった商品のIDを使用
    const resolvedProductId = product.id;

    // 既存レビューの確認
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: resolvedProductId,
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
    await updateProductRating(resolvedProductId);

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
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const { reviewId, helpful } = await request.json();

    console.log(
      "PATCH /api/products/[productId]/reviews called with ID:",
      productId
    );
    console.log("Marking reviewId as helpful:", reviewId);

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

    // helpfulCountの更新
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: helpful
          ? { increment: 1 } // 「参考になった」を増やす
          : { decrement: 1 }, // 「参考になった」を減らす (オプション)
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
  // 商品の全レビューを取得
  const reviews = await prisma.review.findMany({
    where: { productId },
    select: { rating: true },
  });

  console.log(
    `Updating product rating for ${productId} with ${reviews.length} reviews`
  );

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

  console.log(
    `Updated rating for product ${productId}: ${updatedProduct.averageRating} (${updatedProduct.reviewCount} reviews)`
  );
}
