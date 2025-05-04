// src/app/components/Header.tsx
"use client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, Calendar } from "lucide-react";
import { useState, useEffect } from "react";

const Header = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}/subscription`);
        if (response.ok) {
          const data = await response.json();
          setHasActiveSubscription(data.status === 'ACTIVE' || data.status === 'PAUSED');
        }
      } catch (error) {
        console.error("サブスクリプション情報の取得に失敗:", error);
      }
    };
    
    if (session?.user) {
      checkSubscriptionStatus();
    }
  }, [session]);

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
      <div className="flex justify-between items-center p-4">
        {/* ロゴ */}
        <Link href="/" className="flex items-center">
          <div className="relative h-10 w-10 mr-2">
            <Image
              src="/Rumini.jpg"
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
          
          {/* サブスクカレンダーアイコン（サブスク加入者のみ表示） */}
          {hasActiveSubscription && (
            <Link href="/subscription/calendar" className="text-purple-600">
              <Calendar className="w-6 h-6" />
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
