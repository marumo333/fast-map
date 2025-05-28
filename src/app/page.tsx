'use client';
import React, { useState, useEffect } from 'react';
import RouteSelector from '@/components/RouteSelector';
import { useTrafficPolling } from '../utils/trafficPolling';
import { Location } from '@/types/location';
import { Route } from '@/types/route';
import { useRouteChangeDetection } from '@/hooks/useRouteChangeDetection';
import RouteNotification from '@/components/RouteNotification';
import dynamic from 'next/dynamic';
import { useLocation } from '@/contexts/LocationContext';
import SearchForm from '@/components/SearchForm';

// Notification型を定義
type Notification = {
  type: 'congestion' | 'accident' | 'construction';
  message: string;
  alternativeRoute?: Route;
};

// Leafletのマップコンポーネントを動的にインポート
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-600">地図を読み込み中...</div>
    </div>
  )
});

export default function Home() {
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showTrafficInfo, setShowTrafficInfo] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentLocation } = useLocation();

  // 交通情報のポーリング
  useTrafficPolling(
    selectedRoute?.routeId ?? 0,
    30000, // 30秒ごとに更新
    (info) => {
      console.log('交通情報更新:', info);
      setTrafficInfo(info);
      setShowTrafficInfo(true);
      // 3秒後に通知を非表示
      setTimeout(() => {
        setShowTrafficInfo(false);
      }, 3000);
    },
    startLocation ?? undefined,
    endLocation ?? undefined
  );

  // ルート変更の検出
  useRouteChangeDetection(
    selectedRoute ?? undefined,
    trafficInfo,
    (newRoute) => {
      setSelectedRoute(newRoute);
      setShowNotification(true);
    }
  );

  // 現在地が取得されたら出発地として設定
  useEffect(() => {
    if (currentLocation && !startLocation) {
      setStartLocation(currentLocation);
    }
  }, [currentLocation, startLocation]);

  const handleSearch = async (start: Location, end: Location) => {
    try {
      setStartLocation(start);
      setEndLocation(end);
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          throw new Error('指定された地点間のルートが見つかりませんでした。別の地点を指定するか、移動手段を変更してください。');
        }
        throw new Error(errorData.error || 'ルート情報の取得に失敗しました');
      }

      const routeData = await response.json();
      // ルートデータに必要なプロパティを追加
      const selectedRoute = {
        ...routeData,
        routeId: 1, // デフォルトのルートID
        path: routeData.path || [],
        distance: routeData.distance || 0,
        duration: {
          driving: routeData.duration?.driving || 0,
          walking: routeData.duration?.walking || 0
        },
        isTollRoad: routeData.isTollRoad || false
      };
      setSelectedRoute(selectedRoute);
      setIsLoading(false);
      setShowNotification(true);
    } catch (error) {
      console.error('ルート検索エラー:', error);
      setError(error instanceof Error ? error.message : 'ルート検索中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  const handleNotificationAction = (action: 'accept' | 'dismiss') => {
    if (action === 'accept' && notification?.alternativeRoute) {
      setSelectedRoute(notification.alternativeRoute);
    }
    setNotification(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow bg-gray-50 pb-32">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            最適なルートを探す
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左サイドバー */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <SearchForm
                  onSearch={handleSearch}
                  isSearching={isLoading}
                  onClose={() => {}}
                />
              </div>

              {startLocation && endLocation && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <RouteSelector
                    startLocation={startLocation}
                    endLocation={endLocation}
                    onRouteSelect={setSelectedRoute}
                  />
                </div>
              )}

              {selectedRoute && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    ルート情報
                  </h2>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-800">距離:</span>
                      <span className="font-medium text-gray-900">{(selectedRoute.distance / 1000).toFixed(1)}km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800">車での所要時間:</span>
                      <span className="font-medium text-gray-900">
                        {selectedRoute.duration.driving ? 
                          `${Math.round(selectedRoute.duration.driving / 60)}分` : 
                          '利用不可'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800">徒歩での所要時間:</span>
                      <span className="font-medium text-gray-900">{Math.round(selectedRoute.duration.walking / 60)}分</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-800">有料道路:</span>
                      <span className="font-medium text-gray-900">{selectedRoute.isTollRoad ? 'あり' : 'なし'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 地図表示エリア */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
                <Map
                  selectedRoute={selectedRoute}
                  currentLocation={currentLocation}
                  onLocationSelect={(location) => {
                    if (!startLocation) {
                      setStartLocation(location);
                    } else {
                      setEndLocation(location);
                    }
                  }}
                  endLocation={endLocation}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 通知 */}
      {showNotification && notification && (
        <RouteNotification
          type={notification.type}
          message={notification.message}
          onAccept={() => handleNotificationAction('accept')}
          onDismiss={() => handleNotificationAction('dismiss')}
          currentRoute={selectedRoute || undefined}
          suggestedRoute={notification.alternativeRoute || undefined}
        />
      )}
    </div>
  );
} 