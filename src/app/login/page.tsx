"use client";
import { useEffect, useState } from 'react';
import { getProviders, signIn, ClientSafeProvider, LiteralUnion } from "next-auth/react";
import Image from 'next/image';

// eslint-disable-next-line @next/next/no-async-client-component
const Login = () => {
  const [providers, setProviders] = useState<Record<LiteralUnion<string>, ClientSafeProvider> | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };

    fetchProviders();
  }, []);

  return (
    <div className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            アカウントにログイン
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          {providers &&
          Object.values(providers).map((provider) => {
            return (<div key={provider.id} className="text-center">
            <button onClick={() => signIn(provider.id, { callbackUrl: "" })} className="bg-[#06C755] hover:bg-[#06C755] hover:opacity-90 text-white font-bold py-2 px-4 rounded flex items-center justify-center w-full">
            <Image
                src="/btn_base.png" // 公式のLINEアイコンのPNGファイルのパス
                alt="LINE icon"
                width={24}
                height={24}
                className="w-6 h-6 mr-2"
              />
              <span>LINEでログイン</span>
            </button>
          </div>
          );            
          })}
          
        </div>
      </div>
    </div>
  );
}

export default Login;