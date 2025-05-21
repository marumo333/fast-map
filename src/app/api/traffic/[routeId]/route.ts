import { NextRequest, NextResponse } from 'next/server';

type TrafficInfo = {
  routeId: number;
  congestion: string;
  delay: number;
  lastUpdated: string;
};

// キャッシュの実装
const trafficCache = new Map<number, {
  info: TrafficInfo;
  timestamp: number;
}>();

const CACHE_DURATION = 30 * 1000; // 30秒

// 混雑度の判定
const getCongestionLevel = (severity: number): string => {
  if (severity <= 1) return 'スムーズ';
  if (severity <= 2) return 'やや混雑';
  if (severity <= 3) return '混雑';
  return '大混雑';
};

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
    // Google Maps Traffic APIを呼び出す
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/traffic/json?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Google Maps Traffic APIの呼び出しに失敗しました');
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps Traffic APIエラー: ${data.status}`);
    }

    // 交通情報を生成
    const trafficInfo: TrafficInfo = {
      routeId,
      congestion: getCongestionLevel(data.severity || 1),
      delay: Math.round(data.delay || 0),
      lastUpdated: new Date().toISOString()
    };

    // 交通情報をキャッシュに保存
    trafficCache.set(routeId, {
      info: trafficInfo,
      timestamp: Date.now()
    });

    return NextResponse.json({
      ...trafficInfo,
      fromCache: false
    });
  } catch (error) {
    console.error('交通情報の取得に失敗しました:', error);
    return NextResponse.json(
      { error: '交通情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 