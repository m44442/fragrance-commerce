// scripts/add-test-data.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestData() {
  try {
    console.log('テストデータを追加中...');

    // テストユーザーを作成
    const testUsers = [];
    for (let i = 1; i <= 10; i++) {
      const user = await prisma.user.create({
        data: {
          email: `test${i}@example.com`,
          name: `テストユーザー${i}`,
          emailVerified: new Date(),
          role: 'USER',
          isAdmin: false
        }
      });
      testUsers.push(user);
    }

    console.log(`✅ ${testUsers.length}件のテストユーザーを作成しました`);

    // テストブランドを作成
    const brands = [];
    const brandNames = ['シャネル', 'ディオール', 'トム フォード', 'エルメス', 'ジョー マローン'];
    
    for (const brandName of brandNames) {
      const brand = await prisma.brand.create({
        data: {
          name: brandName,
          nameJp: brandName,
          description: `${brandName}の香水ブランド`,
          isFeatured: true
        }
      });
      brands.push(brand);
    }

    console.log(`✅ ${brands.length}件のテストブランドを作成しました`);

    // テスト商品を作成
    const products = [];
    const productNames = [
      'No.5 オードゥ パルファム',
      'サヴァージュ オードゥ トワレ',
      'ブラック オーキッド',
      'テール デルメス',
      'イングリッシュ ペアー & フリージア'
    ];

    for (let i = 0; i < productNames.length; i++) {
      const product = await prisma.product.create({
        data: {
          name: productNames[i],
          brandId: brands[i].id,
          description: `${productNames[i]}の商品説明`,
          price: Math.floor(Math.random() * 10000) + 5000, // 5000-15000円
          stock: Math.floor(Math.random() * 100) + 10,
          volume: 50,
          concentration: Math.random() > 0.5 ? 'EDP' : 'EDT',
          isPublished: true,
          isFeatured: true,
          averageRating: Math.random() * 2 + 3, // 3-5の評価
          reviewCount: Math.floor(Math.random() * 50) + 10
        }
      });
      products.push(product);
    }

    console.log(`✅ ${products.length}件のテスト商品を作成しました`);

    // テスト注文を作成
    const orders = [];
    for (let i = 0; i < 20; i++) {
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      
      const order = await prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${i}`,
          userId: user.id,
          total: product.price,
          subtotal: product.price,
          tax: Math.floor(product.price * 0.1),
          shippingFee: 500,
          shippingStatus: Math.random() > 0.7 ? 'SHIPPED' : Math.random() > 0.4 ? 'PREPARING' : 'PENDING',
          paymentStatus: 'COMPLETED'
        }
      });

      // 注文アイテムを作成
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: product.price
        }
      });

      // 配送先住所を作成
      await prisma.shippingAddress.create({
        data: {
          orderId: order.id,
          name: user.name || 'テストユーザー',
          postalCode: '100-0001',
          prefecture: '東京都',
          city: '千代田区',
          address1: 'テスト住所1-1-1',
          phone: '090-0000-0000'
        }
      });

      orders.push(order);
    }

    console.log(`✅ ${orders.length}件のテスト注文を作成しました`);

    // レビューを作成
    for (let i = 0; i < 30; i++) {
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      const product = products[Math.floor(Math.random() * products.length)];

      try {
        await prisma.review.create({
          data: {
            userId: user.id,
            productId: product.id,
            rating: Math.floor(Math.random() * 3) + 3, // 3-5の評価
            comment: `素晴らしい香水です。とても気に入っています。`,
            isVerified: Math.random() > 0.5,
            helpfulCount: Math.floor(Math.random() * 10)
          }
        });
      } catch (error) {
        // 重複レビューの場合はスキップ
        continue;
      }
    }

    console.log(`✅ レビューを作成しました`);

    console.log('\n📊 テストデータ作成完了:');
    console.log(`- ユーザー: ${testUsers.length}件`);
    console.log(`- ブランド: ${brands.length}件`);
    console.log(`- 商品: ${products.length}件`);
    console.log(`- 注文: ${orders.length}件`);
    console.log('- レビュー: 複数件');

  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestData();