/*
  Warnings:

  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reviews` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_productId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_userId_fkey";

-- AlterTable
ALTER TABLE "subscription_deliveries" ADD COLUMN     "customSelected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "deliveryDate" INTEGER,
ADD COLUMN     "deliveryWeek" INTEGER,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethodId" TEXT,
ADD COLUMN     "preferCustomSelection" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeCustomerId" TEXT;

-- DropTable
DROP TABLE "order_items";

-- DropTable
DROP TABLE "orders";

-- DropTable
DROP TABLE "reviews";

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "purchase_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_history" ADD CONSTRAINT "purchase_history_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
