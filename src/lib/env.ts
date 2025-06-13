// src/lib/env.ts
export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // クライアントサイド
    return window.location.origin;
  }
  
  // サーバーサイド
  if (process.env.VERCEL_URL) {
    // Vercel環境
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NEXTAUTH_URL) {
    // カスタム設定
    return process.env.NEXTAUTH_URL;
  }
  
  // ローカル開発環境
  return 'http://localhost:3000';
};

export const getApiUrl = () => {
  return `${getBaseUrl()}/api`;
};