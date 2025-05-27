'use client';
import React, { useState, useEffect } from 'react';
import RouteSelector from '@/components/RouteSelector';
import { useTrafficPolling } from '../utils/trafficPolling';
import { Location } from '@/types/location';
import { Route } from '@/types/route';
import { useRouteChangeDetection } from '@/hooks/useRouteChangeDetection';
import RouteNotification from '@/components/RouteNotification';
import dynamic from 'next/dynamic';
import FeedbackForm from '@/components/FeedbackForm';
import { useLocation } from '@/contexts/LocationContext';
import SearchForm from '@/components/SearchForm';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationRequested, setIsLocationRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentLocation } = useLocation();
  const [showNotification, setShowNotification] = useState(false);
  const [showTrafficInfo, setShowTrafficInfo] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'congestion' | 'accident' | 'construction';
    message: string;
    alternativeRoute?: Route;
  } | null>(null);

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

  // ルート選択時の処理
  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
  };

  const handleLocationSelect = (location: Location) => {
    if (!startLocation) {
      setStartLocation(location);
    } else {
      setEndLocation(location);
    }
  };

  // 現在地が取得されたら出発地として設定
  useEffect(() => {
    if (currentLocation && !startLocation) {
      setStartLocation(currentLocation);
    }
  }, [currentLocation, startLocation]);

  const handleFeedbackSubmit = async (feedback: any) => {
    // フィードバック送信処理
    console.log('フィードバック送信:', feedback);
  };

  const handleRouteChange = () => {
    if (selectedRoute) {
      setSelectedRoute(selectedRoute);
      setShowNotification(false);
    }
  };

  const handleDismissNotification = () => {
    setShowNotification(false);
  };

  const handleSearch = async (start: Location, end: Location) => {
    setIsLoading(true);
    setStartLocation(start);
    setEndLocation(end);

    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('APIエラーレスポンス:', data);
        if (response.status === 404) {
          throw new Error(data.error || 'ルートが見つかりませんでした。別の地点を指定するか、移動手段を変更してください。');
        }
        if (response.status === 429) {
          throw new Error(data.error || 'APIの利用制限に達しました。しばらく時間をおいて再度お試しください。');
        }
        if (response.status === 403) {
          throw new Error(data.error || 'APIリクエストが拒否されました。APIキーの設定を確認してください。');
        }
        throw new Error(data.error || 'ルート情報の取得に失敗しました');
      }

      // 取得したデータをselectedRouteに反映
      setSelectedRoute({
        routeId: 1, // デフォルトのルートID
        path: data.path,
        distance: data.distance,
        duration: data.duration,
        duration_in_traffic: data.duration.driving || data.duration.walking,
        isTollRoad: data.isTollRoad,
        mode: data.mode || 'driving',
        trafficInfo: [{
          duration_in_traffic: data.duration.driving || data.duration.walking,
          traffic_level: '通常'
        }]
      });

      // 検索パネルを閉じる
      setIsSearchOpen(false);
    } catch (error) {
      console.error('ルート検索エラー:', error);
      // エラーメッセージをユーザーに表示
      setNotification({
        type: 'congestion',
        message: error instanceof Error ? error.message : 'ルート情報の取得に失敗しました'
      });
      setShowNotification(true);
    } finally {
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    出発地と目的地を選択
                  </h2>
                  <button
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    {isSearchOpen ? '閉じる' : '検索'}
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      出発地
                    </label>
                    <div className="text-sm text-gray-600">
                      {startLocation ? 
                        `緯度: ${startLocation.lat.toFixed(6)}, 経度: ${startLocation.lng.toFixed(6)}` : 
                        '地図上でクリックして選択'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      目的地
                    </label>
                    <div className="text-sm text-gray-600">
                      {endLocation ? 
                        `緯度: ${endLocation.lat.toFixed(6)}, 経度: ${endLocation.lng.toFixed(6)}` : 
                        '地図上でクリックして選択'}
                    </div>
                  </div>
                </div>
              </div>

              {startLocation && endLocation && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <RouteSelector
                    startLocation={startLocation}
                    endLocation={endLocation}
                    onRouteSelect={handleRouteSelect}
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

              {selectedRoute && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <FeedbackForm
                    routeId={selectedRoute.routeId}
                    onSubmit={handleFeedbackSubmit}
                  />
                </div>
              )}
            </div>

            {/* 地図表示エリア */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden h-[600px]">
                <Map
                  selectedRoute={selectedRoute}
                  currentLocation={currentLocation}
                  onLocationSelect={handleLocationSelect}
                  endLocation={endLocation}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 位置情報エラーメッセージ */}
        {locationError && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-20">
            {locationError}
          </div>
        )}

        {/* 検索パネル */}
        <div className={`fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 z-10 transition-transform duration-300 ${
          isSearchOpen ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <div className="max-w-4xl mx-auto">
            <SearchForm 
              onSearch={handleSearch} 
              isSearching={isLoading} 
              onClose={() => setIsSearchOpen(false)}
            />
          </div>
        </div>

        {/* 交通情報パネル */}
        {trafficInfo && showTrafficInfo && (
          <div className="fixed bottom-24 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-10 transition-opacity duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-black">交通情報</h2>
                <div className="space-y-1 mt-1">
                  <p className="text-sm text-black">
                    混雑度: {trafficInfo.congestion}
                  </p>
                  <p className="text-sm text-black">
                    遅延: {trafficInfo.delay}分
                  </p>
                  <p className="text-sm text-black">
                    車での所要時間: {Math.round(trafficInfo.duration.driving / 60)}分
                  </p>
                  <p className="text-sm text-black">
                    徒歩での所要時間: {Math.round(trafficInfo.duration.walking / 60)}分
                  </p>
                </div>
              </div>
              <p className="text-xs text-black">
                {new Date(trafficInfo.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* ルート変更通知 */}
        {selectedRoute && showNotification && (
          <div className="fixed bottom-4 left-4 right-4 z-20">
            <RouteNotification
              type="congestion"
              message="現在のルートに混雑が発生しています。代替ルートを表示しますか？"
              onAccept={handleRouteChange}
              onDismiss={handleDismissNotification}
              currentRoute={selectedRoute}
              suggestedRoute={selectedRoute}
            />
          </div>
        )}

        {notification && (
          <div className="fixed bottom-4 left-4 right-4 z-20">
            <RouteNotification
              type={notification.type}
              message={notification.message}
              onAccept={() => handleNotificationAction('accept')}
              onDismiss={() => handleNotificationAction('dismiss')}
              currentRoute={selectedRoute || undefined}
              suggestedRoute={notification.alternativeRoute || undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
} 