import { NextResponse } from 'next/server';
import { Location } from '@/types/location';

// ポリラインをデコードする関数
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
  status: string;
  error_message?: string;
  routes: {
    legs: {
      steps: {
        polyline: {
          points: string;
        };
        toll_road: boolean;
      }[];
      distance: {
        value: number;
      };
      duration: {
        value: number;
      };
    }[];
  }[];
}

export async function POST(request: Request) {
  try {
    const { start, end } = await request.json();

    if (!start || !end) {
      return NextResponse.json(
        { error: '出発地と目的地の座標が必要です' },
        { status: 400 }
      );
    }

    // APIキーの確認
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps APIキーが設定されていません');
      return NextResponse.json(
        { error: 'Google Maps APIキーが設定されていません' },
        { status: 500 }
      );
    }

    // 車でのルートを取得
    const drivingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&mode=driving&key=${apiKey}&language=ja`;
    console.log('車でのルート取得URL:', drivingUrl);

    const drivingResponse = await fetch(drivingUrl);
    const drivingData = await drivingResponse.json();

    if (drivingData.status !== 'OK') {
      console.error('Google Maps APIエラー:', drivingData.status, drivingData.error_message);
      return NextResponse.json(
        { error: `Google Maps APIエラー: ${drivingData.status} - ${drivingData.error_message || '不明なエラー'}` },
        { status: 500 }
      );
    }

    const drivingResult = drivingData as DirectionsResult;
    const drivingRoute = drivingResult.routes[0].legs[0];

    // 徒歩でのルートを取得
    const walkingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}&mode=walking&key=${apiKey}&language=ja`;
    console.log('徒歩でのルート取得URL:', walkingUrl);

    const walkingResponse = await fetch(walkingUrl);
    const walkingData = await walkingResponse.json();

    if (walkingData.status !== 'OK') {
      console.error('Google Maps APIエラー:', walkingData.status, walkingData.error_message);
      return NextResponse.json(
        { error: `Google Maps APIエラー: ${walkingData.status} - ${walkingData.error_message || '不明なエラー'}` },
        { status: 500 }
      );
    }

    const walkingResult = walkingData as DirectionsResult;
    const walkingRoute = walkingResult.routes[0].legs[0];

    // ポリラインをデコードしてパスを構築
    const path: [number, number][] = [];
    let isTollRoad = false;

    drivingRoute.steps.forEach(step => {
      const decodedPoints = decodePolyline(step.polyline.points);
      path.push(...decodedPoints);
      if (step.toll_road) {
        isTollRoad = true;
      }
    });

    return NextResponse.json({
      path,
      distance: drivingRoute.distance.value,
      duration: {
        driving: drivingRoute.duration.value,
        walking: walkingRoute.duration.value
      },
      isTollRoad
    });
  } catch (error) {
    console.error('ルート情報の取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ルート情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 