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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      try {
        const L = await import('leaflet');
        LRef.current = L.default;

        if (!LRef.current || !mapContainerRef.current || mapRef.current) return;

        mapRef.current = LRef.current.map(mapContainerRef.current, {
          zoomControl: false,
        }).setView([35.6812, 139.7671], 13);

        LRef.current.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);

        LRef.current.control.zoom({
          position: 'bottomright'
        }).addTo(mapRef.current);

        // 地図クリックイベントの追加
        mapRef.current.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          onLocationSelect({ lat, lng });
        });

        setIsMapReady(true);
      } catch (error) {
        console.error('Leafletの読み込みに失敗しました:', error);
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
    if (!LRef.current || !currentLocation || !mapRef.current) return;

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
  }, [currentLocation]);

  // ルートの更新
  useEffect(() => {
    if (!LRef.current || !selectedRoute || !mapRef.current) return;

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
  }, [selectedRoute]);

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