"use client";
import Link from "next/link";
import Image from "next/image";
import { Home, Search, Heart, User } from "lucide-react";

// ナビゲーション項目の定義
const navItems = [
  { id: 1, label: "ホーム", icon: Home, href: "/" },
  { id: 2, label: "検索", icon: Search, href: "/search" },
  { id: 3, label: "気になる", icon: Heart, href: "/favorites" },
  { id: 4, label: "マイページ", icon: User, href: "/profile" },
];

const BottomNavigation = () => {
  return (
    <nav className="fixed bottom-0 w-full max-w-[790px] h-16 bg-white border-t border-gray-100 z-10">
      <div className="grid grid-cols-5 h-full">
        {/* 通常のナビゲーション項目 */}
        {navItems.slice(0, 2).map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center justify-center"
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}

        {/* 残りのナビゲーション項目 */}
        {navItems.slice(2).map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center justify-center"
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
