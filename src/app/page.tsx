'use client';
import React, { useState, useEffect } from 'react';
import RouteSelector from '@/components/RouteSelector';
import { useTrafficPolling, TrafficInfo } from '../utils/trafficPolling';
import { Location } from '@/types/location';
import { Route } from '@/types/route';
import { useRouteChangeDetection } from '@/hooks/useRouteChangeDetection';
import { RouteNotification } from '@/components/RouteNotification';
import dynamic from 'next/dynamic';
import FeedbackForm from '@/components/FeedbackForm';
import { useLocation } from '@/contexts/LocationContext';
import { toast, Toaster } from 'react-hot-toast';
import { ToastContainer } from '@/components/ui/toast';
import SearchForm from '@/components/SearchForm';
import RouteInfo, { RouteInfo as RouteInfoType } from '@/components/RouteInfo';

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
  const [routeInfo, setRouteInfo] = useState<RouteInfoType | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleRouteChange = (route: Route) => {
    setSelectedRoute(route);
    setShowNotification(false);
  };

  const handleDismissNotification = () => {
    setShowNotification(false);
  };

  const handleTrafficUpdate = (info: TrafficInfo) => {
    if (selectedRoute) {
      const updatedRoute = {
        ...selectedRoute,
        duration: {
          driving: info.duration.driving,
          walking: info.duration.walking
        }
      };
      setSelectedRoute(updatedRoute);
    }
  };

  const handleSearch = async (start: Location, end: Location) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start, end }),
      });

      if (!response.ok) {
        throw new Error('ルート情報の取得に失敗しました');
      }

      const data = await response.json();
      setRouteInfo(data);
    } catch (error) {
      setError('ルート情報の取得に失敗しました。もう一度お試しください。');
      console.error('ルート検索エラー:', error);
    } finally {
      setIsLoading(false);
    }
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
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  出発地と目的地を選択
                </h2>
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
                      <span className="text-gray-600">距離:</span>
                      <span className="font-medium">{(selectedRoute.distance / 1000).toFixed(1)}km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">車での所要時間:</span>
                      <span className="font-medium">{Math.round(selectedRoute.duration.driving / 60)}分</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">徒歩での所要時間:</span>
                      <span className="font-medium">{Math.round(selectedRoute.duration.walking / 60)}分</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">有料道路:</span>
                      <span className="font-medium">{selectedRoute.isTollRoad ? 'あり' : 'なし'}</span>
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
            <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </div>

        {/* 交通情報パネル */}
        {trafficInfo && showTrafficInfo && (
          <div className="fixed bottom-24 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-10 transition-opacity duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-semibold text-black-900">交通情報</h2>
                <div className="space-y-1 mt-1">
                  <p className="text-sm text-gray-900">
                    混雑度: {trafficInfo.congestion}
                  </p>
                  <p className="text-sm text-gray-900">
                    遅延: {trafficInfo.delay}分
                  </p>
                  <p className="text-sm text-gray-900">
                    車での所要時間: {Math.round(trafficInfo.duration.driving / 60)}分
                  </p>
                  <p className="text-sm text-gray-900">
                    徒歩での所要時間: {Math.round(trafficInfo.duration.walking / 60)}分
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-900">
                {new Date(trafficInfo.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* ルート変更通知 */}
        {selectedRoute && showNotification && (
          <div className="fixed bottom-4 left-4 right-4 z-20">
            <RouteNotification
              currentRoute={selectedRoute}
              suggestedRoute={selectedRoute}
              reason="congestion"
              onAccept={handleRouteChange}
              onDismiss={handleDismissNotification}
            />
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {routeInfo && <RouteInfo routeInfo={routeInfo} />}
      </div>
    </div>
  );
} 