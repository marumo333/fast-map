import { NextResponse } from 'next/server';
import { Client, TravelMode, TrafficModel, TravelRestriction, Language } from '@googlemaps/google-maps-services-js';

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

export async function POST(request: Request) {
  try {
    const { start, end } = await request.json();

    if (
      !start || !end ||
      typeof start.lat !== 'number' || typeof start.lng !== 'number' ||
      typeof end.lat !== 'number' || typeof end.lng !== 'number'
    ) {
      return NextResponse.json({ error: '出発地と目的地の座標が不正です。' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps APIキーが設定されていません');
      return NextResponse.json({ error: 'Google Maps APIキーが設定されていません' }, { status: 500 });
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

    // 車モード
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
        optimize: true,
        waypoints: [],
      }
    });

    console.log('車ルート検索結果:', drivingRes.data);

    const drivingStatus = drivingRes.data.status;
    if (drivingStatus !== 'OK') {
      if (statusMap[drivingStatus]) {
        console.warn('車ルートエラー:', drivingRes.data);
        return NextResponse.json(
          { error: `車ルート取得失敗: ${drivingStatus} - ${drivingRes.data.error_message || ''}` },
          { status: statusMap[drivingStatus] }
        );
      } else {
        throw new Error(`不明なエラー: ${drivingStatus}`);
      }
    }

    // 徒歩モード
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
      }
    });

    console.log('徒歩ルート検索結果:', walkingRes.data);

    const walkingStatus = walkingRes.data.status;
    if (walkingStatus !== 'OK') {
      if (statusMap[walkingStatus]) {
        console.warn('徒歩ルートエラー:', walkingRes.data);
        return NextResponse.json(
          { error: `徒歩ルート取得失敗: ${walkingStatus} - ${walkingRes.data.error_message || ''}` },
          { status: statusMap[walkingStatus] }
        );
      } else {
        throw new Error(`不明な徒歩ルートエラー: ${walkingStatus}`);
      }
    }

    const drivingLeg = drivingRes.data.routes[0].legs[0];
    const walkingLeg = walkingRes.data.routes[0].legs[0];

    const path: [number, number][] = [];

    drivingLeg.steps.forEach(step => {
      const points = decodePolyline(step.polyline.points);
      path.push(...points);
    });

    const response = {
      path,
      distance: drivingLeg.distance.value,
      duration: {
        driving: drivingLeg.duration.value,
        walking: walkingLeg.duration.value,
      },
      routeId: 1,
      trafficInfo: [{
        duration_in_traffic: drivingLeg.duration_in_traffic?.value || drivingLeg.duration.value,
        traffic_level: drivingLeg.duration_in_traffic ? '混雑' : '通常'
      }]
    };

    console.log('ルート検索成功:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('ルート取得エラー:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ルート情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
