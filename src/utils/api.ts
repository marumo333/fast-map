import { Route } from '@/types/route';
import { TrafficInfo } from './trafficPolling';
import { Feedback } from '@/components/FeedbackForm';

// Google Maps APIキーの設定
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('Google Maps APIキーが設定されていません');
}

export const api = {
  // ルート検索
  searchRoute: async (start: [number, number], end: [number, number]): Promise<Route[]> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${start[0]},${start[1]}&destination=${end[0]},${end[1]}&key=${API_KEY}&alternatives=true&departure_time=now&traffic_model=best_guess`
      );

      if (!response.ok) {
        throw new Error('ルート検索に失敗しました');
      }

      const data = await response.json();
      return data.routes.map((route: any, index: number) => ({
        routeId: index + 1,
        path: route.overview_polyline.points,
        distance: route.legs[0].distance.value,
        duration: route.legs[0].duration.value,
        duration_in_traffic: route.legs[0].duration_in_traffic?.value || route.legs[0].duration.value,
        isTollRoad: route.legs[0].steps.some((step: any) => step.toll_road),
        trafficInfo: [{
          duration_in_traffic: route.legs[0].duration_in_traffic?.value || route.legs[0].duration.value,
          traffic_level: route.legs[0].duration_in_traffic ? '混雑' : '通常'
        }]
      }));
    } catch (error) {
      console.error('ルート検索エラー:', error);
      throw error;
    }
  },

  // 交通情報の取得
  getTrafficInfo: async (routeId: number): Promise<TrafficInfo> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?route_id=${routeId}&key=${API_KEY}&departure_time=now&traffic_model=best_guess`
      );

      if (!response.ok) {
        throw new Error('交通情報の取得に失敗しました');
      }

      const data = await response.json();
      const route = data.routes[0];

      return {
        duration_in_traffic: route.legs[0].duration_in_traffic?.value || route.legs[0].duration.value,
        traffic_level: route.legs[0].duration_in_traffic ? '混雑' : '通常'
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