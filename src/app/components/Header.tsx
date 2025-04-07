"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";

const Header = () => {
  // セッション情報を取得（ログイン状態の確認）
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="flex justify-between items-center p-4">
        {/* ロゴ */}
        <Link href="/" className="flex items-center">
        <div className="relative h-10 w-10 mr-2">
            <Image
              src="/Rumini.jpg" // ロゴ画像のパス
              alt="logo"
              layout="fill" 
              objectFit="cover"
              className="rounded"
            />
          </div>
          <span className="text-xl font-bold text-gray-800">Rumini</span>
        </Link>

        {/* 右側メニュー */}
        <div className="flex items-center space-x-4">
          {/* ログイン状態に応じて表示を切り替え */}
          {!user ? (
            <Link
              href="/login"
              className="text-gray-700 text-sm"
            >
              ログイン
            </Link>
          ) : (
            <Link href="/profile" className="relative">
              <Image
                width={32}
                height={32}
                alt="profile_icon"
                src={user.image || "/images/default-avatar.png"}
                className="rounded-full"
              />
            </Link>
          )}
          
          {/* 検索アイコン */}
          <Link href="/search" className="text-gray-700">
            <Search className="w-6 h-6" />
          </Link>
          
          {/* カートアイコン */}
          <Link href="/cart" className="text-gray-700">
            <ShoppingBag className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
