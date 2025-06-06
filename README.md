# Rumini 香水販売サイト設計図

## 概要
`Rumini`は香水を販売するECサイトです。以下の技術スタックを使用して構築されています：
- **データベース**: Prisma
- **商品管理**: microCMS
- **認証**: NextAuth
- **決済**: Stripe
- **フロントエンド**: Next.js

---

## 技術スタック
| 機能           | 使用技術       |
|----------------|----------------|
| フロントエンド | Next.js        |
| バックエンド   | Next.js API    |
| データベース   | Prisma + PostgreSQL |
| 認証           | NextAuth       |
| 決済           | Stripe         |
| 商品管理       | microCMS       |

---


---

## 主なコンポーネント

### 1. **Header**
- **役割**: サイト全体のヘッダーを表示。
- **機能**:
  - ロゴ表示
  - ログイン状態に応じたメニュー表示
  - 検索アイコン、カートアイコンの表示

### 2. **BottomNavigation**
- **役割**: モバイル向けの固定ナビゲーションバー。
- **機能**:
  - ホーム、検索、気になる（お気に入り）、マイページへのリンク。

### 3. **CategorySection**
- **役割**: 商品をカテゴリ別に表示。
- **機能**:
  - ブランド、ランキング、新着、カテゴリのリンクを表示。

### 4. **NewArrivalsSection**
- **役割**: 新着商品を表示。
- **機能**:
  - APIまたはモックデータから新着商品を取得し表示。

### 5. **PopularRankingSection**
- **役割**: 人気ランキングを表示。
- **機能**:
  - microCMSから商品データを取得し、ランキング形式で表示。

### 6. **PopularThemeSection**
- **役割**: 人気のテーマを表示。
- **機能**:
  - テーマごとに商品を分類し、リンクを表示。

### 7. **SubscriptionBanner**
- **役割**: サブスクリプションサービスのプロモーション。
- **機能**:
  - サブスクリプションの価格や特典を表示。
  - 詳細ページへのリンクを提供。

### 8. **TrendingRankings**
- **役割**: トレンドランキングを表示。
- **機能**:
  - トレンドデータを表示し、商品ページへのリンクを提供。

---

## 商品ページ (`/products/[id]/page.tsx`)
- **役割**: 個別の商品詳細を表示。
- **機能**:
  - 商品情報をmicroCMSから取得。
  - 「いいね」ボタン（楽観的UI更新を実装）。
  - 「カートに追加」ボタン。
  - 「今すぐ購入」ボタン（Stripeで決済処理）。

---

## データ管理

### 1. **microCMS**
- **用途**: 商品情報の管理。
- **管理項目**:
  - 商品ID
  - 商品名
  - ブランド
  - 価格
  - サムネイル画像
  - 商品説明

### 2. **Prisma**
- **用途**: 顧客情報や購入履歴の管理。
- **主なテーブル**:
  - `User`: ユーザー情報（名前、メールアドレス、パスワードなど）。
  - `Order`: 注文情報（商品ID、ユーザーID、購入日時など）。
  - `Cart`: カート情報（商品ID、ユーザーID、数量など）。

---

## 認証
- **技術**: NextAuth
- **機能**:
  - Googleやメールアドレスを使用したログイン。
  - セッション管理。

---

## 決済
- **技術**: Stripe
- **機能**:
  - 商品購入時の決済処理。
  - サブスクリプションサービスの決済。

---

## ページ一覧

| ページ名         | パス                  | 機能                                                                 |
|------------------|-----------------------|----------------------------------------------------------------------|
| ホーム           | `/`                   | トップページ。新着商品や人気ランキングを表示。                         |
| 商品詳細         | `/products/[id]`      | 商品の詳細情報を表示。                                                |
| カート           | `/cart`               | カートに追加した商品の一覧を表示。                                    |
| プロフィール     | `/profile`            | ユーザー情報や購入履歴を表示。                                        |
| 検索             | `/search`             | 商品を検索。                                                          |
| テーマ一覧       | `/themes`             | 人気のテーマを表示。                                                  |
| サブスクリプション | `/subscription`       | サブスクリプションサービスの詳細を表示。                              |

