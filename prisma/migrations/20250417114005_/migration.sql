/*
  Warnings:

  - You are about to drop the `brands` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `category_on_product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `favorites` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_scents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `theme_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `themes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "category_on_product" DROP CONSTRAINT "category_on_product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "category_on_product" DROP CONSTRAINT "category_on_product_productId_fkey";

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_productId_fkey";

-- DropForeignKey
ALTER TABLE "favorites" DROP CONSTRAINT "favorites_userId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- DropForeignKey
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_scents" DROP CONSTRAINT "product_scents_productId_fkey";

-- DropForeignKey
ALTER TABLE "product_scents" DROP CONSTRAINT "product_scents_scentId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_brandId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_productId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_userId_fkey";

-- DropForeignKey
ALTER TABLE "theme_products" DROP CONSTRAINT "theme_products_productId_fkey";

-- DropForeignKey
ALTER TABLE "theme_products" DROP CONSTRAINT "theme_products_themeId_fkey";

-- DropTable
DROP TABLE "brands";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "category_on_product";

-- DropTable
DROP TABLE "favorites";

-- DropTable
DROP TABLE "order_items";

-- DropTable
DROP TABLE "orders";

-- DropTable
DROP TABLE "product_images";

-- DropTable
DROP TABLE "product_scents";

-- DropTable
DROP TABLE "reviews";

-- DropTable
DROP TABLE "scents";

-- DropTable
DROP TABLE "theme_products";

-- DropTable
DROP TABLE "themes";

-- DropEnum
DROP TYPE "OrderStatus";
