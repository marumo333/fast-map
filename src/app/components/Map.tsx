'use client';
import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { Location } from '@/types/location';
import { Route } from '@/types/route';

// 静的なライブラリ配列を定義
const GOOGLE_MAPS_LIBRARIES: ("marker")[] = ["marker"];

// Map IDを定義
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID || '';

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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setIsMapReady(true);
  }, []);

  const onUnmount = useCallback(() => {
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
  React.useEffect(() => {
    if (!map || !currentLocation || !isMapReady) return;

    // 既存のマーカーを削除
    if (marker) {
      marker.map = null;
    }

    // 新しいマーカーを作成
    const newMarker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: currentLocation.lat, lng: currentLocation.lng },
      content: createMarkerContent()
    });

    setMarker(newMarker);

    return () => {
      if (newMarker) {
        newMarker.map = null;
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

  if (!isLoaded) {
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