// app/api/route/route.ts
import { NextResponse } from 'next/server';
import { Client, TravelMode, TrafficModel, TravelRestriction, Language } from '@googlemaps/google-maps-services-js';
import type { NextRequest } from 'next/server';

function decodePolyline(encoded: string): [number, number][] {
  const poly: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let shift = 0, result = 0;
    let b;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    poly.push([lat * 1e-5, lng * 1e-5]);
  }
  return poly;
}

// プリフライトリクエストのハンドラ
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204 });
}

// POSTハンドラ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { start, end } = body;

    if (
      !start || !end ||
      typeof start.lat !== 'number' || typeof start.lng !== 'number' ||
      typeof end.lat !== 'number' || typeof end.lng !== 'number'
    ) {
      return NextResponse.json(
        { error: '出発地と目的地の座標が不正です。' },
        { status: 400 }
      );
    }

    // サーバー用キーを取得
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is not set');
      return NextResponse.json(
        { error: 'Google Maps API key is not configured' },
        { status: 500 }
      );
    }
    if (!apiKey.startsWith('AIza')) {
      console.error('Invalid API key format');
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 500 }
      );
    }

    const directionsService = new Client({});
    const statusMap: Record<string, number> = {
      'NOT_FOUND': 404,
      'ZERO_RESULTS': 404,
      'REQUEST_DENIED': 403,
      'INVALID_REQUEST': 400,
      'OVER_QUERY_LIMIT': 429,
    };

    console.log('ルート検索開始:', { start, end });

    try {
      // --- 車モードのルート取得 ---
      const drivingRes = await directionsService.directions({
        params: {
          origin: start,
          destination: end,
          mode: 'driving' as TravelMode,
          departure_time: new Date(),
          traffic_model: 'best_guess' as TrafficModel,
          region: 'jp',
          language: 'ja' as Language,
          key: apiKey,
          avoid: ['ferries'] as TravelRestriction[],
          alternatives: true,
          waypoints: [],
        },
      });

      console.log('車ルート検索結果:', {
        status: drivingRes.data.status,
        error_message: drivingRes.data.error_message,
        routes: drivingRes.data.routes?.length || 0
      });

      const drivingStatus = drivingRes.data.status;
      if (drivingStatus !== 'OK') {
        if (statusMap[drivingStatus]) {
          console.warn('車ルートエラー:', {
            status: drivingStatus,
            error_message: drivingRes.data.error_message
          });
          return NextResponse.json(
            {
              error: `車ルート取得失敗: ${drivingStatus}`,
              details: drivingRes.data.error_message || '不明なエラー'
            },
            { status: statusMap[drivingStatus] }
          );
        } else {
          throw new Error(`不明なエラー: ${drivingStatus}`);
        }
      }

      // --- 徒歩モードのルート取得 ---
      const walkingRes = await directionsService.directions({
        params: {
          origin: start,
          destination: end,
          mode: 'walking' as TravelMode,
          key: apiKey,
          region: 'jp',
          language: 'ja' as Language,
          alternatives: true,
          waypoints: [],
        },
      });

      console.log('徒歩ルート検索結果:', {
        status: walkingRes.data.status,
        error_message: walkingRes.data.error_message,
        routes: walkingRes.data.routes?.length || 0
      });

      const walkingStatus = walkingRes.data.status;
      if (walkingStatus !== 'OK') {
        if (statusMap[walkingStatus]) {
          console.warn('徒歩ルートエラー:', {
            status: walkingStatus,
            error_message: walkingRes.data.error_message
          });
          return NextResponse.json(
            {
              error: `徒歩ルート取得失敗: ${walkingStatus}`,
              details: walkingRes.data.error_message || '不明なエラー'
            },
            { status: statusMap[walkingStatus] }
          );
        } else {
          throw new Error(`不明な徒歩ルートエラー: ${walkingStatus}`);
        }
      }

      // レスポンス整形
      const drivingLeg = drivingRes.data.routes[0].legs[0];
      const walkingLeg = walkingRes.data.routes[0].legs[0];
      const path: [number, number][] = [];

      drivingLeg.steps.forEach(step => {
        const points = decodePolyline(step.polyline.points);
        path.push(...points);
      });

      const response = {
        path,
        distance: drivingLeg.distance.value / 1000, // メートル→キロメートル
        duration: {
          driving: Math.ceil(drivingLeg.duration.value / 60),  // 秒→分
          walking: Math.ceil(walkingLeg.duration.value / 60)   // 秒→分
        },
        routeId: 1,
        duration_in_traffic: Math.ceil(
          (drivingLeg.duration_in_traffic?.value || drivingLeg.duration.value) / 60
        ), // 秒→分
        isTollRoad: true, // 有料道路を含むルート
        toll: 1000, // 仮の料金（実際のAPIから取得する必要あり）
      };

      // 無料ルートの情報も取得
      const freeRouteResponse = {
        ...response,
        routeId: 2,
        isTollRoad: false,
        toll: 0,
      };

      console.log('ルート検索成功:', { response, freeRouteResponse });
      return NextResponse.json([response, freeRouteResponse]);

    } catch (error) {
      console.error('ルート取得エラー:', error);
      if (error instanceof Error) {
        return NextResponse.json(
          { error: 'ルート取得に失敗しました', details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'ルート取得に失敗しました', details: '不明なエラーが発生しました' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('ルート取得エラー:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'ルート情報の取得に失敗しました',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}