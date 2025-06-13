/**
 * NextAuth認証ハンドラー
 *
 * このファイルはNext.jsのAPI Routeとして機能し、NextAuthによる認証処理を担当します。
 * [...nextauth]という動的ルートパターンを使うことで、NextAuthが必要とする全ての認証関連エンドポイントを
 * このファイル一つでハンドリングしています。
 *
 * 主な機能:
 * - ログイン・ログアウト処理
 * - セッション管理
 * - LINE認証および従来のパスワード認証のサポート
 * - JWT（JSONウェブトークン）の処理
 * - コールバック処理
 *
 * 認証設定は@/lib/next-auth/optionsから読み込まれ、認証プロバイダーやコールバック関数などが
 * 定義されています。認証設定を変更する場合はそのファイルを編集してください。
 *
 * GETリクエスト: セッション情報の取得やプロバイダーへのリダイレクト
 * POSTリクエスト: ログイン処理やコールバック処理など
 */
import { authOptions } from "@/lib/next-auth/options";
import NextAuth from "next-auth";

export const dynamic = 'force-dynamic';

// NextAuthハンドラーの初期化
// このハンドラーはGETとPOSTの両方のHTTPメソッドをサポート
const handler = NextAuth(authOptions);

// API Routeとしてハンドラーをエクスポート
export { handler as GET, handler as POST };
