import { Route } from '../types/route';
import { TrafficInfo } from './trafficPolling';
import { Feedback } from '../components/FeedbackForm';
import { Location } from '../types/location';

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
    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: { lat: start[0], lng: start[1] },
          end: { lat: end[0], lng: end[1] }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ルート検索に失敗しました');
      }

      const data = await response.json();
      return [data]; // サーバーサイドのAPIは単一のルートを返すため、配列に変換
    } catch (error) {
      console.error('ルート検索エラー:', error);
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