// src/app/profile/layout.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { User, Package, CreditCard, Home, LogOut, Settings } from "lucide-react";

const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const [currentTab, setCurrentTab] = useState("profile");
  
  // 認証されていない場合はログインページにリダイレクト
  if (status === "unauthenticated") {
    redirect("/login");
  }
  
  // セッションがまだロード中の場合
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // プロフィールナビゲーションの項目
  const navItems = [
    { id: "profile", label: "プロフィール", icon: User, href: "/profile" },
    { id: "orders", label: "購入履歴", icon: Package, href: "/profile/orders" },
    { id: "subscription", label: "サブスクリプション", icon: CreditCard, href: "/profile/subscription" }, // こちらが正しいパスになるよう修正
    { id: "addresses", label: "配送先住所", icon: Home, href: "/profile/addresses" },
    { id: "settings", label: "アカウント設定", icon: Settings, href: "/profile/settings" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* サイドバー */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            {/* ユーザー情報 */}
            <div className="p-6 border-b">
              <div className="flex items-center">
                <div className="relative h-16 w-16 rounded-full overflow-hidden mr-4">
                  <Image
                    src={session?.user?.image || "/images/default-avatar.png"}
                    alt="Profile"
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">
                    {session?.user?.name || "ゲスト"}
                  </h2>
                  <p className="text-gray-500 text-sm truncate">
                    {session?.user?.email || ""}
                  </p>
                </div>
              </div>
            </div>
            
            {/* ナビゲーション */}
            <nav className="p-2">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-2 rounded-md transition ${
                        currentTab === item.id
                          ? "bg-purple-50 text-purple-700"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setCurrentTab(item.id)}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    className="flex items-center w-full px-4 py-2 rounded-md hover:bg-gray-50 transition"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>ログアウト</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        
        {/* メインコンテンツ */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;