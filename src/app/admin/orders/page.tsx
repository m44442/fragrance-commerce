// src/app/admin/orders/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 注文ステータスの型定義
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'all';

// 注文アイテムの型定義
interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    name: string;
    price: number;
  };
}

// 注文データの型定義
interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  shippedAt: string | null;
  notificationSent: boolean;
  shippingAddress: {
    name: string;
    email: string;
    address: string;
    postalCode: string;
    prefecture: string;
    city: string;
    phoneNumber: string;
  };
  user?: {
    name: string;
    email: string;
    postalCode: string;
    prefecture: string;
    city: string;
    address: string;
    phoneNumber: string;
  };
  items?: OrderItem[];
}

// ステータスのラベルとカラークラスを管理
const statusConfig = {
  'PENDING': { label: '未発送', color: 'bg-red-100 text-red-800' },
  'PROCESSING': { label: '発送準備中', color: 'bg-yellow-100 text-yellow-800' },
  'SHIPPED': { label: '発送済み', color: 'bg-green-100 text-green-800' },
  'DELIVERED': { label: '配達済み', color: 'bg-blue-100 text-blue-800' },
  'all': { label: 'すべて', color: 'bg-gray-100 text-gray-800' }
};

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);

  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 注文データ取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, selectedStatus]);

  // 検索フィルター
  useEffect(() => {
    if (orders.length > 0) {
      filterOrders();
    }
  }, [orders, searchQuery]);

  // 注文データを取得する関数
  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const statusParam = selectedStatus !== 'all' ? `?status=${selectedStatus}` : '';
      const res = await fetch(`/api/admin/orders${statusParam}`);
      
      if (!res.ok) {
        // 管理者でない場合はホームにリダイレクト
        if (res.status === 403) {
          setError('管理者権限がありません');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch orders');
      }
      
      const data = await res.json();
      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('注文データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  // 注文検索・フィルター関数
  function filterOrders() {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = orders.filter(order => {
      return (
        order.orderNumber.toLowerCase().includes(query) ||
        (order.user?.name || order.shippingAddress.name)?.toLowerCase().includes(query) ||
        (order.user?.email || order.shippingAddress.email)?.toLowerCase().includes(query) ||
        (order.user?.phoneNumber || order.shippingAddress.phoneNumber)?.toLowerCase().includes(query) ||
        order.items?.some(item => item.product.name.toLowerCase().includes(query))
      );
    });

    setFilteredOrders(filtered);
  }

  // 全選択/解除
  function toggleSelectAll() {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  }

  // 個別選択/解除
  function toggleSelectOrder(orderId: string) {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  }

  // 一括ステータス更新
  async function updateOrdersStatus(newStatus: OrderStatus, sendNotification = false) {
    if (selectedOrders.length === 0) {
      setNotification({ type: 'error', message: '注文が選択されていません' });
      return;
    }

    setBulkActionLoading(true);
    try {
      const res = await fetch('/api/admin/orders/bulk-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-status',
          orderIds: selectedOrders,
          data: {
            status: newStatus,
            sendNotification
          }
        })
      });

      if (!res.ok) throw new Error('Failed to update orders status');
      
      const result = await res.json();
      setNotification({ 
        type: 'success', 
        message: result.message || `${result.updatedCount}件の注文を「${statusConfig[newStatus].label}」に更新しました` 
      });
      
      // 更新後は選択をクリアして再読み込み
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      console.error('Error updating orders status:', error);
      setNotification({ type: 'error', message: '注文ステータスの更新に失敗しました' });
    } finally {
      setBulkActionLoading(false);
    }
  }

  // CSV出力処理
  async function exportCSV() {
    try {
      setBulkActionLoading(true);
      setNotification({ type: 'success', message: 'CSVエクスポートを開始しました...' });
      
      // 選択された注文のCSVをエクスポート
      if (selectedOrders.length > 0) {
        const res = await fetch('/api/admin/orders/bulk-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'export-csv',
            orderIds: selectedOrders
          })
        });
        
        if (!res.ok) throw new Error('Failed to export CSV');
        
        const result = await res.json();
        
        // Base64エンコードされたCSVデータを取得
        const base64Data = result.csvData;
        const decodedData = atob(base64Data);
        
        // Blobオブジェクトを作成
        const blob = new Blob([new Uint8Array([...decodedData].map(char => char.charCodeAt(0)))], { type: 'text/csv;charset=utf-8;' });
        
        // ダウンロードリンクを作成
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setNotification({ type: 'success', message: `${result.totalOrders}件の注文データをエクスポートしました` });
      }
      // 日付範囲でStripeからエクスポート
      else {
        // スマート検索：URLクエリを構築
        let url = `/api/admin/orders/export-stripe?start=${dateRange.start}&end=${dateRange.end}`;
        if (selectedStatus !== 'all') {
          url += `&status=${selectedStatus}`;
        }
        
        // ダウンロードリンクを開く
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setNotification({ type: 'success', message: 'CSVファイルのダウンロードを開始しました' });
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setNotification({ type: 'error', message: 'CSVエクスポートに失敗しました' });
    } finally {
      setBulkActionLoading(false);
    }
  }

  // 通知の自動クリア
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (status === 'loading' || loading) {
    return <div className="text-center p-10">読み込み中...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">注文管理</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {notification && (
        <div className={`${notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-4`}>
          {notification.message}
        </div>
      )}
      
      {/* 検索とフィルター */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">注文検索</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="注文番号、顧客名、商品名など"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as OrderStatus)}
              className="w-full p-2 border rounded"
            >
              <option value="all">すべて</option>
              <option value="PENDING">未発送</option>
              <option value="PROCESSING">発送準備中</option>
              <option value="SHIPPED">発送済み</option>
              <option value="DELIVERED">配達済み</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className="p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              className="p-2 border rounded"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchOrders}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              絞り込み
            </button>
          </div>
        </div>
      </div>
      
      {/* 一括操作 */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">一括操作</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateOrdersStatus('PROCESSING')}
            disabled={selectedOrders.length === 0 || bulkActionLoading}
            className={`px-3 py-1 rounded text-sm ${selectedOrders.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
          >
            発送準備中に更新
          </button>
          
          <button
            onClick={() => updateOrdersStatus('SHIPPED', true)}
            disabled={selectedOrders.length === 0 || bulkActionLoading}
            className={`px-3 py-1 rounded text-sm ${selectedOrders.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
            発送済みに更新 (メール通知)
          </button>
          
          <button
            onClick={() => updateOrdersStatus('DELIVERED')}
            disabled={selectedOrders.length === 0 || bulkActionLoading}
            className={`px-3 py-1 rounded text-sm ${selectedOrders.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            配達済みに更新
          </button>
          
          <button
            onClick={exportCSV}
            disabled={bulkActionLoading}
            className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
          >
            {selectedOrders.length > 0 
              ? `選択した注文をCSV出力 (${selectedOrders.length}件)`
              : 'Stripeから注文をCSV出力'}
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          {selectedOrders.length > 0 ? (
            <span>{selectedOrders.length}件の注文を選択中</span>
          ) : (
            <span>操作する注文を選択してください</span>
          )}
        </div>
      </div>
      
      {/* 注文一覧 */}
      <div className="bg-white p-4 rounded shadow overflow-hidden">
        <h2 className="text-lg font-semibold mb-4">注文一覧</h2>
        
        {filteredOrders.length === 0 ? (
          <p className="text-center py-4">注文が見つかりません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4"
                    />
                  </th>
                  <th className="p-2 border">注文番号</th>
                  <th className="p-2 border">日付</th>
                  <th className="p-2 border">顧客名</th>
                  <th className="p-2 border">金額</th>
                  <th className="p-2 border">ステータス</th>
                  <th className="p-2 border">商品</th>
                  <th className="p-2 border">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-2 border text-center">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="p-2 border">
                      <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="p-2 border">
                      {new Date(order.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="p-2 border">
                      {order.user?.name || order.shippingAddress.name || '-'}
                    </td>
                    <td className="p-2 border">
                      {order.totalAmount.toLocaleString()}円
                    </td>
                    <td className="p-2 border">
                      <span className={`px-2 py-1 rounded text-xs ${statusConfig[order.status].color}`}>
                        {statusConfig[order.status].label}
                      </span>
                      {order.notificationSent && (
                        <span className="ml-1 text-xs text-gray-500">
                          (通知済み)
                        </span>
                      )}
                    </td>
                    <td className="p-2 border">
                      {order.items && order.items.length > 0 ? (
                        <div className="max-h-20 overflow-y-auto">
                          {order.items.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.product.name} × {item.quantity}
                            </div>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2 border">
                      <div className="flex flex-wrap gap-1">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          詳細
                        </Link>
                        
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => updateOrdersStatus('PROCESSING')}
                            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                          >
                            準備中
                          </button>
                        )}
                        
                        {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                          <button
                            onClick={() => updateOrdersStatus('SHIPPED', true)}
                            className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                          >
                            発送済み
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}