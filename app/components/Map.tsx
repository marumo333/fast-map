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
  const [shouldUpdateStartLocation, setShouldUpdateStartLocation] = useState(false);
  const [shouldUpdateEndLocation, setShouldUpdateEndLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [routeOptions, setRouteOptions] = useState<React.ReactNode | null>(null);
  const [showRouteOptions, setShowRouteOptions] = useState(true);
  const [shouldSearchRoute, setShouldSearchRoute] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 現在地が更新された時のみ出発地を更新
  useEffect(() => {
    if (shouldUpdateStartLocation && currentLocation) {
      onMapClick?.(currentLocation);
      setShouldUpdateStartLocation(false);
      setShouldSearchRoute(true);
      setHasError(false); // エラーフラグをリセット
    }
  }, [currentLocation, shouldUpdateStartLocation, onMapClick]);

  // 目的地が更新された時のみ目的地を更新
  useEffect(() => {
    if (shouldUpdateEndLocation && endLocation) {
      setShouldUpdateEndLocation(false);
      setShouldSearchRoute(true);
      setHasError(false); // エラーフラグをリセット
    }
  }, [endLocation, shouldUpdateEndLocation]);

  // 現在地取得ボタンが押された時のハンドラ
  const handleGetCurrentLocation = useCallback(() => {
    setShouldUpdateStartLocation(true);
  }, []);

  // 目的地選択時のハンドラ
  const handleEndLocationSelect = useCallback(() => {
    setShouldUpdateEndLocation(true);
  }, []);

  // 現在地取得ボタンのイベントリスナーを設定
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'getCurrentLocation') {
        handleGetCurrentLocation();
      } else if (event.data === 'selectEndLocation') {
        handleEndLocationSelect();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleGetCurrentLocation, handleEndLocationSelect]);

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

    // 出発地のマーカーを設定（現在地取得ボタンが押された時のみ更新）
    if (shouldUpdateStartLocation && startLocation) {
      if (markersRef.current.start) {
        markersRef.current.start.map = null;
        markersRef.current.start = undefined;
      }
      const startMarker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: startLocation,
        content: createCustomMarker('出発地', '#10B981')
      });
      markersRef.current.start = startMarker;
    }

    // 目的地のマーカーを設定（目的地選択時のみ更新）
    if (shouldUpdateEndLocation && endLocation) {
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
    if (startLocation && endLocation && shouldFitBounds && !hasFitBounds) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(startLocation);
      bounds.extend(endLocation);
      mapInstanceRef.current.fitBounds(bounds);
      setHasFitBounds(true);
      onFitBoundsComplete?.();
    }
  }, [currentLocation, startLocation, endLocation, shouldFitBounds, onFitBoundsComplete, hasCenteredCurrent, hasFitBounds, shouldUpdateStartLocation, shouldUpdateEndLocation]);

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

  // ルート検索を実行する関数
  const executeRouteSearch = useCallback(async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current || !startLocation || !endLocation) {
      return;
    }

    // 既に検索中の場合、エラーが発生している場合、または検索が必要ない場合は中断
    if (isSearching || hasError || !shouldSearchRoute) {
      return;
    }

    setIsSearching(true);
    setRouteError(null);
    setShouldSearchRoute(false);

    try {
      const result = await directionsServiceRef.current.route({
        origin: startLocation,
        destination: endLocation,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      });

      if (result.routes.length > 0) {
        directionsRendererRef.current.setDirections(result);
        onRouteSelect(result.routes[0]);

        if (result.routes.length > 1) {
          const routeOptions = result.routes.map((route, index) => {
            const isShortest = index === 0;
            const isLessCongested = index === 1;
            return {
              route,
              type: isShortest ? '最短ルート' : isLessCongested ? '混雑回避ルート' : 'その他のルート'
            };
          });
          setRouteOptions(
            <div className="space-y-2">
              {routeOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleRouteClick(option.route)}
                  className="w-full p-2 text-left hover:bg-gray-100 rounded"
                >
                  <div className="font-medium">{option.type}</div>
                  <div className="text-sm text-gray-600">
                    距離: {option.route.legs[0]?.distance?.value ? (option.route.legs[0].distance.value / 1000).toFixed(1) : '不明'}km
                    所要時間: {option.route.legs[0]?.duration?.value ? Math.ceil(option.route.legs[0].duration.value / 60) : '不明'}分
                  </div>
                </button>
              ))}
            </div>
          );
        }
      }
    } catch (error) {
      console.error('ルート計算に失敗:', error);
      setRouteError('ルート計算に失敗しました。しばらく時間をおいて再度お試しください。');
      setHasError(true); // エラーフラグを設定
      // エラー発生時はルートをクリア
      if (directionsRendererRef.current) {
        const emptyResult: google.maps.DirectionsResult = {
          routes: [],
          request: {
            origin: startLocation,
            destination: endLocation,
            travelMode: google.maps.TravelMode.DRIVING
          }
        };
        directionsRendererRef.current.setDirections(emptyResult);
      }
    } finally {
      setIsSearching(false);
    }
  }, [startLocation, endLocation, onRouteSelect, isSearching, hasError, shouldSearchRoute]);

  // 位置情報が変更されたときのみルート検索を実行
  useEffect(() => {
    if (startLocation && endLocation && !hasError) {
      executeRouteSearch();
    }
  }, [startLocation, endLocation, executeRouteSearch, hasError]);

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

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {startLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium">出発地: {startLocation.address || '選択済み'}</span>
          </div>
        </div>
      )}
      {endLocation && (
        <div className="absolute top-16 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium">目的地: {endLocation.address || '選択済み'}</span>
          </div>
        </div>
      )}
      {routeError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg z-10">
          {routeError}
        </div>
      )}
      {isSearching && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded shadow-lg z-10">
          ルートを検索中...
        </div>
      )}
      {routeOptions && showRouteOptions && (
        <div className="absolute bottom-4 left-4 right-4 max-h-[40vh] overflow-y-auto bg-white rounded-lg shadow-lg p-4">
          {routeOptions}
        </div>
      )}
    </div>
  );
};

export default Map; 