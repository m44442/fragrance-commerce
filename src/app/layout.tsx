import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "./lib/next-auth/provider";
import Header from "./components/Header";
import BottomNavigation from "./components/BottomNavigation";

// 日本語フォントの設定
const notoSansJP = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "Rumini - 香水ECサイト",
  description: "あなたにぴったりの香りを見つけよう。Ruminiは香水のECサイトです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} min-h-screen bg-gray-50`}>
        <NextAuthProvider>
          <div className="w-full max-w-[790px] mx-auto bg-white min-h-screen relative">
            <Header />
            <main className="pb-20">
              {children}
            </main>
            <BottomNavigation />
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}
