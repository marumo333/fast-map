'use client';
import React, { useCallback, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { Location } from '@/types/location';
import { Route } from '@/types/route';

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
};

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 35.6812,
  lng: 139.7671
};

const Map: React.FC<MapProps> = ({ selectedRoute, currentLocation, onLocationSelect }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [marker, setMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
    version: 'weekly'
  });

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
  }, []);

  const onUnmount = useCallback(() => {
    console.log('地図のアンロードが完了しました');
    setMap(null);
    setIsMapReady(false);
    setMarker(null);
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onLocationSelect({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  };

  // 現在位置のマーカーを更新
  useEffect(() => {
    console.log('現在位置の更新を検知:', currentLocation);
    if (!map || !currentLocation || !isMapReady) {
      console.log('地図の準備ができていないか、現在位置がありません');
      return;
    }

    try {
      // 既存のマーカーを削除
      if (marker) {
        console.log('既存のマーカーを削除');
        marker.map = null;
      }

      // 新しいマーカーを作成
      console.log('新しいマーカーを作成:', currentLocation);
      const newMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        content: createMarkerContent()
      });

      setMarker(newMarker);

      // 地図の中心位置を現在地に更新
      console.log('地図の中心位置を更新:', currentLocation);
      map.panTo({ lat: currentLocation.lat, lng: currentLocation.lng });
      map.setZoom(15); // 現在地にズーム
    } catch (error) {
      console.error('マーカーの作成に失敗しました:', error);
      setMapError('マーカーの表示に失敗しました。');
    }

    return () => {
      if (marker) {
        console.log('マーカーのクリーンアップ');
        marker.map = null;
      }
    };
  }, [map, currentLocation, isMapReady]);

  // マーカーのコンテンツを作成
  const createMarkerContent = () => {
    const div = document.createElement('div');
    div.style.width = '16px';
    div.style.height = '16px';
    div.style.backgroundColor = '#3B82F6';
    div.style.border = '2px solid #FFFFFF';
    div.style.borderRadius = '50%';
    return div;
  };

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-red-600">{mapError}</div>
      </div>
    );
  }

  if (!isLoaded) {
    console.log('地図の読み込み中...');
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">地図を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
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
          mapTypeId: 'roadmap'
        }}
      >
        {selectedRoute && (
          <Polyline
            path={selectedRoute.path.map(point => ({
              lat: point[0],
              lng: point[1]
            }))}
            options={{
              strokeColor: selectedRoute.isTollRoad ? '#FF0000' : '#00FF00',
              strokeWeight: 6,
              strokeOpacity: 0.8
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default Map; 