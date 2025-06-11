import { Metadata } from 'next';
import { getDetailProduct } from '@/lib/microcms/client';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://rumini.jp';
  
  try {
    const product = await getDetailProduct(params.id);
    
    if (!product) {
      return {
        title: '商品が見つかりません | Rumini',
        description: 'お探しの商品は見つかりませんでした。',
      };
    }

    const title = `${product.name} | 香水・フレグランス | Rumini`;
    const description = product.description 
      ? `${product.description.substring(0, 140)}...` 
      : `${product.name}の詳細ページ。香水・フレグランス専門ECサイトRuminiで取り扱い中。`;
    
    const productUrl = `${baseUrl}/products/${params.id}`;
    const imageUrl = product.images?.[0]?.url || `${baseUrl}/default-product.jpg`;

    return {
      title,
      description,
      keywords: `${product.name}, 香水, フレグランス, ${product.brand || ''}, Rumini`,
      openGraph: {
        title,
        description,
        url: productUrl,
        siteName: 'Rumini',
        images: [
          {
            url: imageUrl,
            width: 800,
            height: 600,
            alt: product.name,
          },
        ],
        locale: 'ja_JP',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: productUrl,
      },
    };
  } catch (error) {
    console.error('Error generating product metadata:', error);
    
    return {
      title: '商品詳細 | Rumini',
      description: '香水・フレグランス専門ECサイトRuminiの商品詳細ページ。',
    };
  }
}