"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldX,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  _count: {
    orders: number;
  };
}

export default function AdminManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    checkSuperAdminAccess();
  }, [session, status, router]);

  const checkSuperAdminAccess = async () => {
    try {
      const response = await fetch('/api/auth/check-admin');
      if (!response.ok) {
        router.push('/');
        return;
      }

      // 現在のユーザーがスーパー管理者（初期管理者）かチェック
      const adminCheck = await fetch('/api/admin/check-super-admin');
      if (!adminCheck.ok) {
        router.push('/admin');
        return;
      }

      fetchAdmins();
    } catch (error) {
      console.error('Super admin access check failed:', error);
      router.push('/admin');
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/admin/admins');
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      alert('パスワードが一致しません');
      return;
    }

    if (newAdmin.password.length < 8) {
      alert('パスワードは8文字以上である必要があります');
      return;
    }

    if (!newAdmin.email.includes('@')) {
      alert('有効なメールアドレスを入力してください');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newAdmin.email,
          name: newAdmin.name,
          password: newAdmin.password
        }),
      });

      if (response.ok) {
        alert('管理者を追加しました');
        setNewAdmin({ email: '', name: '', password: '', confirmPassword: '' });
        setShowAddForm(false);
        fetchAdmins();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to add admin:', error);
      alert('管理者の追加に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string, email: string) => {
    if (email === 'rikumatsumoto.2003@gmail.com') {
      alert('初期管理者は削除できません');
      return;
    }

    if (!confirm(`管理者 ${email} を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('管理者を削除しました');
        fetchAdmins();
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to remove admin:', error);
      alert('管理者の削除に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (adminId: string, email: string) => {
    const newPassword = Math.random().toString(36).slice(-12);
    
    if (!confirm(`${email} のパスワードをリセットしますか？\n新しいパスワード: ${newPassword}\n\nこのパスワードをメモして、対象ユーザーに安全な方法で伝えてください。`)) {
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/admins/${adminId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (response.ok) {
        alert(`パスワードをリセットしました\n新しいパスワード: ${newPassword}\n\n必ず対象ユーザーに安全な方法で伝えてください。`);
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('パスワードのリセットに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

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
                <h1 className="text-2xl font-bold text-gray-900">管理者管理</h1>
                <p className="text-gray-600">システム管理者の追加・削除・権限管理</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">セキュリティ警告</h3>
              <p className="mt-1 text-sm text-red-700">
                管理者権限は非常に強力です。信頼できる人にのみ付与してください。
                管理者は全てのユーザー情報、注文情報、システム設定にアクセスできます。
              </p>
            </div>
          </div>
        </div>

        {/* Add Admin Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            管理者を追加
          </button>
        </div>

        {/* Add Admin Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">新しい管理者を追加</h3>
            </div>
            <form onSubmit={handleAddAdmin} className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名前
                  </label>
                  <input
                    type="text"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード (8文字以上)
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.password ? 'text' : 'password'}
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, password: !showPasswords.password})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    パスワード確認
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirmPassword ? 'text' : 'password'}
                      value={newAdmin.confirmPassword}
                      onChange={(e) => setNewAdmin({...newAdmin, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 pr-10"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({...showPasswords, confirmPassword: !showPasswords.confirmPassword})}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                  追加
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Admins List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">管理者一覧</h3>
            <p className="text-sm text-gray-500">システムの管理者権限を持つユーザー</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    管理者情報
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    権限レベル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {admin.name || '名前未設定'}
                        </div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {admin.email === 'rikumatsumoto.2003@gmail.com' ? (
                          <>
                            <ShieldCheck className="h-5 w-5 text-red-600 mr-2" />
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              スーパー管理者
                            </span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-5 w-5 text-blue-600 mr-2" />
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              管理者
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {admin.email !== 'rikumatsumoto.2003@gmail.com' && (
                          <>
                            <button
                              onClick={() => handleResetPassword(admin.id, admin.email!)}
                              disabled={isProcessing}
                              className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                              title="パスワードリセット"
                            >
                              <Lock className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveAdmin(admin.id, admin.email!)}
                              disabled={isProcessing}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="管理者権限削除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {admin.email === 'rikumatsumoto.2003@gmail.com' && (
                          <span className="text-gray-400 text-xs">削除不可</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {admins.length === 0 && (
            <div className="text-center py-12">
              <ShieldX className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">管理者が見つかりません</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}