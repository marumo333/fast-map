import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 許可するオリジンを列挙
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://fast-map-five.vercel.app'
];

// CORSヘッダーを設定する関数
function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

export function middleware(request: NextRequest) {
  // デバッグログ
  console.log('Request details:', {
    pathname: request.nextUrl.pathname,
    method: request.method,
    origin: request.headers.get('origin'),
    headers: Object.fromEntries(request.headers.entries())
  });

  const origin = request.headers.get('origin');
  
  // オリジンの検証
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    console.log('許可されていないオリジン:', origin);
    return new NextResponse(null, { status: 403 });
  }

  // APIルートへのリクエストの場合のみCORSヘッダーを設定
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const headers = getCorsHeaders(origin);

    // プリフライトリクエストの場合は204を返す
    if (request.method === 'OPTIONS') {
      console.log('Handling OPTIONS request with headers:', headers);
      return new NextResponse(null, {
        status: 204,
        headers
      });
    }

    // 通常のリクエストの場合はCORSヘッダーを設定
    const response = NextResponse.next();
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    return response;
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: '/api/:path*'
}; 