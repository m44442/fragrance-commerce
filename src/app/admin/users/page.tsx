// src/app/admin/users/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // 認証チェック
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // ユーザーデータ取得
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsers();
    }
  }, [status]);
  
  // ユーザーデータ取得関数
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        // 管理者でない場合はホームにリダイレクト
        if (res.status === 403) {
          alert('管理者権限がありません');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch users');
      }
      
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('ユーザーデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }
  
  // 管理者権限の変更
  async function toggleAdminRole(userId, makeAdmin) {
    if (!confirm(`このユーザーを${makeAdmin ? '管理者に設定' : '一般ユーザーに変更'}しますか？`)) {
      return;
    }
    
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, makeAdmin })
      });
      
      if (!res.ok) throw new Error('Failed to update user role');
      
      await fetchUsers();
      alert(`ユーザーの権限を${makeAdmin ? '管理者に設定' : '一般ユーザーに変更'}しました`);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('ユーザー権限の更新に失敗しました');
    }
  }
  
  // 管理者ユーザーの登録
  async function registerAdmin(e) {
    e.preventDefault();
    
    if (!email) {
      alert('メールアドレスを入力してください');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || 'Admin User' })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to register admin user');
      }
      
      const data = await res.json();
      await fetchUsers();
      
      setEmail('');
      setName('');
      alert(data.message || '管理者ユーザーを登録しました');
    } catch (error) {
      console.error('Error registering admin user:', error);
      alert(`管理者の登録に失敗しました: ${error.message}`);
    }
  }
  
  if (status === 'loading' || loading) {
    return <div className="text-center p-10">読み込み中...</div>;
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">ユーザー管理</h1>
      
      {/* 管理者登録フォーム */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">管理者ユーザー登録</h2>
        <form onSubmit={registerAdmin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス*
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名前
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="管理者名"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            管理者を登録する
          </button>
        </form>
      </div>
      
      {/* ユーザー一覧 */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">ユーザー一覧</h2>
        {users.length === 0 ? (
          <p className="text-center py-4">ユーザーが見つかりません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">名前</th>
                  <th className="p-2 border">メールアドレス</th>
                  <th className="p-2 border">権限</th>
                  <th className="p-2 border">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{user.id}</td>
                    <td className="p-2 border">{user.name || '-'}</td>
                    <td className="p-2 border">{user.email || '-'}</td>
                    <td className="p-2 border">
                      <span className={`px-2 py-1 rounded ${
                        user.role === 'ADMIN' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        {user.role === 'ADMIN' ? '管理者' : '一般'}
                      </span>
                    </td>
                    <td className="p-2 border">
                      {user.role === 'ADMIN' ? (
                        <button
                          onClick={() => toggleAdminRole(user.id, false)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                        >
                          一般ユーザーに変更
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleAdminRole(user.id, true)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        >
                          管理者に設定
                        </button>
                      )}
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