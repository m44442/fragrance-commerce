"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        const response = await fetch('/api/debug/user');
        const data = await response.json();
        setDebugData(data);
      } catch (error) {
        console.error('Debug fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading debug data...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Session Status: {status}</h2>
          <pre className="bg-white p-3 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">API Debug Data</h2>
          <pre className="bg-white p-3 rounded text-sm overflow-auto">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Admin Check</h2>
          <p>Is Admin (Session): {(session?.user as any)?.isAdmin ? 'Yes' : 'No'}</p>
          <p>Is Admin (DB): {debugData?.dbUser?.isAdmin ? 'Yes' : 'No'}</p>
          <p>Role (Session): {(session?.user as any)?.role || 'None'}</p>
          <p>Role (DB): {debugData?.dbUser?.role || 'None'}</p>
        </div>
      </div>
    </div>
  );
}