---

## 今後の改善点
1. **レスポンシブデザイン**:
   - モバイルとデスクトップでの表示最適化。
2. **パフォーマンス最適化**:
   - 画像の遅延読み込みやキャッシュの活用。
3. **テストの導入**:
   - ユニットテストやE2Eテストの実装。

---

これを`README.md`に追加することで、プロジェクトの設計図を共有できます。---

## 主なコンポーネント

### 1. **Header**
- **役割**: サイト全体のヘッダーを表示。
- **機能**:
  - ロゴ表示
  - ログイン状態に応じたメニュー表示
  - 検索アイコン、カートアイコンの表示

### 2. **BottomNavigation**
- **役割**: モバイル向けの固定ナビゲーションバー。
- **機能**:
  - ホーム、検索、気になる（お気に入り）、マイページへのリンク。

### 3. **CategorySection**
- **役割**: 商品をカテゴリ別に表示。
- **機能**:
  - ブランド、ランキング、新着、カテゴリのリンクを表示。

### 4. **NewArrivalsSection**
- **役割**: 新着商品を表示。
- **機能**:
  - APIまたはモックデータから新着商品を取得し表示。

### 5. **PopularRankingSection**
- **役割**: 人気ランキングを表示。
- **機能**:
  - microCMSから商品データを取得し、ランキング形式で表示。

### 6. **PopularThemeSection**
- **役割**: 人気のテーマを表示。
- **機能**:
  - テーマごとに商品を分類し、リンクを表示。

### 7. **SubscriptionBanner**
- **役割**: サブスクリプションサービスのプロモーション。
- **機能**:
  - サブスクリプションの価格や特典を表示。
  - 詳細ページへのリンクを提供。

### 8. **TrendingRankings**
- **役割**: トレンドランキングを表示。
- **機能**:
  - トレンドデータを表示し、商品ページへのリンクを提供。

---

## 商品ページ (`/products/[id]/page.tsx`)
- **役割**: 個別の商品詳細を表示。
- **機能**:
  - 商品情報をmicroCMSから取得。
  - 「いいね」ボタン（楽観的UI更新を実装）。
  - 「カートに追加」ボタン。
  - 「今すぐ購入」ボタン（Stripeで決済処理）。
  -  4mlと1.5ml
  
## 香水診断　　　（今後ブラッシュアップ）
- **今後考える**

## 検索エンジン
- **曖昧検索を実装**

---

## データ管理

### 1. **microCMS**
- **用途**: 商品情報の管理。
- **管理項目**:
  - 商品ID
  - 商品名
  - ブランド
  - 価格
  - サムネイル画像
  - 商品説明

### 2. **Prisma**
- **用途**: 顧客情報や購入履歴の管理。
- **主なテーブル**:
  - `User`: ユーザー情報（名前、メールアドレス、パスワードなど）。
  - `Order`: 注文情報（商品ID、ユーザーID、購入日時など）。
  - `Cart`: カート情報（商品ID、ユーザーID、数量など）。

---

## 認証
- **技術**: NextAuth
- **機能**:
  - Googleやメールアドレスを使用したログイン。
  - セッション管理。

---

## 決済
- **技術**: Stripe
- **機能**:
  - 商品購入時の決済処理。
  - サブスクリプションサービスの決済。

---

## ページ一覧

| ページ名         | パス                  | 機能                                                                 |
|------------------|-----------------------|----------------------------------------------------------------------|
| ホーム           | `/`                   | トップページ。新着商品や人気ランキングを表示。                         |
| 商品詳細         | `/products/[id]`      | 商品の詳細情報を表示。                                                |
| カート           | `/cart`               | カートに追加した商品の一覧を表示。                                    |
| プロフィール     | `/profile`            | ユーザー情報や購入履歴を表示。                                        |
| 検索             | `/search`             | 商品を検索。                                                          |
| テーマ一覧       | `/themes`             | 人気のテーマを表示。                                                  |
| サブスクリプション | `/subscription`       | サブスクリプションサービスの詳細を表示。                              |

---



