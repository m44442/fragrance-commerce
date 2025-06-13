import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "@/lib/next-auth/options"; // インポート名を修正
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> } // Promiseに変更
) {
  try {
    const { userId } = await context.params; // awaitを追加
    const session = await getServerSession(nextAuthOptions); // インポート名を修正

    if (!session?.user?.email) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    // 管理者権限をチェック
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }, // params.userIdからuserIdに変更
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        cart: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Admin user fetch error:", error);
    return NextResponse.json(
      { message: "ユーザー情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> } // Promiseに変更
) {
  try {
    const { userId } = await context.params; // awaitを追加
    const session = await getServerSession(nextAuthOptions); // インポート名を修正

    if (!session?.user?.email) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    // 管理者権限をチェック
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    const { action, ...updateData } = await request.json();

    let updatedUser;

    if (action === "activate") {
      updatedUser = await prisma.user.update({
        where: { id: userId }, // params.userIdからuserIdに変更
        data: {
          emailVerified: new Date(),
          // その他のアクティベーション処理
        },
      });
    } else if (action === "deactivate") {
      updatedUser = await prisma.user.update({
        where: { id: userId }, // params.userIdからuserIdに変更
        data: {
          emailVerified: null,
          // その他の非アクティブ化処理
        },
      });
    } else {
      // 一般的な更新
      updatedUser = await prisma.user.update({
        where: { id: userId }, // params.userIdからuserIdに変更
        data: updateData,
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { message: "ユーザー情報の更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> } // Promiseに変更
) {
  try {
    const { userId } = await context.params; // awaitを追加
    const session = await getServerSession(nextAuthOptions); // インポート名を修正

    if (!session?.user?.email) {
      return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
    }

    // 管理者権限をチェック
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { message: "管理者権限が必要です" },
        { status: 403 }
      );
    }

    // 自分自身を削除しようとしている場合はエラー
    if (adminUser.id === userId) {
      // params.userIdからuserIdに変更
      return NextResponse.json(
        { message: "自分自身を削除することはできません" },
        { status: 400 }
      );
    }

    // 関連データを先に削除
    await prisma.$transaction(async (tx) => {
      // カートアイテムを削除（カート経由で）
      await tx.cartItem.deleteMany({
        where: { 
          cart: {
            userId: userId
          }
        }, 
      });

      // 注文を削除（データの整合性のため）
      await tx.order.deleteMany({
        where: { userId: userId },
      });

      // ユーザーを削除
      await tx.user.delete({
        where: { id: userId }, // params.userIdからuserIdに変更
      });
    });

    return NextResponse.json({ message: "ユーザーを削除しました" });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json(
      { message: "ユーザーの削除に失敗しました" },
      { status: 500 }
    );
  }
}
