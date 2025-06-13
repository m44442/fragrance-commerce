import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "./lib/next-auth/provider";
import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";

// 日本語フォントの設定
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Rumini - 香水ECサイト | あなたにぴったりの香りを見つけよう",
  description: "香水・フレグランス専門のECサイトRumini。人気ブランドから新作まで幅広く取り扱い。お試しサンプルから定期購入まで、あなたの香りライフをサポートします。",
  keywords: "香水, フレグランス, 香り, パフューム, ブランド香水, 定期購入, サンプル, Rumini",
  openGraph: {
    title: "Rumini - 香水ECサイト | あなたにぴったりの香りを見つけよう",
    description: "香水・フレグランス専門のECサイトRumini。人気ブランドから新作まで幅広く取り扱い。",
    url: process.env.NEXTAUTH_URL || "https://rumini.jp",
    siteName: "Rumini",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Rumini - 香水ECサイト",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rumini - 香水ECサイト",
    description: "香水・フレグランス専門のECサイトRumini。あなたにぴったりの香りを見つけよう。",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Rumini",
              "description": "香水・フレグランス専門のECサイト",
              "url": process.env.NEXTAUTH_URL || "https://rumini.jp",
              "logo": {
                "@type": "ImageObject",
                "url": `${process.env.NEXTAUTH_URL || "https://rumini.jp"}/logo.png`
              },
              "sameAs": [
                "https://twitter.com/rumini_official",
                "https://instagram.com/rumini_official"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+81-3-1234-5678",
                "contactType": "customer service",
                "areaServed": "JP",
                "availableLanguage": "Japanese"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Rumini",
              "alternateName": "香水ECサイト Rumini",
              "url": process.env.NEXTAUTH_URL || "https://rumini.jp",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${process.env.NEXTAUTH_URL || "https://rumini.jp"}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <link rel="canonical" href={process.env.NEXTAUTH_URL || "https://rumini.jp"} />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body className={`${notoSansJP.className} min-h-screen bg-gray-50 antialiased`}>
        <NextAuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pb-20">
              <div className="w-full max-w-7xl mx-auto">
                {children}
              </div>
            </main>
            <BottomNavigation />
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
