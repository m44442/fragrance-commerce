// src/app/profile/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const ProfilePage = () => {
  const { data: session } = useSession();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [session]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">マイプロフィール</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-3">基本情報</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">お名前</p>
                <p className="font-medium">{user?.name || "未設定"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">メールアドレス</p>
                <p className="font-medium">{user?.email || "未設定"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">電話番号</p>
                <p className="font-medium">{user?.phoneNumber || "未設定"}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-3">住所情報</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            {user?.address ? (
              <div>
                <p className="text-sm text-gray-500">住所</p>
                <p className="font-medium">
                  〒{user.postalCode} {user.prefecture}{user.city}{user.address}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">住所が設定されていません</p>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-3">アカウント情報</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">アカウント作成日</p>
                <p className="font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("ja-JP") : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">認証方法</p>
                <p className="font-medium">LINE</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;