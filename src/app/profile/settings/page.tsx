"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

const SettingsPage = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const data = await response.json();
          setUserData({
            name: data.name || "",
            email: data.email || "",
            phoneNumber: data.phoneNumber || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [session]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    
    setIsSaving(true);
    setMessage("");
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        setMessage("アカウント情報を更新しました");
      } else {
        setMessage("更新に失敗しました。もう一度お試しください");
      }
    } catch (error) {
      console.error("Error saving user data:", error);
      setMessage("エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("新しいパスワードが一致しません");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordMessage("パスワードは8文字以上で入力してください");
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordMessage("");
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPasswordMessage("パスワードを変更しました");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setPasswordMessage(data.message || "パスワードの変更に失敗しました");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordMessage("エラーが発生しました");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-purple-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">アカウント設定</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            お名前
          </label>
          <input
            type="text"
            name="name"
            value={userData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            電話番号
          </label>
          <input
            type="text"
            name="phoneNumber"
            value={userData.phoneNumber}
            onChange={handleChange}
            placeholder="例: 090-1234-5678"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {isSaving ? "更新中..." : "更新する"}
        </button>
        
        {message && (
          <div className={`p-3 rounded-md ${message.includes("失敗") || message.includes("エラー") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}
      </form>
      
      {/* パスワード変更セクション */}
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-lg font-semibold mb-4">パスワード変更</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              現在のパスワード
            </label>
            <input
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード
            </label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
              minLength={8}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード（確認）
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isChangingPassword ? "変更中..." : "パスワードを変更"}
          </button>
          
          {passwordMessage && (
            <div className={`p-3 rounded-md ${passwordMessage.includes("失敗") || passwordMessage.includes("エラー") || passwordMessage.includes("一致") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              {passwordMessage}
            </div>
          )}
        </form>
      </div>
      
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-lg font-semibold mb-4">アカウント操作</h2>
        <button
          onClick={handleLogout}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;