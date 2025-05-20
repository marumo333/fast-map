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
  };

  const handleRouteChange = (newRoute: Route) => {
    setSelectedRoute(newRoute);
    clearRouteChange();
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Fast-Map</h1>
      
      <div className="w-full max-w-4xl">
        <div className="mb-4">
          <RouteSelector
            startLocation={startLocation}
            endLocation={endLocation}
            onRouteSelect={handleRouteSelect}
          />
        </div>

        <div className="h-[600px] w-full border rounded-lg overflow-hidden">
          <Map 
            selectedRoute={selectedRoute} 
            currentLocation={currentLocation}
          />
        </div>

        {trafficInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">交通情報</h2>
            <p>混雑度: {trafficInfo.congestion}</p>
            <p>遅延: {trafficInfo.delay}分</p>
            <p>最終更新: {new Date(trafficInfo.lastUpdated).toLocaleString()}</p>
          </div>
        )}

        {routeChange && selectedRoute && (
          <RouteNotification
            currentRoute={selectedRoute}
            suggestedRoute={routeChange.suggestedRoute}
            reason={routeChange.reason}
            onAccept={() => handleRouteChange(routeChange.suggestedRoute)}
            onDismiss={clearRouteChange}
          />
        )}
      </div>
    </main>
  );
} 