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

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      if (!mapRef.current) return;

      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      const map = new Map(mapRef.current, {
        center: { lat: 35.6812, lng: 139.7671 },
        zoom: 13,
        mapId: 'fast-map',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      mapInstanceRef.current = map;
      console.log('地図の読み込みが完了しました');

      // 現在地を取得
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('現在地を取得しました:', { lat: latitude, lng: longitude });
            map.setCenter({ lat: latitude, lng: longitude });
          },
          (error) => {
            console.error('位置情報の取得に失敗:', error);
          }
        );
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMarkers = async () => {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

      // 既存のマーカーを削除
      Object.values(markersRef.current).forEach(marker => marker.map = null);
      markersRef.current = {};

      // 現在地のマーカーを追加
      if (currentLocation) {
        const currentMarker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: currentLocation,
          title: '現在地'
        });
        markersRef.current['current'] = currentMarker;
      }

      // 目的地のマーカーを追加
      if (destination) {
        const destinationMarker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: destination,
          title: '目的地'
        });
        markersRef.current['destination'] = destinationMarker;
      }
    };

    updateMarkers();
  }, [currentLocation, destination]);

  useEffect(() => {
    if (!mapInstanceRef.current || !currentLocation || !destination) return;

    const calculateRoute = async () => {
      if (!currentLocation || !destination) return;

      try {
        const routes = await searchRoute(
          [currentLocation.lat, currentLocation.lng],
          [destination.lat, destination.lng]
        );
        if (routes && routes.length > 0) {
          setRoute(routes[0]);
        }
      } catch (error) {
        console.error('ルート検索に失敗:', error);
      }
    };

    calculateRoute();
  }, [currentLocation, destination, setRoute]);

  useEffect(() => {
    if (route && directionsRendererRef.current) {
      const directionsResult: google.maps.DirectionsResult = {
        request: {
          origin: { lat: currentLocation?.lat || 0, lng: currentLocation?.lng || 0 },
          destination: { lat: destination?.lat || 0, lng: destination?.lng || 0 },
          travelMode: google.maps.TravelMode.DRIVING
        },
        routes: [{
          legs: [{
            distance: { text: `${route.distance}km`, value: route.distance * 1000 },
            duration: { text: `${route.duration.driving}分`, value: (route.duration.driving || 0) * 60 },
            duration_in_traffic: { text: `${route.duration_in_traffic}分`, value: route.duration_in_traffic * 60 },
            start_address: '',
            end_address: '',
            start_location: new google.maps.LatLng(currentLocation?.lat || 0, currentLocation?.lng || 0),
            end_location: new google.maps.LatLng(destination?.lat || 0, destination?.lng || 0),
            steps: [],
            traffic_speed_entry: [],
            via_waypoints: []
          }],
          overview_path: route.path.map(([lat, lng]) => new google.maps.LatLng(lat, lng)),
          overview_polyline: '',
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(currentLocation?.lat || 0, currentLocation?.lng || 0),
            new google.maps.LatLng(destination?.lat || 0, destination?.lng || 0)
          ),
          copyrights: '',
          warnings: [],
          waypoint_order: [],
          summary: ''
        }]
      };
      directionsRendererRef.current.setDirections(directionsResult);
    }
  }, [route, currentLocation, destination]);

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
    <div ref={mapRef} className="relative w-full h-full" style={{ minHeight: '400px' }} />
  );
};

export default Map; 