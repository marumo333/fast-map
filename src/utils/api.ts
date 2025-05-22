import { Route } from '@/types/route';
import { TrafficInfo } from './trafficPolling';
import { Feedback } from '@/components/FeedbackForm';

// APIのベースURLを設定
const API_BASE_URL = 'https://fast-map-five.vercel.app/api';

// APIキーの設定
const API_KEY = 'fast-map-api-key-2025';

// 共通のヘッダー設定
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY
};

// APIキーの設定をログ出力
console.log('API設定:', {
  baseUrl: API_BASE_URL,
  apiKey: API_KEY,
  headers,
  env: process.env.NODE_ENV
});

export const api = {
  // ルート検索
  searchRoute: async (start: [number, number], end: [number, number]): Promise<Route[]> => {
    try {
      const url = `${API_BASE_URL}/route?startLat=${start[0]}&startLng=${start[1]}&endLat=${end[0]}&endLng=${end[1]}`;
      console.log('ルート検索API呼び出し:', {
        url,
        headers
      });
      const response = await fetch(url, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ルート検索エラー:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`ルート検索に失敗しました: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.routes;
    } catch (error) {
      console.error('ルート検索エラー:', error);
      throw error;
    }
  },

  // 交通情報の取得
  getTrafficInfo: async (routeId: number, start?: [number, number], end?: [number, number]): Promise<TrafficInfo> => {
    try {
      let url = `${API_BASE_URL}/traffic/${routeId}`;
      if (start && end) {
        url += `?startLat=${start[0]}&startLng=${start[1]}&endLat=${end[0]}&endLng=${end[1]}`;
      }
      console.log('交通情報API呼び出し:', url);
      const response = await fetch(url, {
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('交通情報取得エラー:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url
        });
        throw new Error(`交通情報の取得に失敗しました: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('交通情報取得エラー:', error);
      throw error;
    }
  },

  // ルート変更の提案
  suggestRouteChange: async (
    currentRouteId: number,
    reason: 'congestion' | 'accident' | 'clear'
  ): Promise<Route> => {
    try {
      const url = `${API_BASE_URL}/routes/suggest`;
      console.log('ルート変更提案API呼び出し:', url);
      const response = await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ currentRouteId, reason }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ルート変更提案エラー:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`ルート変更の提案に失敗しました: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ルート変更提案エラー:', error);
      throw error;
    }
  },

  // フィードバック送信
  sendFeedback: async (feedback: Feedback): Promise<void> => {
    try {
      console.log('フィードバック送信API呼び出し:', `${API_BASE_URL}/feedback`);
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('フィードバック送信エラー:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`フィードバック送信に失敗しました: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('フィードバック送信エラー:', error);
      throw error;
    }
  },
}; 