// src/app/admin/orders/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// ステータスの型定義
type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

// ステータスのラベルとカラークラスを管理
const statusConfig = {
  'PENDING': { label: '未発送', color: 'bg-red-100 text-red-800' },
  'PROCESSING': { label: '発送準備中', color: 'bg-yellow-100 text-yellow-800' },
  'SHIPPED': { label: '発送済み', color: 'bg-green-100 text-green-800' },
  'DELIVERED': { label: '配達済み', color: 'bg-blue-100 text-blue-800' }
};

export default function OrderDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // 注文データ取得
  useEffect(() => {
    if (status === 'authenticated' && orderId) {
      fetchOrderDetail();
    }
  }, [status, orderId]);
  
  // 注文詳細を取得する関数
  async function fetchOrderDetail() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      
      if (!res.ok) {
        // 管理者でない場合はホームにリダイレクト
        if (res.status === 403) {
          setError('管理者権限がありません');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch order details');
      }
      
      const data = await res.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('注文詳細の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }
  
  // ステータス更新
  async function updateOrderStatus(newStatus: OrderStatus, sendNotification = false) {
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: [orderId],
          status: newStatus,
          sendNotification
        })
      });
      
      if (!res.ok) throw new Error('Failed to update order status');
      
      const result = await res.json();
      
      // 更新成功
      setNotification({
        type: 'success',
        message: `注文ステータスを「${statusConfig[newStatus].label}」に更新しました${sendNotification ? '。顧客にメール通知を送信しました。' : ''}`
      });
      
      // データを再取得
      fetchOrderDetail();
    } catch (error) {
      console.error('Error updating order status:', error);
      setNotification({
        type: 'error',
        message: '注文ステータスの更新に失敗しました'
      });
    } finally {
      setUpdating(false);
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
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link href="/admin/orders" className="text-blue-600 hover:underline">
          ← 注文一覧に戻る
        </Link>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          注文が見つかりませんでした
        </div>
        <Link href="/admin/orders" className="text-blue-600 hover:underline">
          ← 注文一覧に戻る
        </Link>
      </div>
    );
  }
  
  // 注文アイテムの合計金額を計算
  const calculateTotal = (items) => {
    return items.reduce((total, item) => {
      const price = item.product.discountPrice || item.product.price;
      return total + price * item.quantity;
    }, 0);
  };
  
  // 日付フォーマット
  const formatDate = (dateString) => {
    if (!dateString) return '未設定';
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">注文詳細</h1>
        <Link href="/admin/orders" className="text-blue-600 hover:underline">
          ← 注文一覧に戻る
        </Link>
      </div>
      
      {notification && (
        <div className={`${notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'} border px-4 py-3 rounded mb-4`}>
          {notification.message}
        </div>
      )}
      
      {/* 注文情報 */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">注文情報</h2>
        <div className="flex flex-wrap -mx-2">
          <div className="w-full md:w-1/2 px-2 mb-4">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="font-semibold pr-4 py-1">注文番号:</td>
                  <td>{order.orderNumber}</td>
                </tr>
                <tr>
                  <td className="font-semibold pr-4 py-1">注文日時:</td>
                  <td>{formatDate(order.createdAt)}</td>
                </tr>
                <tr>
                  <td className="font-semibold pr-4 py-1">合計金額:</td>
                  <td>{order.totalAmount?.toLocaleString()}円</td>
                </tr>
                <tr>
                  <td className="font-semibold pr-4 py-1">ステータス:</td>
                  <td>
                    <span className={`px-2 py-1 rounded ${statusConfig[order.status].color}`}>
                      {statusConfig[order.status].label}
                    </span>
                  </td>
                </tr>
                {order.status === 'SHIPPED' && (
                  <tr>
                    <td className="font-semibold pr-4 py-1">発送日時:</td>
                    <td>{formatDate(order.shippedAt)}</td>
                  </tr>
                )}
                <tr>
                  <td className="font-semibold pr-4 py-1">メール通知:</td>
                  <td>{order.notificationSent ? '送信済み' : '未送信'}</td>
                </tr>
                <tr>
                  <td className="font-semibold pr-4 py-1">決済ID:</td>
                  <td className="break-all">{order.stripePaymentIntentId || '不明'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="w-full md:w-1/2 px-2 mb-4">
            <div className="flex justify-end mb-4">
              {/* ステータス更新ボタン */}
              <div className="flex flex-wrap gap-2">
                {order.status === 'PENDING' && (
                  <button
                    onClick={() => updateOrderStatus('PROCESSING')}
                    disabled={updating}
                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
                  >
                    発送準備中に更新
                  </button>
                )}
                
                {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                  <button
                    onClick={() => updateOrderStatus('SHIPPED', true)}
                    disabled={updating}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    発送済みに更新 (メール通知)
                  </button>
                )}
                
                {(order.status === 'PENDING' || order.status === 'PROCESSING' || order.status === 'SHIPPED') && (
                  <button
                    onClick={() => updateOrderStatus('DELIVERED')}
                    disabled={updating}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    配達済みに更新
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 顧客情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">顧客情報</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="font-semibold pr-4 py-1">氏名:</td>
                <td>{order.user?.name || order.shippingAddress?.name || '不明'}</td>
              </tr>
              <tr>
                <td className="font-semibold pr-4 py-1">メールアドレス:</td>
                <td>{order.user?.email || order.shippingAddress?.email || '不明'}</td>
              </tr>
              <tr>
                <td className="font-semibold pr-4 py-1">電話番号:</td>
                <td>{order.user?.phoneNumber || order.shippingAddress?.phoneNumber || '不明'}</td>
              </tr>
              {order.userId && (
                <tr>
                  <td className="font-semibold pr-4 py-1">ユーザーID:</td>
                  <td>
                    <Link href={`/admin/users/${order.userId}`} className="text-blue-600 hover:underline">
                      {order.userId}
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">配送先情報</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="font-semibold pr-4 py-1">郵便番号:</td>
                <td>{order.shippingAddress?.postalCode || '不明'}</td>
              </tr>
              <tr>
                <td className="font-semibold pr-4 py-1">住所:</td>
                <td>
                  {order.shippingAddress?.prefecture || ''}
                  {order.shippingAddress?.city || ''}
                  {order.shippingAddress?.address || '不明'}
                </td>
              </tr>
              <tr>
                <td className="font-semibold pr-4 py-1">受取人:</td>
                <td>{order.shippingAddress?.name || order.user?.name || '不明'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 注文商品 */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">注文商品</h2>
        {order.items && order.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">商品コード</th>
                  <th className="p-2 border">商品名</th>
                  <th className="p-2 border">単価</th>
                  <th className="p-2 border">数量</th>
                  <th className="p-2 border">小計</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const price = item.product.discountPrice || item.product.price;
                  const subtotal = price * item.quantity;
                  
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{item.productId}</td>
                      <td className="p-2 border">
                        <Link href={`/products/${item.productId}`} target="_blank" className="text-blue-600 hover:underline">
                          {item.product.name}
                        </Link>
                      </td>
                      <td className="p-2 border text-right">{price.toLocaleString()}円</td>
                      <td className="p-2 border text-center">{item.quantity}</td>
                      <td className="p-2 border text-right">{subtotal.toLocaleString()}円</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={4} className="p-2 border text-right">合計:</td>
                  <td className="p-2 border text-right">{calculateTotal(order.items).toLocaleString()}円</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">商品情報がありません</p>
        )}
      </div>
      
      {/* 追加情報・メモ欄 */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">メモ欄</h2>
        <textarea
          className="w-full p-2 border rounded"
          rows={4}
          placeholder="この注文に関するメモを入力"
          defaultValue={order.adminNotes || ''}
          onChange={async (e) => {
            try {
              await fetch(`/api/admin/orders/${orderId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: e.target.value })
              });
            } catch (error) {
              console.error('メモの保存に失敗しました:', error);
            }
          }}
        />
      </div>
    </div>
  );
}