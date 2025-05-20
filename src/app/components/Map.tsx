import React, { useEffect, useRef } from 'react';
import { Map as LeafletMap, TileLayer, Marker, Polyline, Control, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/types/location';
import { Route } from '@/types/route';

type MapProps = {
  selectedRoute: Route | null;
  currentLocation: Location | null;
};

const Map: React.FC<MapProps> = ({ selectedRoute, currentLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const routeLayerRef = useRef<Polyline | null>(null);
  const currentLocationMarkerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new LeafletMap(mapContainerRef.current, {
        zoomControl: false, // デフォルトのズームコントロールを無効化
      }).setView([35.6812, 139.7671], 13);

      // タイルレイヤーの追加
      new TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // カスタムズームコントロールの追加（右下に配置）
      new Control.Zoom({
        position: 'bottomright'
      }).addTo(mapRef.current);
    }
  }, []);

  // 現在地の更新
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      if (currentLocationMarkerRef.current) {
        mapRef.current.removeLayer(currentLocationMarkerRef.current);
      }

      // 現在地マーカーの作成
      const marker = new Marker([currentLocation.lat, currentLocation.lng], {
        icon: divIcon({
          className: 'current-location-marker',
          html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(mapRef.current);

      currentLocationMarkerRef.current = marker;
    }
  }, [currentLocation]);

  // ルートの更新
  useEffect(() => {
    if (selectedRoute && mapRef.current) {
      const startTime = performance.now();
      console.log('ルート描画開始:', {
        timestamp: new Date().toISOString(),
        routeId: selectedRoute.routeId,
        pathLength: selectedRoute.path.length
      });

      // 既存のルートをクリア
      if (routeLayerRef.current) {
        mapRef.current.removeLayer(routeLayerRef.current);
      }

      // 新しいルートを描画
      const routeLayer = new Polyline(selectedRoute.path, {
        color: selectedRoute.isTollRoad ? '#FF0000' : '#00FF00',
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(mapRef.current);

      // ルートの境界を取得してマップをフィット
      const bounds = routeLayer.getBounds();
      mapRef.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15
      });

      // レイヤー参照を保存
      routeLayerRef.current = routeLayer;

      const endTime = performance.now();
      console.log('ルート描画完了:', {
        routeId: selectedRoute.routeId,
        pathLength: selectedRoute.path.length,
        distance: selectedRoute.distance,
        duration: selectedRoute.duration,
        color: selectedRoute.isTollRoad ? '#FF0000' : '#00FF00',
        processingTime: `${(endTime - startTime).toFixed(2)}ms`
      });
    }
  }, [selectedRoute]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full"
      style={{ touchAction: 'none' }} // モバイルでのタッチ操作を最適化
    />
  );
};

export default Map; 