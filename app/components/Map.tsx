'use client';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { Location } from '../types/location';
import { Route } from '../types/route';
import { useLocation } from '../contexts/LocationContext';
import { searchRoute } from '../utils/api';

// 静的なライブラリ配列を定義
const GOOGLE_MAPS_LIBRARIES: ("marker" | "places" | "geometry")[] = ["marker", "places", "geometry"];

// Map IDを定義
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || '';

// APIキーの取得
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('Google Maps APIキーが設定されていません。.env.localファイルを確認してください。');
}

type MapProps = {
  selectedRoute: Route | null;
  currentLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  endLocation?: Location | null;
};

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px'  // 最小の高さを設定
};

const defaultCenter = {
  lat: 35.6812,
  lng: 139.7671
};

// カスタムマーカーのスタイル
const createCustomMarker = (isCurrentLocation: boolean) => {
  const div = document.createElement('div');
  div.style.width = '40px';  // サイズを大きく
  div.style.height = '40px';
  div.style.backgroundColor = isCurrentLocation ? '#3B82F6' : '#EF4444';
  div.style.border = '4px solid #FFFFFF';  // ボーダーを太く
  div.style.borderRadius = '50%';
  div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';  // シャドウを強調
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.position = 'relative';
  div.style.transition = 'all 0.3s ease';  // アニメーションを追加

  // 内側の円を追加
  const innerCircle = document.createElement('div');
  innerCircle.style.width = '16px';  // サイズを大きく
  innerCircle.style.height = '16px';
  innerCircle.style.backgroundColor = '#FFFFFF';
  innerCircle.style.borderRadius = '50%';
  innerCircle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';  // 内側の円にもシャドウ
  div.appendChild(innerCircle);

  // 現在地の場合、パルスアニメーションを追加
  if (isCurrentLocation) {
    const pulse = document.createElement('div');
    pulse.style.position = 'absolute';
    pulse.style.width = '100%';
    pulse.style.height = '100%';
    pulse.style.borderRadius = '50%';
    pulse.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
    pulse.style.animation = 'pulse 2s infinite';
    div.appendChild(pulse);

    // パルスアニメーションのスタイルを追加
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.8;
        }
        50% {
          transform: scale(1.5);
          opacity: 0.4;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // ホバーエフェクトを追加
    div.addEventListener('mouseenter', () => {
      div.style.transform = 'scale(1.1)';
      div.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
    });

    div.addEventListener('mouseleave', () => {
      div.style.transform = 'scale(1)';
      div.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });
  }

  return div;
};

const Map: React.FC<MapProps> = ({ selectedRoute, currentLocation, onLocationSelect, endLocation }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const { destination, route, setRoute } = useLocation();
  const markersRef = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: 'weekly',
    mapIds: [MAP_ID]
  });

  // マーカー更新関数をメモ化
  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // 既存のマーカーをクリア
    Object.values(markersRef.current).forEach(marker => marker.map = null);
    markersRef.current = {};

    // 現在地のマーカーを設定
    if (currentLocation) {
      console.log('現在地のマーカーを設定:', currentLocation);
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        title: '現在地',
        content: createCustomMarker(true)
      });
      markersRef.current['current'] = marker;

      // 現在地を中心に地図を移動
      mapInstanceRef.current.setCenter({ lat: currentLocation.lat, lng: currentLocation.lng });
      mapInstanceRef.current.setZoom(15);
    }

    // 目的地のマーカーを設定
    if (endLocation) {
      console.log('目的地のマーカーを設定:', endLocation);
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: endLocation.lat, lng: endLocation.lng },
        title: '目的地',
        content: createCustomMarker(false)
      });
      markersRef.current['end'] = marker;
    }

    // 地図の中心とズームを調整
    if (currentLocation && endLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: currentLocation.lat, lng: currentLocation.lng });
      bounds.extend({ lat: endLocation.lat, lng: endLocation.lng });
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [currentLocation, endLocation]);

  // ルート表示関数をメモ化
  const displayRoute = useCallback(() => {
    if (!mapInstanceRef.current || !selectedRoute || !currentLocation || !endLocation) return;

    const directionsService = new google.maps.DirectionsService();
    const request = {
      origin: { lat: currentLocation.lat, lng: currentLocation.lng },
      destination: { lat: endLocation.lat, lng: endLocation.lng },
      travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result && directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(result);
      } else {
        console.error('ルートの表示に失敗:', status);
        if (directionsRendererRef.current) {
          const directionsResult: google.maps.DirectionsResult = {
            request,
            routes: [{
              legs: [{
                distance: { text: `${selectedRoute.distance}km`, value: selectedRoute.distance * 1000 },
                duration: { text: `${selectedRoute.duration}分`, value: selectedRoute.duration * 60 },
                duration_in_traffic: selectedRoute.durationInTraffic ? {
                  text: `${selectedRoute.durationInTraffic}分`,
                  value: selectedRoute.durationInTraffic * 60
                } : undefined,
                start_address: '',
                end_address: '',
                start_location: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
                end_location: new google.maps.LatLng(endLocation.lat, endLocation.lng),
                steps: [],
                traffic_speed_entry: [],
                via_waypoints: []
              }],
              overview_path: selectedRoute.path.map(([lat, lng]) => new google.maps.LatLng(lat, lng)),
              overview_polyline: '',
              bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
                new google.maps.LatLng(endLocation.lat, endLocation.lng)
              ),
              copyrights: '',
              warnings: [],
              waypoint_order: [],
              summary: ''
            }]
          };
          directionsRendererRef.current.setDirections(directionsResult);
        }
      }
    });
  }, [selectedRoute, currentLocation, endLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapInstanceRef.current = map;
    console.log('地図の読み込みが完了しました');

    // DirectionsRendererの初期化
    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#4F46E5',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });

    // デフォルトの中心位置を東京に設定
    map.setCenter({ lat: 35.6812, lng: 139.7671 });
  }, []);

  const onUnmount = useCallback(() => {
    mapInstanceRef.current = null;
    directionsRendererRef.current = null;
  }, []);

  // マーカーとルートの更新を一つのuseEffectにまとめる
  useEffect(() => {
    updateMarkers();
    displayRoute();
  }, [updateMarkers, displayRoute]);

  // クリックハンドラーをメモ化
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onLocationSelect({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  }, [onLocationSelect]);

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-red-600">{loadError.message}</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">地図を読み込み中...</div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={13}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        mapId: MAP_ID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }}
    />
  );
};

export default Map; 