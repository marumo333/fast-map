import { Route } from '../app/types/route';
import { TrafficInfo } from './trafficPolling';
import { Feedback } from '../components/FeedbackForm';
import { Location } from '../app/types/location';

declare global {
  interface Window {
    google: any;
  }
}

// Google Maps APIキーの設定
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('Google Maps APIキーが設定されていません');
}

// 交通情報の取得
export const getTrafficInfo = async (
  routeId: number,
  startLocation: Location,
  endLocation: Location
): Promise<TrafficInfo> => {
  try {
    // ここで実際のAPIを呼び出す代わりに、モックデータを返す
    const mockTrafficInfo: TrafficInfo = {
      congestion: '混雑',
      delay: 5,
      lastUpdated: Date.now(),
      duration: {
        driving: 1800, // 30分
        walking: 3600  // 60分
      },
      traffic_level: '混雑'
    };

    return mockTrafficInfo;
  } catch (error) {
    console.error('交通情報の取得に失敗:', error);
    throw error;
  }
};

export const api = {
  // ルート検索
  searchRoute: async (start: [number, number], end: [number, number]): Promise<Route[]> => {
    return new Promise((resolve, reject) => {
      const directionsService = new window.google.maps.DirectionsService();

      // 車でのルート検索
      directionsService.route(
        {
          origin: { lat: start[0], lng: start[1] },
          destination: { lat: end[0], lng: end[1] },
          travelMode: window.google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: 'bestguess'
          },
          provideRouteAlternatives: true
        },
        async (result: any, status: string) => {
          if (status === 'OK') {
            // 徒歩でのルート検索
            directionsService.route(
              {
                origin: { lat: start[0], lng: start[1] },
                destination: { lat: end[0], lng: end[1] },
                travelMode: window.google.maps.TravelMode.WALKING
              },
              (walkingResult: any, walkingStatus: string) => {
                if (walkingStatus === 'OK') {
                  const routes = result.routes.map((route: any, index: number) => {
                    const routeId = index + 1;
                    // ルート情報をローカルストレージに保存
                    window.localStorage.setItem(`route_${routeId}`, JSON.stringify({
                      start,
                      end,
                      routeId
                    }));

                    return {
                      routeId,
                      path: route.overview_path.map((point: any) => [point.lat(), point.lng()]),
                      distance: route.legs[0].distance.value,
                      duration: {
                        driving: route.legs[0].duration.value,
                        walking: walkingResult.routes[0].legs[0].duration.value
                      },
                      duration_in_traffic: route.legs[0].duration_in_traffic?.value || route.legs[0].duration.value,
                      isTollRoad: route.legs[0].steps.some((step: any) => step.toll_road),
                      trafficInfo: [{
                        duration_in_traffic: route.legs[0].duration_in_traffic?.value || route.legs[0].duration.value,
                        traffic_level: route.legs[0].duration_in_traffic ? '混雑' : '通常'
                      }]
                    };
                  });
                  resolve(routes);
                } else {
                  console.error('徒歩ルート検索失敗:', walkingStatus);
                  reject(new Error(`Google Maps APIエラー: ${walkingStatus}`));
                }
              }
            );
          } else {
            console.error('車ルート検索失敗:', status);
            reject(new Error(`Google Maps APIエラー: ${status}`));
          }
        }
      );
    });
  },

  // フィードバック送信
  sendFeedback: async (feedback: Feedback): Promise<void> => {
    try {
      console.log('フィードバック送信:', feedback);
      // フィードバックの保存処理を実装
      // 例: localStorageに保存
      const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
      feedbacks.push({
        ...feedback,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('feedbacks', JSON.stringify(feedbacks));
    } catch (error) {
      console.error('フィードバック送信エラー:', error);
      throw error;
    }
  }
}; 