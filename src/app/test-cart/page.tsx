"use client";

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function TestCartPage() {
  const { data: session } = useSession();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAddToCart = async () => {
    setLoading(true);
    try {
      console.log('Session:', session);
      
      const response = await fetch('/api/cart/gwzfl-hsy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: 1,
          isSample: false
        })
      });

      const data = await response.json();
      console.log('Response:', response.status, data);
      
      setResult({
        status: response.status,
        data: data
      });
    } catch (error) {
      console.error('Error:', error);
      setResult({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testSimpleCart = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // レスポンスのテキストを取得してからJSONパースを試行
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        setResult({
          error: 'JSON parse failed',
          responseText: responseText,
          status: response.status
        });
        return;
      }
      
      setResult({
        status: response.status,
        data: data
      });
    } catch (error) {
      console.error('Error:', error);
      setResult({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetCart = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      
      setResult({
        status: response.status,
        data: data
      });
    } catch (error) {
      console.error('Error:', error);
      setResult({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testDbConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      
      setResult({
        status: response.status,
        data: data
      });
    } catch (error) {
      console.error('Error:', error);
      setResult({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testEnv = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-env');
      const data = await response.json();
      
      setResult({
        status: response.status,
        data: data
      });
    } catch (error) {
      console.error('Error:', error);
      setResult({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">カート機能テスト</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">セッション情報</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={testEnv}
          disabled={loading}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? '処理中...' : '環境変数テスト'}
        </button>
        
        <button
          onClick={testDbConnection}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? '処理中...' : 'DB接続テスト'}
        </button>
        
        <button
          onClick={testSimpleCart}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? '処理中...' : '簡単テスト（DB商品）'}
        </button>
        
        <button
          onClick={testAddToCart}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '処理中...' : 'MicroCMS商品テスト'}
        </button>
        
        <button
          onClick={testGetCart}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? '処理中...' : 'カート取得テスト'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">API結果</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}