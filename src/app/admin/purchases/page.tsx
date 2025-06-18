"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  ShoppingBag,
  Search,
  Eye,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface Purchase {
  id: string;
  userId: string;
  fragranceId: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  fragrance: {
    id: string;
    name: string;
    price: number;
    thumbnailUrl?: string;
    brand: {
      name: string;
    };
  };
}

export default function PurchasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    checkAdminAccess();
  }, [session, status, router]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/check-admin');
      if (!response.ok) {
        router.push('/');
        return;
      }
      setLoading(false);
      fetchPurchases();
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/');
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/admin/purchases');
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    }
  };

  const filteredPurchases = (purchases || []).filter(purchase => {
    const matchesSearch = 
      purchase.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.fragrance?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.fragrance?.brand?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">購入管理</h1>
                <p className="text-gray-600">顧客の購入履歴を管理します</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Purchase Management Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <ShoppingBag className="h-6 w-6 text-gray-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">購入一覧</h2>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="購入を検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Purchases Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    購入ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ブランド
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    購入日時
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{purchase.id?.slice(-8) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.user?.name || '名前未設定'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.user?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {purchase.fragrance?.thumbnailUrl && (
                          <img 
                            className="h-10 w-10 rounded-lg object-cover mr-3" 
                            src={purchase.fragrance.thumbnailUrl} 
                            alt={purchase.fragrance.name}
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {purchase.fragrance?.name || 'Unknown Product'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {purchase.fragrance?.brand?.name || 'Unknown Brand'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{purchase.fragrance?.price?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(purchase.createdAt).toLocaleString('ja-JP')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/purchases/${purchase.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        title="詳細を表示"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPurchases.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">購入が見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? '検索条件を変更してください' : '購入履歴がまだありません'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}