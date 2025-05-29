// src/app/api/products/[productId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/microcms/client";
import { syncProductToDatabase } from "@/lib/sync-utils";
import prisma from "@/lib/prisma";

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

    // まずMicroCMSから商品を取得
    let microCmsProduct;
    try {
      microCmsProduct = await client.getListDetail({
        endpoint: 'rumini',
        contentId: productId,
      });
    } catch (microCmsError) {
      console.error("MicroCMS fetch error:", microCmsError);
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // データベースに同期
    let syncedProduct;
    try {
      syncedProduct = await syncProductToDatabase(microCmsProduct);
    } catch (syncError) {
      console.error("Sync error:", syncError);
      // 同期に失敗してもMicroCMSデータを返す
    }

    // データベースからレビュー情報を取得
    let reviewData = null;
    if (syncedProduct?.id) {
      try {
        const reviews = await prisma.review.findMany({
          where: { productId: syncedProduct.id },
          select: { rating: true }
        });

        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          reviewData = {
            averageRating: Math.round((totalRating / reviews.length) * 10) / 10,
            reviewCount: reviews.length
          };
        }
      } catch (reviewError) {
        console.error("Review fetch error:", reviewError);
      }
    }

    // レスポンスデータを構築
    const productData = {
      id: microCmsProduct.id,
      title: microCmsProduct.title,
      description: microCmsProduct.description || '',
      price: microCmsProduct.price || 0,
      discountPrice: microCmsProduct.discountPrice || null,
      thumbnail: microCmsProduct.thumbnail,
      images: microCmsProduct.images || [],
      brand: microCmsProduct.brand,
      category: microCmsProduct.category,
      topNotes: microCmsProduct.topNotes || '',
      middleNotes: microCmsProduct.middleNotes || '',
      baseNotes: microCmsProduct.baseNotes || '',
      volume: microCmsProduct.volume || null,
      concentration: microCmsProduct.concentration || '',
      isNew: microCmsProduct.isNew || false,
      publishedAt: microCmsProduct.publishedAt,
      updatedAt: microCmsProduct.updatedAt,
      ...reviewData // レビューデータをマージ
    };

    return NextResponse.json(productData);
  } catch (error) {
    console.error("Product API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}