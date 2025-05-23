import { Route } from '@/types/route';
import { TrafficInfo } from './trafficPolling';
import { Feedback } from '@/components/FeedbackForm';

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

export const api = {
  // ルート検索
  searchRoute: async (start: [number, number], end: [number, number]): Promise<Route[]> => {
    return new Promise((resolve, reject) => {
      const directionsService = new window.google.maps.DirectionsService();

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
        (result: any, status: string) => {
          if (status === 'OK') {
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
                duration: route.legs[0].duration.value,
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
            console.error('ルート検索失敗:', status);
            reject(new Error(`Google Maps APIエラー: ${status}`));
          }
        }
      );
    });
  },

  // 交通情報の取得
  getTrafficInfo: async (routeId: number): Promise<TrafficInfo> => {
    return new Promise((resolve, reject) => {
      const directionsService = new window.google.maps.DirectionsService();

      // ルートIDから出発地と目的地を取得する必要があります
      // この例では、現在のルート情報を保持する必要があります
      const currentRoute = window.localStorage.getItem(`route_${routeId}`);
      if (!currentRoute) {
        reject(new Error('ルート情報が見つかりません'));
        return;
      }

      const { start, end } = JSON.parse(currentRoute);

      directionsService.route(
        {
          origin: { lat: start[0], lng: start[1] },
          destination: { lat: end[0], lng: end[1] },
          travelMode: window.google.maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: 'bestguess'
          },
          alternatives: true
        },
        (result: any, status: string) => {
          if (status === 'OK') {
            const route = result.routes[0];
            resolve({
              duration_in_traffic: route.legs[0].duration_in_traffic?.value || route.legs[0].duration.value,
              traffic_level: route.legs[0].duration_in_traffic ? '混雑' : '通常'
            });
          } else {
            console.error('ルート取得失敗:', status);
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