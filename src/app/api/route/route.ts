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

    // Google Maps Directions APIを使用してルート情報を取得
    const directionsService = new google.maps.DirectionsService();
    
    // 車でのルートを取得
    const drivingResult = await new Promise<DirectionsResult>((resolve, reject) => {
      directionsService.route(
        {
          origin: new google.maps.LatLng(start.lat, start.lng),
          destination: new google.maps.LatLng(end.lat, end.lng),
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            resolve(result as DirectionsResult);
          } else {
            reject(new Error(`Google Maps APIエラー: ${status}`));
          }
        }
      );
    });

    // 徒歩でのルートを取得
    const walkingResult = await new Promise<DirectionsResult>((resolve, reject) => {
      directionsService.route(
        {
          origin: new google.maps.LatLng(start.lat, start.lng),
          destination: new google.maps.LatLng(end.lat, end.lng),
          travelMode: google.maps.TravelMode.WALKING,
        },
        (result, status) => {
          if (status === 'OK') {
            resolve(result as DirectionsResult);
          } else {
            reject(new Error(`Google Maps APIエラー: ${status}`));
          }
        }
      );
    });

    // ルート情報を整形
    const routeInfo = {
      distance: drivingResult.routes[0].legs[0].distance.value,
      duration: {
        driving: drivingResult.routes[0].legs[0].duration.value,
        walking: walkingResult.routes[0].legs[0].duration.value,
      },
      isTollRoad: drivingResult.routes[0].legs[0].steps.some(step => 
        step.toll_road || step.highway
      ),
    };

    return NextResponse.json(routeInfo);
  } catch (error) {
    console.error('ルート情報取得エラー:', error);
    return NextResponse.json(
      { error: 'ルート情報の取得に失敗しました' },
      { status: 500 }
    );
  }
} 