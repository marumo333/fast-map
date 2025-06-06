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

// 位置比較用ユーティリティ
function getLatLngFromPosition(position: any) {
  if (!position) return { lat: undefined, lng: undefined };
  if (typeof position.lat === 'function' && typeof position.lng === 'function') {
    // google.maps.LatLngインスタンス
    return { lat: position.lat(), lng: position.lng() };
  } else {
    // LatLngLiteral
    return { lat: position.lat, lng: position.lng };
  }
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
  const [routeError, setRouteError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

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

      // クリックイベントの伝播を停止
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        e.stop();
      });
    } catch (error) {
      console.error('地図の初期化に失敗:', error);
    }
  }, []);

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

    // 出発地のマーカーを設定（位置が変わったときだけ更新）
    const startPos = getLatLngFromPosition(markersRef.current.start?.position);
    const shouldUpdateStart = !markersRef.current.start || 
      !startLocation || 
      (startPos.lat !== startLocation.lat || startPos.lng !== startLocation.lng);

    if (shouldUpdateStart) {
      if (markersRef.current.start) {
        markersRef.current.start.map = null;
        markersRef.current.start = undefined;
      }
      if (startLocation) {
        const startMarker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: startLocation,
          content: createCustomMarker('出発地', '#10B981')
        });
        markersRef.current.start = startMarker;
      }
    }

    // 目的地のマーカーを設定（位置が変わったときだけ更新）
    const endPos = getLatLngFromPosition(markersRef.current.end?.position);
    const shouldUpdateEnd = !markersRef.current.end || 
      !endLocation || 
      (endPos.lat !== endLocation.lat || endPos.lng !== endLocation.lng);

    if (shouldUpdateEnd) {
      if (markersRef.current.end) {
        markersRef.current.end.map = null;
        markersRef.current.end = undefined;
      }
      if (endLocation) {
        const endMarker = new AdvancedMarkerElement({
          map: mapInstanceRef.current,
          position: endLocation,
          content: createCustomMarker('目的地', '#EF4444')
        });
        markersRef.current.end = endMarker;
      }
    }

    // 目的地選択時のみfitBoundsを一度だけ実行
    if (startLocation && endLocation && shouldFitBounds && !hasFitBounds) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(startLocation);
      bounds.extend(endLocation);
      mapInstanceRef.current.fitBounds(bounds);
      setHasFitBounds(true);
      onFitBoundsComplete?.();
    }
  }, [currentLocation, startLocation, endLocation, shouldFitBounds, onFitBoundsComplete, hasCenteredCurrent, hasFitBounds]);

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

  // マーカーの更新を最適化
  useEffect(() => {
    const shouldUpdate = 
      currentLocation !== null || 
      startLocation !== null || 
      endLocation !== null || 
      shouldFitBounds;

    if (shouldUpdate) {
      updateMarkers();
    }
  }, [currentLocation, startLocation, endLocation, shouldFitBounds, updateMarkers]);

  const calculateRoute = useCallback(async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !startLocation || !endLocation) return;

    // エラー状態をリセット
    setRouteError(null);

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
        setRetryCount(0); // 成功したらリトライカウントをリセット

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
      setRetryCount(prev => prev + 1);
      
      if (retryCount < MAX_RETRIES) {
        setRouteError(`ルート計算に失敗しました。再試行中... (${retryCount + 1}/${MAX_RETRIES})`);
        // 3秒後に再試行
        setTimeout(() => {
          calculateRoute();
        }, 3000);
      } else {
        setRouteError('ルート計算に失敗しました。しばらく時間をおいて再度お試しください。');
        // リトライカウントをリセット
        setRetryCount(0);
      }
    }
  }, [startLocation, endLocation, onRouteSelect, retryCount]);

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

  // クリックリスナーを管理するuseEffect
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapClick) return;

    const map = mapInstanceRef.current;
    let isListenerActive = true;

    const handleClick = (e: google.maps.MapMouseEvent) => {
      if (!isListenerActive) return;
      
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onMapClick({ lat, lng });
      }
    };

    // クリックイベントの伝播を停止
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      e.stop();
    });

    // 新しいクリックリスナーを登録
    const listener = map.addListener('click', handleClick);

    // クリーンアップ
    return () => {
      isListenerActive = false;
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [onMapClick]); // onMapClickが変更されるたびにリスナーを更新

  // ルート計算のuseEffectを最適化
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const calculateRouteWithDebounce = async () => {
      if (!directionsServiceRef.current || !directionsRendererRef.current || !startLocation || !endLocation) return;

      try {
        const result = await directionsServiceRef.current.route({
          origin: startLocation,
          destination: endLocation,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true
        });

        if (!isMounted) return;

        if (result.routes.length > 0) {
          directionsRendererRef.current.setDirections(result);
          onRouteSelect(result.routes[0]);

          if (result.routes.length > 1) {
            const routeOptions = result.routes.map((route, index) => ({
              route,
              type: index === 0 ? '最短ルート' : index === 1 ? '混雑回避ルート' : 'その他のルート'
            }));
            console.log('代替ルート:', routeOptions);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('ルート計算に失敗:', error);
        }
      }
    };

    // デバウンス処理を追加
    timeoutId = setTimeout(calculateRouteWithDebounce, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [startLocation, endLocation, onRouteSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {routeError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg z-10">
          {routeError}
        </div>
      )}
      {routeOptions && (
        <div className="absolute bottom-4 left-4 right-4 max-h-[40vh] overflow-y-auto bg-white rounded-lg shadow-lg p-4">
          {routeOptions}
        </div>
      )}
    </div>
  );
};

export default Map; 