import { NextResponse } from 'next/server';

type Route = {
  routeId: number;
  path: [number, number][];
  distance: number;
  duration: number;
};

// キャッシュの実装
const routeCache = new Map<string, {
  routes: Route[];
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5分

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startLat = searchParams.get('startLat');
  const startLng = searchParams.get('startLng');
  const endLat = searchParams.get('endLat');
  const endLng = searchParams.get('endLng');

  if (!startLat || !startLng || !endLat || !endLng) {
    return NextResponse.json(
      { error: '出発地と目的地の座標が必要です' },
      { status: 400 }
    );
  }

  // キャッシュキーの生成
  const cacheKey = `${startLat},${startLng}-${endLat},${endLng}`;
  const cachedData = routeCache.get(cacheKey);

  // キャッシュが有効な場合はキャッシュから返す
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      routes: cachedData.routes,
      fromCache: true
    });
  }

  try {
    // 実際のルート検索APIを呼び出す
    const response = await fetch(
      `https://api.example.com/routes?startLat=${startLat}&startLng=${startLng}&endLat=${endLat}&endLng=${endLng}`
    );

    if (!response.ok) {
      throw new Error('ルート検索APIの呼び出しに失敗しました');
    }

    const data = await response.json();

    // ルートデータをキャッシュに保存
    routeCache.set(cacheKey, {
      routes: data.routes,
      timestamp: Date.now()
    });

    return NextResponse.json({
      routes: data.routes,
      fromCache: false
    });
  } catch (error) {
    console.error('ルート検索エラー:', error);
    return NextResponse.json(
      { error: 'ルートの検索に失敗しました' },
      { status: 500 }
    );
  }
} 