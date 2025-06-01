import { NextRequest, NextResponse } from 'next/server';
import { Route } from '../../../types/route';

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
  const routeId = parseInt(params.routeId, 10);

  if (isNaN(routeId)) {
    return NextResponse.json(
      { error: '無効なルートIDです' },
      { status: 400 }
    );
  }

  // キャッシュをチェック
  const cachedData = routeCache.get(routeId);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      ...cachedData.route,
      fromCache: true
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
    });
  } catch (error) {
    console.error('ルート情報取得エラー:', error);
    return NextResponse.json(
      { error: 'ルート情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 