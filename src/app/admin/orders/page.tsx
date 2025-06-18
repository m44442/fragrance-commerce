"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  ShoppingBag,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Loader2,
  RotateCcw,
  CreditCard,
  X,
  Check,
  Package,
  Truck
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  isSample: boolean;
  product: {
    id: string;
    name: string;
    imageUrl: string;
    brand: {
      name: string;
    };
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  stripePaymentIntentId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    zipCode: string;
    prefecture: string;
    city: string;
    address: string;
    building?: string;
  };
}

const ORDER_STATUS_MAP = {
  'pending': { label: '支払い待ち', color: 'bg-yellow-100 text-yellow-800' },
  'paid': { label: '支払い完了', color: 'bg-blue-100 text-blue-800' },
  'processing': { label: '処理中', color: 'bg-purple-100 text-purple-800' },
  'shipped': { label: '発送済み', color: 'bg-green-100 text-green-800' },
  'delivered': { label: '配達完了', color: 'bg-gray-100 text-gray-800' },
  'cancelled': { label: 'キャンセル', color: 'bg-red-100 text-red-800' },
  'refunded': { label: '返金済み', color: 'bg-orange-100 text-orange-800' }
};

export default function OrdersManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
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
      setLoading(false);
      fetchOrders();
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        const error = await response.json();
        alert(error.error || 'ステータス更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('ステータス更新に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder || !refundReason.trim()) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: refundReason })
      });

      if (response.ok) {
        await fetchOrders();
        setIsRefundModalOpen(false);
        setRefundReason('');
        setIsDetailModalOpen(false);
        alert('返金処理が完了しました');
      } else {
        const error = await response.json();
        alert(error.error || '返金処理に失敗しました');
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
      alert('返金処理に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredOrders = (orders || []).filter(order => {
    const matchesSearch = 
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => 
        item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
                <h1 className="text-2xl font-bold text-gray-900">注文管理</h1>
                <p className="text-gray-600">注文の確認・ステータス管理・返金処理</p>
              </div>
            </div>
            <Link
              href="/admin/shipping"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <Truck className="h-4 w-4 mr-2" />
              発送管理
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                注文検索
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="注文ID・顧客名・商品名で検索"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">全てのステータス</option>
                {Object.entries(ORDER_STATUS_MAP).map(([status, config]) => (
                  <option key={status} value={status}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {filteredOrders?.length || 0} 件の注文
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注文ID / 顧客
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
                  注文日時
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders?.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{order.id?.slice(-8) || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.user?.email || 'No Email'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {order.items?.slice(0, 2).map((item) => (
                        <div key={item.id} className="text-sm text-gray-900">
                          {item.product?.name || 'Unknown Product'} 
                          {item.isSample && ' (試供品)'}
                          <span className="text-gray-500"> ×{item.quantity || 0}</span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 2 && (
                        <div className="text-sm text-gray-500">
                          他 {(order.items?.length || 0) - 2} 件
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ¥{order.totalAmount?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP]?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {ORDER_STATUS_MAP[order.status as keyof typeof ORDER_STATUS_MAP]?.label || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsDetailModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(filteredOrders?.length || 0) === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">注文が見つかりません</h3>
              <p className="mt-1 text-sm text-gray-500">
                条件を変更して再度検索してください
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    注文詳細 #{selectedOrder.id?.slice(-8) || 'N/A'}
                  </h3>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 顧客情報 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">顧客情報</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">名前:</span> {selectedOrder.user.name}</div>
                      <div><span className="text-gray-500">メール:</span> {selectedOrder.user.email}</div>
                    </div>
                  </div>

                  {/* 配送先情報 */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">配送先情報</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-500">宛先:</span> {selectedOrder.shippingAddress.name}</div>
                      <div><span className="text-gray-500">電話:</span> {selectedOrder.shippingAddress.phone}</div>
                      <div>
                        <span className="text-gray-500">住所:</span> 
                        〒{selectedOrder.shippingAddress.zipCode} {selectedOrder.shippingAddress.prefecture}
                        {selectedOrder.shippingAddress.city}{selectedOrder.shippingAddress.address}
                        {selectedOrder.shippingAddress.building && ` ${selectedOrder.shippingAddress.building}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 注文商品 */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">注文商品</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2">
                        <div>
                          <div className="text-sm font-medium">
                            {item.product.name} {item.isSample && '(試供品)'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.product.brand.name} × {item.quantity}
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          ¥{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span>合計</span>
                        <span>¥{selectedOrder.totalAmount?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ステータス・操作 */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">現在のステータス</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ORDER_STATUS_MAP[selectedOrder.status as keyof typeof ORDER_STATUS_MAP]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {ORDER_STATUS_MAP[selectedOrder.status as keyof typeof ORDER_STATUS_MAP]?.label || selectedOrder.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      注文日時: {new Date(selectedOrder.createdAt).toLocaleString('ja-JP')}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'paid')}
                        disabled={isProcessing}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        支払い確認
                      </button>
                    )}
                    
                    {(selectedOrder.status === 'paid' || selectedOrder.status === 'processing') && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'processing')}
                          disabled={isProcessing}
                          className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                        >
                          処理中に変更
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'shipped')}
                          disabled={isProcessing}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          発送完了
                        </button>
                      </>
                    )}

                    {selectedOrder.status === 'shipped' && (
                      <button
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}
                        disabled={isProcessing}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        配達完了
                      </button>
                    )}

                    {(selectedOrder.status === 'paid' || selectedOrder.status === 'processing') && (
                      <button
                        onClick={() => setIsRefundModalOpen(true)}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        返金処理
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {isRefundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <RotateCcw className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      返金処理
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        注文 #{selectedOrder.id?.slice(-8) || 'N/A'} の返金を実行します。
                        金額: ¥{selectedOrder.totalAmount?.toLocaleString() || '0'}
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          返金理由
                        </label>
                        <textarea
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="返金理由を入力してください"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleRefund}
                  disabled={isProcessing || !refundReason.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  返金実行
                </button>
                <button
                  onClick={() => {
                    setIsRefundModalOpen(false);
                    setRefundReason('');
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}