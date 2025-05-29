/**
 * 管理者権限確認API
 *
 * このAPIエンドポイントは、現在ログイン中のユーザーが管理者権限を持っているかどうかを
 * 確認するために使用されます。フロントエンド側で管理者専用機能の表示・非表示を
 * 制御する際などに利用されます。
 *
 * 処理フロー:
 * 1. NextAuthのセッション情報を取得
 * 2. ユーザーがログインしているか確認
 * 3. データベースからユーザーのロール情報を取得
 * 4. ロールが'ADMIN'かどうかを判定
 * 5. 判定結果をJSON形式で返却
 *
 * レスポンス:
 * - 成功時: { isAdmin: true|false } (ステータスコード 200)
 * - 未認証時: { isAdmin: false } (ステータスコード 401)
 * - エラー時: { isAdmin: false, error: 'エラーメッセージ' } (ステータスコード 500)
 *
 * このAPIは認証されていないユーザーに対しては401エラーを返しますが、
 * セキュリティ上の理由からエラーレスポンスに詳細情報は含めていません。
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from "@/lib/prisma";

/**
 * 管理者権限確認のGETリクエストハンドラー
 * クライアントからのリクエストに対し、ユーザーの管理者権限状態を返します
 *
 * @returns NextResponse - 管理者権限の状態を含むJSONレスポンス
 */
export async function GET() {
  try {
    // NextAuthからユーザーセッションを取得
    const session = await getServerSession(nextAuthOptions);

    // ログインしていない場合は管理者ではないと判断
    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false }, { status: 401 });
    }

    // データベースからユーザーのロール情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // ロールが'ADMIN'であれば管理者と判断
    const isAdmin = user?.role === "ADMIN";

    // 管理者状態をJSONで返却
    return NextResponse.json({ isAdmin });
  } catch (error) {
    // エラーをログに記録し、エラーレスポンスを返却
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      { isAdmin: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
