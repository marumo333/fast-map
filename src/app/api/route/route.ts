import { NextResponse } from 'next/server';

// ポリラインのデコード関数
function decodePolyline(encoded: string): [number, number][] {
  const poly: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      let b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (result >= 0x20);

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lat * 1e-5, lng * 1e-5]);
  }

  return poly;
}

// Google Maps Directions APIのレスポンス型を定義
interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: { value: number };
      duration: { value: number };
      steps: Array<{
        polyline: { points: string };
        toll_road?: boolean;
        highway?: boolean;
      }>;
    }>;
  }>;
}

export async function POST(request: Request) {
  try {
    const { start, end } = await request.json();

    if (!start || !end || typeof start.lat !== 'number' || typeof start.lng !== 'number' || 
        typeof end.lat !== 'number' || typeof end.lng !== 'number') {
      return NextResponse.json(
        { error: '無効な座標が指定されました' },
        { status: 400 }
      );
    }

    // Google Maps Directions APIのエンドポイントを直接呼び出す
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('APIキーが設定されていません');
      return NextResponse.json(
        { error: 'Google Maps APIキーが設定されていません' },
        { status: 500 }
      );
    }

    // 車でのルートを取得
    const drivingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&mode=driving&key=${apiKey}&language=ja`;
    const drivingResponse = await fetch(drivingUrl);
    const drivingData = await drivingResponse.json();

    if (drivingData.status !== 'OK') {
      console.error('Google Maps APIエラー:', drivingData.status, drivingData.error_message);
      return NextResponse.json(
        { error: `Google Maps APIエラー: ${drivingData.status} - ${drivingData.error_message || '不明なエラー'}` },
        { status: 500 }
      );
    }

    // 徒歩でのルートを取得
    const walkingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&mode=walking&key=${apiKey}&language=ja`;
    const walkingResponse = await fetch(walkingUrl);
    const walkingData = await walkingResponse.json();

    if (walkingData.status !== 'OK') {
      console.error('Google Maps APIエラー:', walkingData.status, walkingData.error_message);
      return NextResponse.json(
        { error: `Google Maps APIエラー: ${walkingData.status} - ${walkingData.error_message || '不明なエラー'}` },
        { status: 500 }
      );
    }

    // ルートの詳細なパス情報を取得
    const route = drivingData.routes[0];
    const path: [number, number][] = [];

    // 各ステップのパスを結合
    route.legs[0].steps.forEach((step: any) => {
      // ポリラインをデコード
      const decodedPath = decodePolyline(step.polyline.points);
      // パスを追加
      path.push(...decodedPath);
    });

    // ルート情報を整形
    const routeInfo = {
      distance: route.legs[0].distance.value,
      duration: {
        driving: route.legs[0].duration.value,
        walking: walkingData.routes[0].legs[0].duration.value,
      },
      isTollRoad: route.legs[0].steps.some((step: any) => 
        step.toll_road || step.highway
      ),
      path: path
    };

    return NextResponse.json(routeInfo);
  } catch (error) {
    console.error('ルート情報取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ルート情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 