'use client';
import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { Location } from '../types/location';
import { Route } from '../types/route';

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<google.maps.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showLocationButton, setShowLocationButton] = useState(false);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: 'weekly',
    mapIds: [MAP_ID]
  });

  // 現在位置を取得する関数
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setMapError('お使いのブラウザは位置情報をサポートしていません。');
      return;
    }

    setIsLocating(true);
    setHasRequestedLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        onLocationSelect(location);
        setIsLocating(false);
      },
      (error) => {
        console.error('位置情報の取得に失敗しました:', error);
        setMapError('位置情報の取得に失敗しました。位置情報の使用を許可してください。');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, [onLocationSelect]);

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps APIの読み込みエラー:', loadError);
      setMapError('地図の読み込みに失敗しました。APIキーを確認してください。');
    }
  }, [loadError]);

  const onLoad = useCallback((map: google.maps.Map) => {
    console.log('地図の読み込みが完了しました');
    setMap(map);
    setIsMapReady(true);
    setMapError(null);

    // 地図の初期表示位置を設定
    if (currentLocation) {
      map.panTo({ lat: currentLocation.lat, lng: currentLocation.lng });
      map.setZoom(15);
    }
  }, [currentLocation]);

  const onUnmount = useCallback(() => {
    console.log('地図のアンロードが完了しました');
    setMap(null);
    setIsMapReady(false);
    setCurrentMarker(null);
    setDestinationMarker(null);
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const location = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      onLocationSelect(location);
    }
  };

  // 現在位置のマーカーを更新
  useEffect(() => {
    if (map && currentLocation) {
      if (currentMarker) {
        currentMarker.setMap(null);
      }
      const marker = new google.maps.Marker({
        position: currentLocation,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      setCurrentMarker(marker);
    }
  }, [map, currentLocation, currentMarker]);

  // 目的地のマーカーを更新
  useEffect(() => {
    if (map && endLocation) {
      if (destinationMarker) {
        destinationMarker.setMap(null);
      }
      const marker = new google.maps.Marker({
        position: endLocation,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      setDestinationMarker(marker);
    }
  }, [map, endLocation, destinationMarker]);

  // ルートのパスを描画
  const renderRoute = () => {
    if (!selectedRoute || !map) return null;

    // ルートのパスを取得
    const path = selectedRoute.path.map(point => ({
      lat: point[0],
      lng: point[1]
    }));

    // ルートの色を設定（有料道路の場合は赤、それ以外は青）
    const strokeColor = selectedRoute.isTollRoad ? '#FF0000' : '#3B82F6';

    // パスが2点以上ある場合のみ描画
    if (path.length < 2) return null;

    return (
      <Polyline
        path={path}
        options={{
          strokeColor,
          strokeWeight: 6,
          strokeOpacity: 0.8,
          geodesic: true,
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: strokeColor,
              },
              offset: '50%',
              repeat: '100px'
            },
          ],
        }}
      />
    );
  };

  // 地図の表示範囲を調整
  useEffect(() => {
    if (!map || !selectedRoute) return;

    const bounds = new google.maps.LatLngBounds();
    
    // 出発地と目的地を境界に追加
    if (currentLocation) {
      bounds.extend({ lat: currentLocation.lat, lng: currentLocation.lng });
    }
    if (endLocation) {
      bounds.extend({ lat: endLocation.lat, lng: endLocation.lng });
    }

    // ルートのパスを境界に追加
    selectedRoute.path.forEach(point => {
      bounds.extend({ lat: point[0], lng: point[1] });
    });

    // 地図の表示範囲を調整
    map.fitBounds(bounds);

    // 必要に応じてズームレベルを調整
    const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      const currentZoom = map.getZoom();
      if (currentZoom && currentZoom > 15) {
        map.setZoom(15);
      }
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [map, selectedRoute, currentLocation, endLocation]);

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-red-600">{mapError}</div>
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
    <div 
      className="relative w-full h-full" 
      style={{ minHeight: '400px' }}
      onMouseMove={() => setShowLocationButton(true)}
      onMouseLeave={() => setShowLocationButton(false)}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          minZoom: 5,
          maxZoom: 18,
          mapId: MAP_ID,
          mapTypeId: 'roadmap',
          gestureHandling: 'greedy'
        }}
      >
        {renderRoute()}
      </GoogleMap>
      {showLocationButton && !hasRequestedLocation && (
        <button
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-300"
          title="現在地を取得"
        >
          {isLocating ? (
            <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default Map; 