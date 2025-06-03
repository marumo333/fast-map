import { NextRequest, NextResponse } from 'next/server';

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
const MAX_RETRIES = 3; // 最大リトライ回数
const RETRY_DELAY = 1000; // リトライ間隔（ミリ秒）

// 混雑度の判定
const getCongestionLevel = (severity: number): string => {
  if (severity <= 1) return 'スムーズ';
  if (severity <= 2) return 'やや混雑';
  if (severity <= 3) return '混雑';
  return '大混雑';
};

// リトライ付きのfetch関数
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (response.ok) return response;

    // エラーレスポンスの詳細を取得
    const errorText = await response.text();
    console.error('API呼び出しエラー:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      url,
      retriesLeft: retries
    });

    // リトライ可能なエラーの場合
    if (retries > 0 && (
      response.status === 429 || // Too Many Requests
      response.status === 500 || // Internal Server Error
      response.status === 503    // Service Unavailable
    )) {
      console.log(`${RETRY_DELAY}ms後にリトライします...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }

    throw new Error(`API呼び出しに失敗しました: ${response.status} ${response.statusText}`);
  } catch (error) {
    if (retries > 0) {
      console.log(`${RETRY_DELAY}ms後にリトライします...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

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
    console.error('無効なルートID:', params.routeId);
    return NextResponse.json(
      { error: '無効なルートIDです' },
      { 
        status: 400,
        headers: getCorsHeaders(origin)
      }
    );
  }

  // キャッシュをチェック
  const cachedData = trafficCache.get(routeId);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log('キャッシュから交通情報を返却:', routeId);
    return NextResponse.json({
      ...cachedData.info,
      fromCache: true
    });
  }

  try {
    console.log('ルート情報を取得開始:', routeId);
    // ルート情報を取得
    const routeUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'}/route?routeId=${routeId}`;
    console.log('ルート情報取得URL:', routeUrl);

    const routeResponse = await fetchWithRetry(routeUrl);
    const routeData = await routeResponse.json();
    console.log('ルート情報を取得完了:', routeData);

    if (!routeData.routes || !Array.isArray(routeData.routes) || routeData.routes.length === 0) {
      console.error('ルートが見つかりません:', routeData);
      throw new Error('ルートが見つかりません');
    }

    const route = routeData.routes[0];
    if (!route.path || !Array.isArray(route.path) || route.path.length === 0) {
      console.error('ルートのパスが無効です:', route);
      throw new Error('ルートのパスが無効です');
    }

    // パスの最初と最後の点を取得
    const startPoint = route.path[0];
    const endPoint = route.path[route.path.length - 1];

    // 座標の検証
    if (!Array.isArray(startPoint) || startPoint.length !== 2 || 
        !Array.isArray(endPoint) || endPoint.length !== 2) {
      console.error('無効な座標形式:', { startPoint, endPoint });
      throw new Error('無効な座標形式です');
    }

    // 座標の範囲チェック
    const isValidCoordinate = (lat: number, lng: number) => {
      return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    };

    if (!isValidCoordinate(startPoint[0], startPoint[1]) || 
        !isValidCoordinate(endPoint[0], endPoint[1])) {
      console.error('座標が範囲外です:', { startPoint, endPoint });
      throw new Error('座標が範囲外です');
    }

    console.log('Google Maps Traffic APIを呼び出し開始:', {
      start: startPoint,
      end: endPoint
    });

    // Google Maps Traffic APIを呼び出す
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps APIキーが設定されていません');
      throw new Error('Google Maps APIキーが設定されていません');
    }

    // 座標を文字列に変換（小数点以下6桁まで）
    const formatCoordinate = (coord: number) => coord.toFixed(6);
    const origin = `${formatCoordinate(startPoint[0])},${formatCoordinate(startPoint[1])}`;
    const destination = `${formatCoordinate(endPoint[0])},${formatCoordinate(endPoint[1])}`;

    const trafficUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&departure_time=now&traffic_model=best_guess&key=${apiKey}`;
    console.log('Google Maps Traffic API URL:', trafficUrl);

    const response = await fetchWithRetry(trafficUrl);
    const data = await response.json();
    console.log('Google Maps Traffic APIの応答:', data);

    if (data.status === 'ZERO_RESULTS') {
      console.error('ルートが見つかりません:', {
        origin,
        destination,
        status: data.status,
        error_message: data.error_message
      });
      throw new Error('指定された地点間でルートが見つかりません');
    }

    if (data.status !== 'OK') {
      console.error('Google Maps Traffic APIエラー:', {
        status: data.status,
        error_message: data.error_message,
        origin,
        destination
      });
      throw new Error(`Google Maps Traffic APIエラー: ${data.status}${data.error_message ? ` - ${data.error_message}` : ''}`);
    }

    // 交通情報を生成
    const routeInfo = data.routes[0];
    if (!routeInfo || !routeInfo.legs || !routeInfo.legs[0]) {
      console.error('無効なルート情報:', routeInfo);
      throw new Error('無効なルート情報です');
    }

    const durationInTraffic = routeInfo.legs[0].duration_in_traffic?.value || routeInfo.legs[0].duration.value;
    const duration = routeInfo.legs[0].duration.value;
    const delay = Math.max(0, Math.round((durationInTraffic - duration) / 60)); // 分単位の遅延

    const trafficInfo: TrafficInfo = {
      routeId,
      congestion: getCongestionLevel(Math.ceil(delay / 5)), // 5分ごとに混雑度を上げる
      delay,
      lastUpdated: new Date().toISOString()
    };

    console.log('交通情報を生成:', trafficInfo);

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
      { 
        error: error instanceof Error ? error.message : '交通情報の取得に失敗しました',
        details: error instanceof Error ? error.stack : undefined
      },
      { 
        status: 500,
        headers: getCorsHeaders(origin)
      }
    );
  }
} 