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

  const onLoad = useCallback((map: google.maps.Map) => {
    mapInstanceRef.current = map;
    console.log('地図の読み込みが完了しました');

    // デフォルトの中心位置を東京に設定
    map.setCenter({ lat: 35.6812, lng: 139.7671 });
  }, []);

  const onUnmount = useCallback(() => {
    mapInstanceRef.current = null;
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const { DirectionsRenderer } = google.maps;
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: true
      });
    }

    const updateMarkers = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      // 既存のマーカーを削除
      Object.values(markersRef.current).forEach(marker => marker.map = null);
      markersRef.current = {};

      // 現在地のマーカーを追加
      if (currentLocation) {
        const markerView = new google.maps.marker.PinElement({
          background: '#3B82F6',
          borderColor: '#FFFFFF',
          glyphColor: '#FFFFFF',
          scale: 1.5
        });
        const currentMarker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: currentLocation,
          title: '現在地',
          content: markerView.element
        });
        markersRef.current['current'] = currentMarker;

        // 現在地が更新されたら地図の中心を更新
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(currentLocation);
          mapInstanceRef.current.setZoom(15); // ズームレベルを調整
        }
      }

      // 目的地のマーカーを追加
      if (endLocation) {
        const markerView = new google.maps.marker.PinElement({
          background: '#EF4444',
          borderColor: '#FFFFFF',
          glyphColor: '#FFFFFF',
          scale: 1.5
        });
        const destinationMarker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: endLocation,
          title: '目的地',
          content: markerView.element
        });
        markersRef.current['destination'] = destinationMarker;
      }
    };

    updateMarkers();
  }, [currentLocation, endLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current || !currentLocation || !endLocation) return;

    const calculateRoute = async () => {
      try {
        const routes = await searchRoute(
          [currentLocation.lat, currentLocation.lng],
          [endLocation.lat, endLocation.lng]
        );
        if (routes && routes.length > 0) {
          setRoute(routes[0]);
        }
      } catch (error) {
        console.error('ルート検索に失敗:', error);
      }
    };

    calculateRoute();
  }, [currentLocation, endLocation, setRoute]);

  useEffect(() => {
    if (selectedRoute && directionsRendererRef.current) {
      const directionsResult: google.maps.DirectionsResult = {
        request: {
          origin: { lat: currentLocation?.lat || 0, lng: currentLocation?.lng || 0 },
          destination: { lat: endLocation?.lat || 0, lng: endLocation?.lng || 0 },
          travelMode: google.maps.TravelMode.DRIVING
        },
        routes: [{
          legs: [{
            distance: { text: `${selectedRoute.distance}km`, value: selectedRoute.distance * 1000 },
            duration: { text: `${selectedRoute.duration.driving}分`, value: (selectedRoute.duration.driving || 0) * 60 },
            duration_in_traffic: { text: `${selectedRoute.duration_in_traffic}分`, value: selectedRoute.duration_in_traffic * 60 },
            start_address: '',
            end_address: '',
            start_location: new google.maps.LatLng(currentLocation?.lat || 0, currentLocation?.lng || 0),
            end_location: new google.maps.LatLng(endLocation?.lat || 0, endLocation?.lng || 0),
            steps: [],
            traffic_speed_entry: [],
            via_waypoints: []
          }],
          overview_path: selectedRoute.path.map(([lat, lng]) => new google.maps.LatLng(lat, lng)),
          overview_polyline: '',
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(currentLocation?.lat || 0, currentLocation?.lng || 0),
            new google.maps.LatLng(endLocation?.lat || 0, endLocation?.lng || 0)
          ),
          copyrights: '',
          warnings: [],
          waypoint_order: [],
          summary: ''
        }]
      };
      directionsRendererRef.current.setDirections(directionsResult);
    }
  }, [selectedRoute, currentLocation, endLocation]);

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
      onClick={(e) => {
        if (e.latLng) {
          onLocationSelect({
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
          });
        }
      }}
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