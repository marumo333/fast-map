'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import RouteSelector from './components/RouteSelector';
import { useTrafficPolling } from '../utils/trafficPolling';
import { Location } from '@/types/location';
import { Route } from '@/types/route';
import { useRouteChangeDetection } from '@/hooks/useRouteChangeDetection';
import RouteNotification from '@/components/RouteNotification';

// Leafletのマップコンポーネントを動的にインポート
const Map = dynamic(() => import('./components/Map'), {
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

  // 現在地を取得
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("現在地の取得に失敗しました:", error);
        }
      );
    }
  }, []);

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

  return (
    <main className="relative w-full h-screen">
      {/* 地図表示エリア */}
      <div className="absolute inset-0">
        <Map 
          selectedRoute={selectedRoute} 
          currentLocation={currentLocation}
        />
      </div>

      {/* ヘッダー */}
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-4 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Fast-Map</h1>
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {isSearchOpen ? '地図を表示' : 'ルート検索'}
          </button>
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