//app/api/route/[routeId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Route } from '../../../types/route';

// 許可するオリジンを列挙
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://fast-map-five.vercel.app',
  'https://fast-6ir0sv4r8-marumo333s-projects.vercel.app'
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

// プリフライトリクエストのハンドラ
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, { 
    status: 204,
    headers: getCorsHeaders(origin)
  });
}

// キャッシュの実装
const routeCache = new Map<number, {
  route: Route;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5分

export async function GET(
  request: NextRequest,
  { params }: { params: { routeId: string } }
) {
  const origin = request.headers.get('origin');
  
  // オリジンの検証
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: '許可されていないオリジンからのリクエストです' },
      { 
        status: 403,
        headers: getCorsHeaders(origin)
      }
    );
  }

  const routeId = parseInt(params.routeId, 10);

  if (isNaN(routeId)) {
    return NextResponse.json(
      { error: '無効なルートIDです' },
      { 
        status: 400,
        headers: getCorsHeaders(origin)
      }
    );
  }

  // キャッシュをチェック
  const cachedData = routeCache.get(routeId);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      ...cachedData.route,
      fromCache: true
    }, {
      headers: getCorsHeaders(origin)
    });
  }

  try {
    // ルート情報を取得
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'}/route?routeId=${routeId}`
    );

    if (!response.ok) {
      throw new Error('ルート情報の取得に失敗しました');
    }

    const data = await response.json();
    const route = data.routes.find((r: Route) => r.routeId === routeId);

    if (!route) {
      throw new Error('ルートが見つかりません');
    }

    // ルート情報をキャッシュに保存
    routeCache.set(routeId, {
      route,
      timestamp: Date.now()
    });

    return NextResponse.json({
      ...route,
      fromCache: false
    }, {
      headers: getCorsHeaders(origin)
    });
  } catch (error) {
    console.error('ルート情報取得エラー:', error);
    return NextResponse.json(
      { error: 'ルート情報の取得に失敗しました' },
      { 
        status: 500,
        headers: getCorsHeaders(origin)
      }
    );
  }
} 