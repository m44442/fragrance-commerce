"use client";

import { Search, ShoppingCart, User, Menu, X, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { Container } from "./ui/Container";
import { cn } from "@/lib/utils";

export default function Header() {
  const { data: session } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!session?.user) return;
      
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          const count = data.items?.reduce((total: number, item: any) => total + item.quantity, 0) || 0;
          setCartCount(count);
        }
      } catch (error) {
        console.error('カート情報の取得に失敗:', error);
      }
    };

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
      fetchCartCount();
      checkSubscriptionStatus();
    }
  }, [session]);

  const navigationItems = [
    { href: "/", label: "ホーム" },
    { href: "/new-arrivals", label: "新着" },
    { href: "/rankings", label: "ランキング" },
    { href: "/brands", label: "ブランド" },
    { href: "/categories", label: "カテゴリ" },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <Container>
        <div className="flex items-center justify-between py-3 lg:py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="relative h-8 w-8 mr-2 sm:h-10 sm:w-10">
              <Image
                src="/Rumini.jpg"
                alt="Rumini"
                fill
                className="object-cover rounded"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-800">Rumini</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-6 lg:mx-8">
            <Link href="/search" className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="香水を検索..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  readOnly
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </Link>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
            {/* Search Icon - Mobile only */}
            <Button variant="ghost" size="icon" asChild className="md:hidden">
              <Link href="/search">
                <Search className="h-5 w-5" />
              </Link>
            </Button>

            {/* Subscription Calendar */}
            {hasActiveSubscription && (
              <Button variant="ghost" size="icon" asChild>
                <Link href="/subscription/calendar">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </Link>
              </Button>
            )}

            {/* Shopping Cart */}
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center min-w-[16px] text-[10px] font-medium">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* User Icon */}
            <Button variant="ghost" size="icon" asChild>
              <Link href={session?.user ? "/profile" : "/login"}>
                {session?.user?.image ? (
                  <div className="relative h-6 w-6 rounded-full overflow-hidden">
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
