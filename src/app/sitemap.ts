import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://rumini.jp';

  // 静的ページ
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/brands`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/new-arrivals`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rankings`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/subscription`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  // 動的ページ（商品）- MicroCMS環境変数が利用可能な場合のみ
  let productPages: MetadataRoute.Sitemap = [];
  if (process.env.MICROCMS_SERVICE_DOMAIN && process.env.MICROCMS_API_KEY) {
    try {
      const { getAllProducts } = await import('@/lib/microcms/client');
      const { contents: products } = await getAllProducts();
      productPages = products.map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(product.updatedAt || product.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    } catch (error) {
      console.error('Error fetching products for sitemap:', error);
    }
  }

  // カテゴリページ（仮の実装）
  const categoryPages = [
    'fruity',
    'floral', 
    'woody',
    'oriental',
    'fresh',
    'spicy'
  ].map(categoryId => ({
    url: `${baseUrl}/categories/${categoryId}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // テーマページ（仮の実装）
  const themePages = [
    'business',
    'casual',
    'date',
    'party',
    'wedding',
    'everyday'
  ].map(themeId => ({
    url: `${baseUrl}/themes/${themeId}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...productPages,
    ...categoryPages,
    ...themePages,
  ];
}