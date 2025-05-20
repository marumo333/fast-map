'use client';
import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/types/location';
import { Route } from '@/types/route';

type MapProps = {
  selectedRoute: Route | null;
  currentLocation: Location | null;
  onLocationSelect: (location: Location) => void;
};

const Map: React.FC<MapProps> = ({ selectedRoute, currentLocation, onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      try {
        const L = await import('leaflet');
        LRef.current = L.default;

        if (!LRef.current || !mapContainerRef.current || mapRef.current) return;

        // 地図の初期化
        mapRef.current = LRef.current.map(mapContainerRef.current, {
          zoomControl: false,
          center: [35.6812, 139.7671],
          zoom: 13,
          minZoom: 5,
          maxZoom: 18
        });

        // タイルレイヤーの追加
        LRef.current.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(mapRef.current);

        // ズームコントロールの追加
        LRef.current.control.zoom({
          position: 'bottomright'
        }).addTo(mapRef.current);

        // 地図クリックイベントの追加
        mapRef.current.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          onLocationSelect({ lat, lng });
        });

        setIsMapReady(true);
        setError(null);
      } catch (error) {
        console.error('Leafletの読み込みに失敗しました:', error);
        setError('地図の読み込みに失敗しました。ページを再読み込みしてください。');
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onLocationSelect]);

  // 現在地の更新
  useEffect(() => {
    if (!LRef.current || !currentLocation || !mapRef.current || !isMapReady) return;

    try {
      if (currentLocationMarkerRef.current) {
        mapRef.current.removeLayer(currentLocationMarkerRef.current);
      }

      const marker = LRef.current.marker([currentLocation.lat, currentLocation.lng], {
        icon: LRef.current.divIcon({
          className: 'current-location-marker',
          html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(mapRef.current);

      currentLocationMarkerRef.current = marker;
    } catch (error) {
      console.error('現在地マーカーの更新に失敗しました:', error);
    }
  }, [currentLocation, isMapReady]);

  // ルートの更新
  useEffect(() => {
    if (!LRef.current || !selectedRoute || !mapRef.current || !isMapReady) return;

    try {
      if (routeLayerRef.current) {
        mapRef.current.removeLayer(routeLayerRef.current);
      }

      const routeLayer = LRef.current.polyline(selectedRoute.path, {
        color: selectedRoute.isTollRoad ? '#FF0000' : '#00FF00',
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(mapRef.current);

      const bounds = routeLayer.getBounds();
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });

      routeLayerRef.current = routeLayer;
    } catch (error) {
      console.error('ルートの更新に失敗しました:', error);
    }
  }, [selectedRoute, isMapReady]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-gray-600">地図を読み込み中...</div>
        </div>
      )}
    </div>
  );
};

export default Map; 