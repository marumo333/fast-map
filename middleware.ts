import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 許可するオリジンのリスト
const allowedOrigins = [
  'https://fast-map-five.vercel.app',
  'http://localhost:3000'
];

// CORSヘッダーを設定する関数
function getCorsHeaders(origin: string | null) {
  // オリジンの検証
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  const finalOrigin = isAllowedOrigin ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': finalOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24時間
    'Vary': 'Origin'
  };
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  console.log('リクエストのオリジン:', origin);
  console.log('リクエストのパス:', request.nextUrl.pathname);
  console.log('リクエストのメソッド:', request.method);

  // OPTIONSリクエストの処理
  if (request.method === 'OPTIONS') {
    console.log('OPTIONSリクエストを処理中');
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin)
    });
  }

  // 通常のリクエストの処理
  const response = NextResponse.next();
  const headers = getCorsHeaders(origin);
  
  // レスポンスヘッダーを設定
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  console.log('設定されたCORSヘッダー:', headers);
  return response;
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    '/api/:path*',
    '/route/:path*'
  ]
}; 