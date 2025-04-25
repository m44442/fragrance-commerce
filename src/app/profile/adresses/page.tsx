"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const AddressesPage = () => {
  const { data: session } = useSession();
  const [address, setAddress] = useState({
    postalCode: "",
    prefecture: "",
    city: "",
    address: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch(`/api/users/${session.user.id}`);
        if (response.ok) {
          const userData = await response.json();
          setAddress({
            postalCode: userData.postalCode || "",
            prefecture: userData.prefecture || "",
            city: userData.city || "",
            address: userData.address || "",
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
    setAddress(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;
    
    setIsSaving(true);
    setMessage("");
    
    try {
      const response = await fetch(`/api/users/${session.user.id}/address`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(address),
      });
      
      if (response.ok) {
        setMessage("配送先住所を保存しました");
      } else {
        setMessage("保存に失敗しました。もう一度お試しください");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      setMessage("エラーが発生しました");
    } finally {
      setIsSaving(false);
    }
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
      <h1 className="text-2xl font-bold mb-6">配送先住所</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            郵便番号
          </label>
          <input
            type="text"
            name="postalCode"
            value={address.postalCode}
            onChange={handleChange}
            placeholder="例: 100-0001"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            都道府県
          </label>
          <input
            type="text"
            name="prefecture"
            value={address.prefecture}
            onChange={handleChange}
            placeholder="例: 東京都"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            市区町村
          </label>
          <input
            type="text"
            name="city"
            value={address.city}
            onChange={handleChange}
            placeholder="例: 新宿区"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            番地・建物名
          </label>
          <input
            type="text"
            name="address"
            value={address.address}
            onChange={handleChange}
            placeholder="例: 新宿1-1-1 新宿ビル101"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {isSaving ? "保存中..." : "保存する"}
        </button>
        
        {message && (
          <div className={`p-3 rounded-md ${message.includes("失敗") || message.includes("エラー") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddressesPage;