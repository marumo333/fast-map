import { NextResponse } from 'next/server';
import { Location } from '@/types/location';
import { Client, TravelMode, TrafficModel } from '@googlemaps/google-maps-services-js';

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
        toll_road?: boolean;
      }[];
      distance: {
        value: number;
      };
      duration: {
        value: number;
      };
      duration_in_traffic?: {
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

    const directionsService = new Client({});

    const drivingData = await directionsService.directions({
      params: {
        origin: start,
        destination: end,
        mode: 'driving' as TravelMode,
        alternatives: true,
        departure_time: new Date(),
        traffic_model: 'best_guess' as TrafficModel,
        key: apiKey
      }
    });

    if (drivingData.data.status === 'ZERO_RESULTS') {
      console.error('車でのルートが見つかりませんでした:', drivingData);
      return NextResponse.json(
        { error: '指定された地点間の車でのルートが見つかりませんでした。' },
        { status: 404 }
      );
    }

    if (drivingData.data.status !== 'OK') {
      console.error('車でのルート検索エラー:', drivingData);
      return NextResponse.json(
        { error: `車でのルート検索に失敗しました: ${drivingData.data.status}` },
        { status: 500 }
      );
    }

    const walkingData = await directionsService.directions({
      params: {
        origin: start,
        destination: end,
        mode: 'walking' as TravelMode,
        alternatives: true,
        key: apiKey
      }
    });

    if (walkingData.data.status === 'ZERO_RESULTS') {
      console.error('徒歩でのルートが見つかりませんでした:', walkingData);
      return NextResponse.json(
        { error: '指定された地点間の徒歩でのルートが見つかりませんでした。' },
        { status: 404 }
      );
    }

    if (walkingData.data.status !== 'OK') {
      console.error('徒歩でのルート検索エラー:', walkingData);
      return NextResponse.json(
        { error: `徒歩でのルート検索に失敗しました: ${walkingData.data.status}` },
        { status: 500 }
      );
    }

    const drivingResult = drivingData.data as unknown as DirectionsResult;
    const drivingRoute = drivingResult.routes[0].legs[0];

    const walkingResult = walkingData.data as unknown as DirectionsResult;
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
      isTollRoad,
      routeId: 1, // デフォルトのルートID
      trafficInfo: [{
        duration_in_traffic: drivingRoute.duration_in_traffic?.value || drivingRoute.duration.value,
        traffic_level: drivingRoute.duration_in_traffic ? '混雑' : '通常'
      }]
    });
  } catch (error) {
    console.error('ルート情報の取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ルート情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 