import { Route } from '@/types/route';
import { TrafficInfo } from './trafficPolling';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

export const api = {
  // ルート検索
  searchRoute: async (start: [number, number], end: [number, number]): Promise<Route[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end }),
      });

      if (!response.ok) {
        throw new Error('ルート検索に失敗しました');
      }

      return await response.json();
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
}; 