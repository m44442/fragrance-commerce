# Claude AI アシスタント ルール

## プロジェクト概要
このプロジェクトはNext.jsで構築された香水ECアプリケーションです。

## 重要な注意事項・禁止事項

### Next.js App Router 動的ルート - 絶対遵守
- **重要**: Next.js 13+ App Routerでは動的ルートのparamsは非同期で取得する
- **正しい書き方**: `{ params }: { params: Promise<{ id: string }> }`
- **パラメータ取得**: `const { id } = await params;`
- **古い書き方は使用禁止**: `{ params }: { params: { id: string } }`

### データベースフィールド名 - 絶対遵守
- Order関連: `orderItems` (not `items`)、`total` (not `totalAmount`)、`shippingStatus`、`paymentStatus`
- Product関連: `isPublished` (not `isActive`)、`discountPrice` (not `samplePrice`)
- 実装前にPrismaスキーマを必ず確認すること

### NextAuth型定義 - 絶対遵守
- `session?.user?.isAdmin`は型エラーになる
- **正しい書き方**: `(session?.user as any)?.isAdmin`
- NextAuthのユーザー型にisAdminプロパティが含まれていないため

## 開発ガイドライン

### コードスタイル
- 既存のTypeScript/Reactの規約に従う
- 既存のコンポーネントパターンとスタイリング手法を使用する
- 一貫した命名規則を維持する


### テスト・品質管理
- タスク完了前に必ずリントと型チェックを実行する：
  - `npm run lint` - コードリント
  - `npm run typecheck` - TypeScript型チェック
- 変更が既存機能を破壊していないことを確認する
- 実装完了前に必ずテストを実行し機能要件を満たすことを確認する
- テストを通すためだけの実装はしない、あくまで要件を満たしたものを確実に実装するためのテストであること

### Gitワークフロー
- ユーザーから明示的に要求された場合のみコミットする
- 既存のコミットメッセージパターンに従う
- 説明的なコミットメッセージを使用する

### ファイル管理
- 新規ファイル作成よりも既存ファイルの編集を優先する
- 絶対に必要な場合のみ新規ファイルを作成する
- 既存のプロジェクト構造と組織に従う

## よく使うコマンド
- `npm run dev` - 開発サーバー起動
- `npm run build` - 本番用ビルド
- `npm run lint` - ESLint実行
- `npm run typecheck` - TypeScriptコンパイラーチェック実行

## 備考
- 香水ECアプリケーション
- 主要技術：Next.js、TypeScript、React
- 現在のブランチ：main