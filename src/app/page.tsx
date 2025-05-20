'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import RouteSelector from './components/RouteSelector';
import { useTrafficPolling } from '../utils/trafficPolling';
import { Location } from '@/types/location';
import { Route } from '@/types/route';
import { useRouteChangeDetection } from '@/hooks/useRouteChangeDetection';
import RouteNotification from '@/components/RouteNotification';
import Map from './components/Map';
import FeedbackForm from '@/components/FeedbackForm';

// Leafletのマップコンポーネントを動的にインポート
const MapComponent = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => <div>地図を読み込み中...</div>
});

export default function Home() {
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationRequested, setIsLocationRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 現在地を取得する関数
  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocationRequested(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("現在地の取得に失敗しました:", error);
          setIsLocationRequested(false);
        }
      );
    }
  };

  // 交通情報のポーリング
  useTrafficPolling(
    selectedRoute?.routeId ?? 0,
    30000,
    (info) => {
      console.log('交通情報更新:', info);
      setTrafficInfo(info);
    }
  );

  // ルート変更の検出
  const { routeChange, clearRouteChange } = useRouteChangeDetection(
    selectedRoute,
    trafficInfo
  );

  const handleRouteSelect = (route: Route) => {
    console.log('ルート選択:', route);
    setSelectedRoute(route);
    setIsSearchOpen(false);
  };

  const handleRouteChange = (newRoute: Route) => {
    setSelectedRoute(newRoute);
    clearRouteChange();
  };

  const handleLocationSelect = (location: Location) => {
    if (!startLocation) {
      setStartLocation(location);
    } else if (!endLocation) {
      setEndLocation(location);
    }
  };

  const handleFeedbackSubmit = async (feedback: any) => {
    // フィードバック送信処理
    console.log('フィードバック送信:', feedback);
  };

  return (
    <main className="min-h-screen bg-gray-50">
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
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  ルート情報
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">距離:</span>
                    <span className="font-medium">{(selectedRoute.distance / 1000).toFixed(1)}km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">所要時間:</span>
                    <span className="font-medium">{Math.round(selectedRoute.duration / 60)}分</span>
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
              />
            </div>
          </div>
        </div>
      </div>

      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Fast-Map</h1>
          <div className="flex gap-2">
            <button
              onClick={getCurrentLocation}
              disabled={isLocationRequested}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isLocationRequested
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isLocationRequested ? '位置情報取得中...' : '現在地を取得'}
            </button>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
            >
              {isSearchOpen ? '地図を表示' : 'ルート検索'}
            </button>
          </div>
        </div>
      </div>

      {/* 検索パネル */}
      <div className={`absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 z-10 transition-transform duration-300 ${
        isSearchOpen ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-4xl mx-auto">
          <RouteSelector
            startLocation={startLocation}
            endLocation={endLocation}
            onRouteSelect={handleRouteSelect}
          />
        </div>
      </div>

      {/* 交通情報パネル */}
      {trafficInfo && (
        <div className="absolute bottom-20 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold">交通情報</h2>
              <p className="text-sm text-gray-600">
                混雑度: {trafficInfo.congestion} / 遅延: {trafficInfo.delay}分
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {new Date(trafficInfo.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* ルート変更通知 */}
      {routeChange && selectedRoute && (
        <RouteNotification
          currentRoute={selectedRoute}
          suggestedRoute={routeChange.suggestedRoute}
          reason={routeChange.reason}
          onAccept={() => handleRouteChange(routeChange.suggestedRoute)}
          onDismiss={clearRouteChange}
        />
      )}
    </main>
  );
} 