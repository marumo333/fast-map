'use client';
import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { Location } from '../types/location';
import { useLocation } from '../contexts/LocationContext';
import { initializeGoogleMaps, createCustomMarker } from '../utils/googleMaps';

interface MapProps {
  startLocation: Location | null;
  endLocation: Location | null;
  onRouteSelect: (route: google.maps.DirectionsRoute) => void;
  selectedRoute: google.maps.DirectionsRoute | null;
  suggestedRoute: google.maps.DirectionsRoute | null;
  onMapClick?: (location: Location) => void;
  shouldFitBounds?: boolean;
  onFitBoundsComplete?: () => void;
}

const Map: React.FC<MapProps> = ({
  startLocation,
  endLocation,
  onRouteSelect,
  selectedRoute,
  suggestedRoute,
  onMapClick,
  shouldFitBounds = false,
  onFitBoundsComplete
}) => {
  const { currentLocation } = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<{
    current?: google.maps.marker.AdvancedMarkerElement;
    start?: google.maps.marker.AdvancedMarkerElement;
    end?: google.maps.marker.AdvancedMarkerElement;
  }>({});
  const [hasFitBounds, setHasFitBounds] = useState(false);
  const [hasCenteredCurrent, setHasCenteredCurrent] = useState(false);

  const initializeMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const { Map, DirectionsService, DirectionsRenderer } = await initializeGoogleMaps();
      
      const map = new Map(mapRef.current, {
        center: { lat: 35.6812, lng: 139.7671 },
        zoom: 12,
        mapId: 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      const directionsService = new DirectionsService();
      const directionsRenderer = new DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 5
        }
      });

      mapInstanceRef.current = map;
      directionsServiceRef.current = directionsService;
      directionsRendererRef.current = directionsRenderer;

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng && onMapClick) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          console.log('地図クリック:', { lat, lng });  // デバッグ用
          onMapClick({
            lat,
            lng
          });
        }
      });

      // クリックイベントの伝播を停止
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        e.stop();
      });
    } catch (error) {
      console.error('地図の初期化に失敗:', error);
    }
  }, [onMapClick]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  const updateMarkers = useCallback(async () => {
    if (!mapInstanceRef.current) return;

    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

    // 既存のマーカーをクリア（現在地のマーカーのみ）
    if (markersRef.current.current) {
      markersRef.current.current.map = null;
      markersRef.current.current = undefined;
    }

    // 現在地のマーカーを設定
    if (currentLocation) {
      const newCurrentMarker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: currentLocation,
        content: createCustomMarker('現在地', '#3B82F6')
      });
      markersRef.current.current = newCurrentMarker;
      // 初回のみセンター・ズーム
      if (!hasCenteredCurrent) {
        mapInstanceRef.current.setCenter(currentLocation);
        mapInstanceRef.current.setZoom(15);
        setHasCenteredCurrent(true);
      }
    }

    // 出発地のマーカーを設定（初回のみ）
    if (startLocation && !markersRef.current.start) {
      const startMarker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: startLocation,
        content: createCustomMarker('出発地', '#10B981')
      });
      markersRef.current.start = startMarker;
    }

    // 目的地のマーカーを設定（毎回更新）
    if (endLocation) {
      if (markersRef.current.end) {
        markersRef.current.end.map = null;
        markersRef.current.end = undefined;
      }
      const endMarker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: endLocation,
        content: createCustomMarker('目的地', '#EF4444')
      });
      markersRef.current.end = endMarker;
    }

    // 目的地選択時のみfitBoundsを一度だけ実行
    if (startLocation && endLocation && shouldFitBounds) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(startLocation);
      bounds.extend(endLocation);
      mapInstanceRef.current.fitBounds(bounds);
      onFitBoundsComplete?.();
    }
  }, [currentLocation, startLocation, endLocation, shouldFitBounds, onFitBoundsComplete, hasCenteredCurrent]);

  // 現在地が変わったときだけセンターフラグをリセット
  useEffect(() => {
    setHasCenteredCurrent(false);
  }, [currentLocation]);

  // shouldFitBoundsがtrueになったときだけfitBoundsフラグをリセット
  useEffect(() => {
    if (shouldFitBounds) {
      setHasFitBounds(false);
    }
  }, [shouldFitBounds]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  const calculateRoute = useCallback(async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !startLocation || !endLocation) return;

    try {
      const result = await directionsServiceRef.current.route({
        origin: startLocation,
        destination: endLocation,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      });

      if (result.routes.length > 0) {
        console.log('ルート計算結果:', result);
        directionsRendererRef.current.setDirections(result);
        onRouteSelect(result.routes[0]);

        // 代替ルートを表示
        if (result.routes.length > 1) {
          const routeOptions = result.routes.map((route, index) => {
            const isShortest = index === 0;
            const isLessCongested = index === 1;
            return {
              route,
              type: isShortest ? '最短ルート' : isLessCongested ? '混雑回避ルート' : 'その他のルート'
            };
          });
          console.log('代替ルート:', routeOptions);
        }
      }
    } catch (error) {
      console.error('ルート計算に失敗:', error);
    }
  }, [startLocation, endLocation, onRouteSelect]);

  useEffect(() => {
    if (startLocation && endLocation) {
      calculateRoute();
    }
  }, [startLocation, endLocation, calculateRoute]);

  const handleRouteClick = useCallback((route: google.maps.DirectionsRoute) => {
    if (!directionsRendererRef.current) return;
    const directions = directionsRendererRef.current.getDirections();
    if (directions) {
      const routeIndex = directions.routes.indexOf(route);
      if (routeIndex !== -1) {
        // ルートの表示を更新
        directionsRendererRef.current.setDirections({
          ...directions,
          routes: [route]
        });
        onRouteSelect(route);
        // ルート選択時に選択肢欄を非表示にする
        setShowRouteOptions(false);
      }
    }
  }, [onRouteSelect]);

  const [showRouteOptions, setShowRouteOptions] = useState(true);

  const routeOptions = useMemo(() => {
    if (!showRouteOptions) return null;
    
    const directions = directionsRendererRef.current?.getDirections();
    if (!directions?.routes) return null;

    return directions.routes.map((route, index) => {
      const isSelected = selectedRoute === route;
      const isSuggested = suggestedRoute === route;
      const hasToll = route.legs.some(leg => 
        leg.steps.some(step => 'toll' in step && step.toll)
      );
      const routeType = index === 0 ? '最短ルート' : index === 1 ? '混雑回避ルート' : 'その他のルート';

      return (
        <div
          key={index}
          onClick={() => handleRouteClick(route)}
          className={`p-4 mb-2 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-100 border-2 border-blue-500'
              : isSuggested
              ? 'bg-green-100 border-2 border-green-500'
              : 'bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-gray-900">
                {routeType}
              </div>
              <div className="text-sm text-gray-600">
                {route.legs[0].distance?.text} ({route.legs[0].duration?.text})
              </div>
              {hasToll && (
                <div className="text-sm text-red-600 mt-1">
                  有料道路を含む
                </div>
              )}
            </div>
            {isSelected && (
              <div className="text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </div>
      );
    });
  }, [selectedRoute, suggestedRoute, handleRouteClick, showRouteOptions]);

  return (
    <div className="relative h-full">
      <div ref={mapRef} className="w-full h-full" />
      {routeOptions && (
        <div className="absolute bottom-4 left-4 right-4 max-h-[40vh] overflow-y-auto bg-white rounded-lg shadow-lg p-4">
          {routeOptions}
        </div>
      )}
    </div>
  );
};

export default Map; 