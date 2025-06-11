import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options"; // インポート名を修正
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> } // 型定義を修正
) {
  try {
    const { userId } = await context.params; // awaitを追加
    console.log("お気に入り一覧API - ユーザーID:", userId);

    const session = await getServerSession(nextAuthOptions); // インポート名を修正
    console.log("お気に入り一覧API セッション情報:", {
      hasSession: !!session,
      sessionUserId: session?.user?.id,
      requestUserId: userId,
    });

    if (!session || session.user.id !== userId) {
      console.log("お気に入り一覧API 認証エラー");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ユーザーのお気に入り商品を取得
    const favorites = await prisma.favorite.findMany({
      where: { userId: userId }, // params.userIdからuserIdに変更
      include: {
        product: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("お気に入り商品数:", favorites.length);

    const favoriteProducts = favorites.map((favorite) => ({
      id: favorite.product.id,
      title: favorite.product.name,
      brand: favorite.product.brand?.name || "",
      price: favorite.product.price,
      thumbnail: {
        url: favorite.product.thumbnailUrl,
      },
      category: [], // MicroCMSからのカテゴリ情報は取得できないため空配列
    }));

    console.log("お気に入り一覧API レスポンス:", favoriteProducts);
    return NextResponse.json({ favorites: favoriteProducts });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
