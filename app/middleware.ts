import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userId = request.cookies.get('userId');
  const isLoginPage = request.nextUrl.pathname === '/login';

  // ログインページにアクセスする場合
  if (isLoginPage) {
    // すでにログインしている場合はホームページにリダイレクト
    if (userId) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // ログインページ以外にアクセスする場合
  if (!userId) {
    // ログインしていない場合はログインページにリダイレクト
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 