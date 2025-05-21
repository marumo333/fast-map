import { Route } from '@/types/route';
import { TrafficInfo } from './trafficPolling';
import { Feedback } from '@/components/FeedbackForm';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export const api = {
  // ルート検索
  searchRoute: async (start: [number, number], end: [number, number]): Promise<Route[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/route?startLat=${start[0]}&startLng=${start[1]}&endLat=${end[0]}&endLng=${end[1]}`);

      if (!response.ok) {
        throw new Error('ルート検索に失敗しました');
      }

      const data = await response.json();
      return data.routes;
    } catch (error) {
      console.error('ルート検索エラー:', error);
      throw error;
    }
  },

  // 交通情報の取得
  getTrafficInfo: async (routeId: number): Promise<TrafficInfo> => {
    try {
      const response = await fetch(`${API_BASE_URL}/traffic/${routeId}`);

      if (!response.ok) {
        throw new Error('交通情報の取得に失敗しました');
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
      const response = await fetch(`${API_BASE_URL}/routes/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentRouteId, reason }),
      });

      if (!response.ok) {
        throw new Error('ルート変更の提案に失敗しました');
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
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      });
      if (!response.ok) {
        throw new Error('フィードバック送信に失敗しました');
      }
    } catch (error) {
      console.error('フィードバック送信エラー:', error);
      throw error;
    }
  },
}; 