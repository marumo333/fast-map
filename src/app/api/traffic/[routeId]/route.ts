import { NextRequest, NextResponse } from 'next/server';

type TrafficInfo = {
  routeId: number;
  congestion: number;
  delay: number;
  lastUpdated: string;
};

// キャッシュの実装
const trafficCache = new Map<number, {
  info: TrafficInfo;
  timestamp: number;
}>();

const CACHE_DURATION = 30 * 1000; // 30秒

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
  const cachedData = trafficCache.get(routeId);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return NextResponse.json({
      ...cachedData.info,
      fromCache: true
    });
  }

  try {
    // 実際の交通情報APIを呼び出す
    const response = await fetch(
      `https://api.example.com/traffic/${routeId}`
    );

    if (!response.ok) {
      throw new Error('交通情報APIの呼び出しに失敗しました');
    }

    const data = await response.json();

    // 交通情報をキャッシュに保存
    const trafficInfo: TrafficInfo = {
      routeId,
      congestion: data.congestion,
      delay: data.delay,
      lastUpdated: new Date().toISOString()
    };

    trafficCache.set(routeId, {
      info: trafficInfo,
      timestamp: Date.now()
    });

    return NextResponse.json({
      ...trafficInfo,
      fromCache: false
    });
  } catch (error) {
    console.error('交通情報取得エラー:', error);
    return NextResponse.json(
      { error: '交通情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 