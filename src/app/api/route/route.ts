import { NextResponse } from 'next/server';

// Google Maps Directions APIのレスポンス型を定義
interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: { value: number };
      duration: { value: number };
      steps: Array<{
        toll_road?: boolean;
        highway?: boolean;
      }>;
    }>;
  }>;
}

export async function POST(request: Request) {
  try {
    const { start, end } = await request.json();

    // Google Maps Directions APIのエンドポイントを直接呼び出す
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('APIキーが設定されていません');
      throw new Error('Google Maps APIキーが設定されていません');
    }

    // 車でのルートを取得
    const drivingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&mode=driving&key=${apiKey}&language=ja`;
    const drivingResponse = await fetch(drivingUrl);
    const drivingData = await drivingResponse.json();

    if (drivingData.status !== 'OK') {
      console.error('Google Maps APIエラー:', drivingData.status, drivingData.error_message);
      throw new Error(`Google Maps APIエラー: ${drivingData.status} - ${drivingData.error_message || '不明なエラー'}`);
    }

    // 徒歩でのルートを取得
    const walkingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&mode=walking&key=${apiKey}&language=ja`;
    const walkingResponse = await fetch(walkingUrl);
    const walkingData = await walkingResponse.json();

    if (walkingData.status !== 'OK') {
      console.error('Google Maps APIエラー:', walkingData.status, walkingData.error_message);
      throw new Error(`Google Maps APIエラー: ${walkingData.status} - ${walkingData.error_message || '不明なエラー'}`);
    }

    // ルート情報を整形
    const routeInfo = {
      distance: drivingData.routes[0].legs[0].distance.value,
      duration: {
        driving: drivingData.routes[0].legs[0].duration.value,
        walking: walkingData.routes[0].legs[0].duration.value,
      },
      isTollRoad: drivingData.routes[0].legs[0].steps.some((step: any) => 
        step.toll_road || step.highway
      ),
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