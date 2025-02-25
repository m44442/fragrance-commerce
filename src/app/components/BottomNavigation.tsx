"use client";
import Link from "next/link";
import { Home, Search, User, Heart, UserCircle } from "lucide-react";

const navItems = [
  { id: 1, label: "ホーム", icon: Home, href: "/" },
  { id: 2, label: "検索", icon: Search, href: "/search" },
  { id: 3, label: "カート", icon: User, href: "/profile" },
  { id: 4, label: "気になる", icon: Heart, href: "/favorites" },
  { id: 5, label: "マイページ", icon: UserCircle, href: "/mypage" },
];

const BottomNavigation = () => {
  return (
    <nav className="fixed bottom-0 w-full max-w-[790px] h-16 bg-white border-t border-gray-100">
      <div className="grid grid-cols-5 h-full">
        {navItems.map((item) => (
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
