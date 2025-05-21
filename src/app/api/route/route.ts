import { NextRequest, NextResponse } from 'next/server';
import { Route } from '@/types/route';

// キャッシュの実装
const routeCache = new Map<string, {
  routes: Route[];
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5分

// リトライ付きのfetch関数
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (response.ok) return response;

    const errorText = await response.text();
    console.error('API呼び出しエラー:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      url,
      retriesLeft: retries
    });

    if (retries > 0 && (
      response.status === 429 || // Too Many Requests
      response.status === 500 || // Internal Server Error
      response.status === 503    // Service Unavailable
    )) {
      console.log('1秒後にリトライします...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }

    throw new Error(`API呼び出しに失敗しました: ${response.status} ${response.statusText}`);
  } catch (error) {
    if (retries > 0) {
      console.log('1秒後にリトライします...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startLat = searchParams.get('startLat');
  const startLng = searchParams.get('startLng');
  const endLat = searchParams.get('endLat');
  const endLng = searchParams.get('endLng');
  const routeId = searchParams.get('routeId');

  console.log('ルート検索リクエスト:', {
    startLat,
    startLng,
    endLat,
    endLng,
    routeId
  });

  // routeIdが指定されている場合は、そのルートのみを返す
  if (routeId) {
    const routeIdNum = parseInt(routeId, 10);
    if (isNaN(routeIdNum)) {
      console.error('無効なルートID:', routeId);
      return NextResponse.json(
        { error: '無効なルートIDです' },
        { status: 400 }
      );
    }

    // キャッシュから該当するルートを探す
    const cachedRoutes = Array.from(routeCache.values());
    for (const cache of cachedRoutes) {
      const route = cache.routes.find((r: Route) => r.routeId === routeIdNum);
      if (route) {
        console.log('キャッシュからルートを返却:', routeIdNum);
        return NextResponse.json({
          routes: [route],
          fromCache: true
        });
      }
    }

    // キャッシュになければ、Google Maps APIを呼び出す
    if (startLat && startLng && endLat && endLng) {
      try {
        console.log('Google Maps Directions APIを呼び出し開始（routeId指定）');
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('Google Maps APIキーが設定されていません');
        }

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&alternatives=true&key=${apiKey}`;
        const response = await fetchWithRetry(url);
        const data = await response.json();

        if (data.status !== 'OK') {
          throw new Error(`Google Maps Directions APIエラー: ${data.status}`);
        }

        // ルートデータを変換
        const routes: Route[] = data.routes.map((route: any, index: number) => {
          const path: [number, number][] = [];
          route.legs.forEach((leg: any) => {
            leg.steps.forEach((step: any) => {
              const points = step.polyline.points;
              let index = 0;
              let lat = 0;
              let lng = 0;

              while (index < points.length) {
                let shift = 0;
                let result = 0;

                do {
                  let b = points.charCodeAt(index++) - 63;
                  result |= (b & 0x1f) << shift;
                  shift += 5;
                } while (result >= 0x20);

                let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
                lat += dlat;

                shift = 0;
                result = 0;

                do {
                  let b = points.charCodeAt(index++) - 63;
                  result |= (b & 0x1f) << shift;
                  shift += 5;
                } while (result >= 0x20);

                let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
                lng += dlng;

                path.push([lat * 1e-5, lng * 1e-5]);
              }
            });
          });

          const isTollRoad = route.legs.some((leg: any) => leg.toll_road === true);

          return {
            routeId: index + 1,
            path,
            distance: route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0),
            duration: route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0),
            isTollRoad
          };
        });

        // 指定されたrouteIdのルートを探す
        const targetRoute = routes.find(r => r.routeId === routeIdNum);
        if (!targetRoute) {
          throw new Error('指定されたルートが見つかりません');
        }

        // キャッシュに保存
        const cacheKey = `${startLat},${startLng}-${endLat},${endLng}`;
        routeCache.set(cacheKey, {
          routes,
          timestamp: Date.now()
        });

        return NextResponse.json({
          routes: [targetRoute],
          fromCache: false
        });
      } catch (error) {
        console.error('ルート検索エラー:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'ルートの検索に失敗しました' },
          { status: 500 }
        );
      }
    }

    console.error('ルートが見つかりません:', routeIdNum);
    return NextResponse.json(
      { error: 'ルートが見つかりません' },
      { status: 404 }
    );
  }

  // 通常のルート検索
  if (!startLat || !startLng || !endLat || !endLng) {
    console.error('座標が不足しています:', { startLat, startLng, endLat, endLng });
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
    console.log('キャッシュからルートを返却:', cacheKey);
    return NextResponse.json({
      routes: cachedData.routes,
      fromCache: true
    });
  }

  try {
    console.log('Google Maps Directions APIを呼び出し開始');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps APIキーが設定されていません');
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&alternatives=true&key=${apiKey}`;
    const response = await fetchWithRetry(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps Directions APIエラー: ${data.status}`);
    }

    // ルートデータを変換
    const routes: Route[] = data.routes.map((route: any, index: number) => {
      const path: [number, number][] = [];
      route.legs.forEach((leg: any) => {
        leg.steps.forEach((step: any) => {
          const points = step.polyline.points;
          let index = 0;
          let lat = 0;
          let lng = 0;

          while (index < points.length) {
            let shift = 0;
            let result = 0;

            do {
              let b = points.charCodeAt(index++) - 63;
              result |= (b & 0x1f) << shift;
              shift += 5;
            } while (result >= 0x20);

            let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            shift = 0;
            result = 0;

            do {
              let b = points.charCodeAt(index++) - 63;
              result |= (b & 0x1f) << shift;
              shift += 5;
            } while (result >= 0x20);

            let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            path.push([lat * 1e-5, lng * 1e-5]);
          }
        });
      });

      const isTollRoad = route.legs.some((leg: any) => leg.toll_road === true);

      return {
        routeId: index + 1,
        path,
        distance: route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0),
        duration: route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0),
        isTollRoad
      };
    });

    console.log('ルートデータを生成:', routes);

    // ルートデータをキャッシュに保存
    routeCache.set(cacheKey, {
      routes,
      timestamp: Date.now()
    });

    return NextResponse.json({
      routes,
      fromCache: false
    });
  } catch (error) {
    console.error('ルート検索エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ルートの検索に失敗しました' },
      { status: 500 }
    );
  }
} 