import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // 管理者ページへのアクセス制御
    if (pathname.startsWith('/admin')) {
      if (!token?.isAdmin) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      
      // スーパー管理者専用ページ
      if (pathname.startsWith('/admin/admins') && token?.email !== 'rikumatsumoto.2003@gmail.com') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // 管理者ページは認証が必要
        if (pathname.startsWith('/admin')) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*'
  ]
};