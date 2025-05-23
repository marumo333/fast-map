import { Route } from '@/types/route';
import { TrafficInfo } from './trafficPolling';
import { Feedback } from '@/components/FeedbackForm';

// Google Maps APIキーの設定
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!GOOGLE_MAPS_API_KEY) {
  console.error('Google Maps APIキーが設定されていません');
}

export const api = {
  // ルート検索
  searchRoute: async (start: [number, number], end: [number, number]): Promise<Route[]> => {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps APIキーが設定されていません');
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}&alternatives=true&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;
      console.log('Google Maps Directions API呼び出し:', {
        url: url.replace(GOOGLE_MAPS_API_KEY, '***'),
        env: process.env.NODE_ENV
      });

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Maps APIエラー:', {
          status: data.status,
          error_message: data.error_message
        });
        throw new Error(`Google Maps Directions APIエラー: ${data.status}`);
      }

      return data.routes.map((route: any, index: number) => {
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
        const trafficInfo = route.legs.map((leg: any) => ({
          duration_in_traffic: leg.duration_in_traffic?.value || leg.duration.value,
          traffic_level: leg.duration_in_traffic ? '混雑' : '通常'
        }));

        return {
          routeId: index + 1,
          path,
          distance: route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0),
          duration: route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0),
          duration_in_traffic: route.legs.reduce((sum: number, leg: any) => sum + (leg.duration_in_traffic?.value || leg.duration.value), 0),
          isTollRoad,
          trafficInfo
        };
      });
    } catch (error) {
      console.error('ルート検索エラー:', error);
      throw error;
    }
  },

  // 交通情報の取得
  getTrafficInfo: async (lat: number, lng: number): Promise<TrafficInfo> => {
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps APIキーが設定されていません');
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${lng}&destination=${lat},${lng}&departure_time=now&traffic_model=best_guess&key=${GOOGLE_MAPS_API_KEY}`;
      console.log('Google Maps Traffic API呼び出し:', {
        url: url.replace(GOOGLE_MAPS_API_KEY, '***'),
        env: process.env.NODE_ENV
      });

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Maps APIエラー:', {
          status: data.status,
          error_message: data.error_message
        });
        throw new Error(`Google Maps Traffic APIエラー: ${data.status}`);
      }

      return {
        duration_in_traffic: data.routes[0]?.legs[0]?.duration_in_traffic?.value || 0,
        traffic_level: data.routes[0]?.legs[0]?.duration_in_traffic ? '混雑' : '通常'
      };
    } catch (error) {
      console.error('交通情報取得エラー:', error);
      throw error;
    }
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