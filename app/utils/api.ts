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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://fast-6ir0sv4r8-marumo333s-projects.vercel.app';

export const searchRoute = async (
  start: [number, number],
  end: [number, number]
): Promise<Route[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/route`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start,
        end,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('ルート検索エラーの詳細:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`ルート検索に失敗しました: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('ルート検索エラー:', error);
    throw error;
  }
};

export const api = {
  // ルート検索
  searchRoute: searchRoute,

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