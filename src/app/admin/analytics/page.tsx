"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Calendar,
  Download,
  Loader2,
  BarChart3,
  PieChart,
  TrendingDown
} from 'lucide-react';

interface AnalyticsData {
  salesOverTime: { date: string; amount: number; orders: number }[];
  topProducts: { id: string; name: string; sales: number; revenue: number }[];
  userGrowth: { date: string; users: number; newUsers: number }[];
  conversionMetrics: {
    totalVisitors: number;
    totalUsers: number;
    totalOrders: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  revenueByCategory: { category: string; revenue: number; percentage: number }[];
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    checkAdminAccess();
  }, [session, status, router, dateRange]);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/check-admin');
      if (!response.ok) {
        router.push('/');
        return;
      }
      fetchAnalyticsData();
    } catch (error) {
      console.error('Admin access check failed:', error);
      router.push('/');
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      
      if (!response.ok) {
        throw new Error('分析データの取得に失敗しました');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setError('分析データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/analytics/export');
      
      if (!response.ok) {
        throw new Error('エクスポートに失敗しました');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('エクスポートに失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">エラーが発生しました</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">アクセス解析・売上分析</h1>
              <p className="text-gray-600">分析用です</p>
            </div>
            <div className="flex space-x-4">
              <div className="relative inline-block text-left">
                <button
                  onClick={exportData}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  分析データをエクスポート
                </button>
              </div>
              
              <div className="flex space-x-2">
                <a
                  href="/api/admin/analytics/export?type=orders"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  注文データ
                </a>
                <a
                  href="/api/admin/analytics/export?type=users"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  ユーザーデータ
                </a>
                <a
                  href="/api/admin/analytics/export?type=products"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  商品データ
                </a>
              </div>
              <Link
                href="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                管理画面に戻る
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">期間選択</h2>
            <div className="flex space-x-2">
              {[
                { value: '7d', label: '過去7日' },
                { value: '30d', label: '過去30日' },
                { value: '90d', label: '過去90日' },
                { value: '1y', label: '過去1年' }
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setDateRange(period.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    dateRange === period.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {data && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">総売上</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ¥{data.conversionMetrics.averageOrderValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ShoppingBag className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">注文数</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data.conversionMetrics.totalOrders}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">総ユーザー数</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data.conversionMetrics.totalUsers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">コンバージョン率</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data.conversionMetrics.conversionRate.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Sales Over Time */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <BarChart3 className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">売上推移</h3>
                </div>
                <div className="h-64 flex items-end justify-between space-x-2">
                  {data.salesOverTime.slice(-7).map((item, index) => (
                    <div key={`sales-${item.date}-${index}`} className="flex flex-col items-center">
                      <div
                        className="bg-indigo-600 w-8 rounded-t"
                        style={{
                          height: `${(item.amount / Math.max(...data.salesOverTime.map(d => d.amount))) * 200}px`
                        }}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2">
                        {new Date(item.date).getDate()}
                      </div>
                      <div className="text-xs text-gray-900 font-medium">
                        ¥{item.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue by Category */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <PieChart className="h-5 w-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">カテゴリ別売上</h3>
                </div>
                <div className="space-y-3">
                  {data.revenueByCategory.map((category, index) => (
                    <div key={`category-${category.category}-${index}`} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded mr-3"
                          style={{
                            backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                          }}
                        ></div>
                        <span className="text-sm text-gray-700">{category.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          ¥{category.revenue.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({category.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">売上上位商品</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        商品名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        販売数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        売上
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.topProducts.map((product, index) => (
                      <tr key={`product-${product.id}-${index}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {index + 1}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.sales}個
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ¥{product.revenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Growth */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">ユーザー成長</h3>
              <div className="h-64 flex items-end justify-between space-x-2">
                {data.userGrowth.slice(-7).map((item, index) => (
                  <div key={`user-growth-${item.date}-${index}`} className="flex flex-col items-center">
                    <div className="flex flex-col">
                      <div
                        className="bg-green-600 w-8 rounded-t"
                        style={{
                          height: `${(item.newUsers / Math.max(...data.userGrowth.map(d => d.newUsers))) * 150}px`
                        }}
                      ></div>
                      <div
                        className="bg-blue-600 w-8"
                        style={{
                          height: `${((item.users - item.newUsers) / Math.max(...data.userGrowth.map(d => d.users))) * 150}px`
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {new Date(item.date).getDate()}
                    </div>
                    <div className="text-xs text-gray-900 font-medium">
                      {item.users}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center mt-4 space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">既存ユーザー</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-600 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">新規ユーザー</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}