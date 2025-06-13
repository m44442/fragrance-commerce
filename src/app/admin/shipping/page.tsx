"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Download,
  Search,
  Filter,
  ArrowLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface ShippingOrder {
  id: string;
  orderNumber: string;
  user: {
    name: string | null;
    email: string | null;
  };
  products: {
    name: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress: {
    name: string;
    postalCode: string;
    prefecture: string;
    city: string;
    address: string;
    phone?: string;
  };
  status: 'PENDING' | 'PREPARING' | 'SHIPPED' | 'DELIVERED';
  createdAt: string;
  shippedAt?: string;
  total: number;
}

const statusLabels = {
  PENDING: '未発送',
  PREPARING: '発送準備',
  SHIPPED: '発送済み',
  DELIVERED: '配送完了'
};

const statusColors = {
  PENDING: 'bg-red-100 text-red-800',
  PREPARING: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800'
};

export default function ShippingManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
      fetchOrders();
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/shipping/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // CSV出力機能
  const exportToCSV = async () => {
    const pendingOrders = orders.filter(order => order.status === 'PENDING');
    
    if (pendingOrders.length === 0) {
      alert('未発送の注文がありません');
      return;
    }

    setIsProcessing(true);
    
    try {
      // CSV出力APIを呼び出し
      const response = await fetch('/api/admin/shipping/export-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderIds: pendingOrders.map(order => order.id)
        }),
      });

      if (response.ok) {
        // CSVファイルをダウンロード
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `shipping_orders_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        // 注文ステータスを「発送準備」に更新
        await updateOrderStatus(pendingOrders.map(order => order.id), 'PREPARING');
        
        alert(`${pendingOrders.length}件の注文をCSV出力し、発送準備に移行しました`);
        fetchOrders(); // データを再取得
      } else {
        throw new Error('CSV出力に失敗しました');
      }
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('CSV出力に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 一括発送処理
  const bulkShip = async () => {
    if (selectedOrders.length === 0) {
      alert('発送する注文を選択してください');
      return;
    }

    if (!confirm(`${selectedOrders.length}件の注文を発送済みに変更しますか？`)) {
      return;
    }

    setIsProcessing(true);
    
    try {
      await updateOrderStatus(selectedOrders, 'SHIPPED');
      alert(`${selectedOrders.length}件の注文を発送済みに変更しました`);
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error('Bulk ship failed:', error);
      alert('一括発送処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 注文ステータス更新
  const updateOrderStatus = async (orderIds: string[], newStatus: string) => {
    const response = await fetch('/api/admin/shipping/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderIds,
        status: newStatus
      }),
    });

    if (!response.ok) {
      throw new Error('ステータス更新に失敗しました');
    }
  };

  // 個別ステータス変更
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus([orderId], newStatus);
      fetchOrders();
    } catch (error) {
      console.error('Status update failed:', error);
      alert('ステータス更新に失敗しました');
    }
  };

  // フィルタリング
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // チェックボックス操作
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const preparingOrders = filteredOrders
        .filter(order => order.status === 'PREPARING')
        .map(order => order.id);
      setSelectedOrders(preparingOrders);
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingCount = orders.filter(order => order.status === 'PENDING').length;
  const preparingCount = orders.filter(order => order.status === 'PREPARING').length;
  const shippedCount = orders.filter(order => order.status === 'SHIPPED').length;

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
                <h1 className="text-2xl font-bold text-gray-900">発送管理</h1>
                <p className="text-gray-600">注文の発送状況を管理します</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">未発送</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingCount}件</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">発送準備</p>
                <p className="text-2xl font-semibold text-gray-900">{preparingCount}件</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">発送済み</p>
                <p className="text-2xl font-semibold text-gray-900">{shippedCount}件</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center space-x-4">
                {/* CSV出力ボタン */}
                <button
                  onClick={exportToCSV}
                  disabled={isProcessing || pendingCount === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isProcessing ? '処理中...' : `CSV出力 (${pendingCount}件)`}
                </button>

                {/* 一括発送ボタン */}
                <button
                  onClick={bulkShip}
                  disabled={isProcessing || selectedOrders.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  一括発送 ({selectedOrders.length}件)
                </button>
              </div>

              <div className="flex items-center space-x-4">
                {/* ステータスフィルター */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="ALL">すべて</option>
                  <option value="PENDING">未発送</option>
                  <option value="PREPARING">発送準備</option>
                  <option value="SHIPPED">発送済み</option>
                </select>

                {/* 検索 */}
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="注文番号、顧客名で検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={selectedOrders.length > 0 && selectedOrders.length === filteredOrders.filter(order => order.status === 'PREPARING').length}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注文番号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顧客情報
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注文日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                        disabled={order.status !== 'PREPARING'}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.user.name || '名前未設定'}
                      </div>
                      <div className="text-sm text-gray-500">{order.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.products.map(product => `${product.name} x${product.quantity}`).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{order.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="PENDING">未発送</option>
                        <option value="PREPARING">発送準備</option>
                        <option value="SHIPPED">発送済み</option>
                        <option value="DELIVERED">配送完了</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">注文が見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                検索条件を変更してください
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}