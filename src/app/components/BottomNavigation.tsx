"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

// ナビゲーション項目の定義
const navItems = [
  { id: 1, label: "ホーム", icon: Home, href: "/" },
  { id: 2, label: "検索", icon: Search, href: "/search" },
  { id: 3, label: "気になる", icon: Heart, href: "/favorites" },
  { id: 4, label: "マイページ", icon: User, href: "/profile" },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:w-96 bg-white border border-gray-200 z-50 shadow-lg rounded-xl">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const needsAuth = item.href === "/favorites" || item.href === "/profile";
          const href = needsAuth && !session ? "/login" : item.href;
          
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 mb-1 transition-all",
                  isActive && "scale-110"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
