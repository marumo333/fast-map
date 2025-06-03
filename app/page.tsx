'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import RouteSelector from './components/RouteSelector';
import { useTrafficPolling } from './utils/trafficPolling';
import { Location } from './types/location';
import { Route } from './types/route';
import { useRouteChangeDetection } from './hooks/useRouteChangeDetection';
import RouteNotification from './components/RouteNotification';
import RouteInfo from './components/RouteInfo';
import RouteRecommendation from './components/RouteRecomendation';
import dynamic from 'next/dynamic';
import { useLocation } from './contexts/LocationContext';
import SearchForm from './components/SearchForm';
import Navbar from './components/Navbar';
import { useTheme } from './settings/ThemeContext';
import { getAddressFromLocation } from './utils/geocoding';

// Notification型を定義
type Notification = {
  type: 'congestion' | 'accident' | 'construction';
  message: string;
  alternativeRoute?: Route;
};

// 位置情報の型を拡張
type LocationWithAddress = Location & {
  address?: string;
};

// Mapコンポーネントのpropsの型を更新
interface MapComponentProps {
  startLocation: Location | null;
  endLocation: Location | null;
  onRouteSelect: (route: google.maps.DirectionsRoute) => void;
  selectedRoute: google.maps.DirectionsRoute | null;
  suggestedRoute: google.maps.DirectionsRoute | null;
  onMapClick: (location: google.maps.LatLng) => void;
}

// Leafletのマップコンポーネントを動的にインポート
const Map = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
      <div className="text-gray-600 dark:text-gray-300 transition-colors duration-300">地図を読み込み中...</div>
    </div>
  )
});

// LocationInfoコンポーネントを通常の関数コンポーネントとして分離
const LocationInfo: React.FC<{ location: LocationWithAddress | null, label: string, setStartLocation: any, setEndLocation: any, getAddressFromLocation: (location: Location) => Promise<string> }> = ({ location, label, setStartLocation, setEndLocation, getAddressFromLocation }) => {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (location && !location.address) {
      getAddressFromLocation(location).then(newAddress => {
        setAddress(newAddress);
        if (label === '出発地') {
          setStartLocation((prev: any) => prev ? { ...prev, address: newAddress } : null);
        } else {
          setEndLocation((prev: any) => prev ? { ...prev, address: newAddress } : null);
        }
      });
    } else if (location?.address) {
      setAddress(location.address);
    }
  }, [location, label]);

  if (!location) return null;

  return (
    <div className="flex flex-col space-y-1 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
      <div className="font-medium">{label}:</div>
      <div className="pl-2">
        {address || location.address || '住所を取得中...'}
      </div>
    </div>
  );
};

export default function Home() {
  const { isDarkMode } = useTheme();
  const [startLocation, setStartLocation] = useState<LocationWithAddress | null>(null);
  const [endLocation, setEndLocation] = useState<LocationWithAddress | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showTrafficInfo, setShowTrafficInfo] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearchForm, setShowSearchForm] = useState(true);
  const [canClickMap, setCanClickMap] = useState(false);
  const { currentLocation, getCurrentLocation } = useLocation() as { 
    currentLocation: LocationWithAddress | null;
    getCurrentLocation: () => Promise<void>;
  };

  // 1) マウント直後に現在地を取りに行く
  useEffect(() => {
    getCurrentLocation().catch(err => {
      console.error('初回の位置情報取得に失敗:', err);
      setError('位置情報取得に失敗しました');
    });
  }, []);

  // 2) currentLocation が取れたらすぐ startLocation と canClickMap をセット
  useEffect(() => {
    if (!currentLocation || startLocation) return;

    console.log('初期化: 現在地を出発地として設定:', currentLocation);
    // 緯度経度だけでも即座に出発地にしてしまう
    setStartLocation({ lat: currentLocation.lat, lng: currentLocation.lng });
    // クリックをここで有効化
    setCanClickMap(true);

    // 住所取得は後回し
    (async () => {
      try {
        const addr = await getAddressFromLocation(currentLocation);
        setStartLocation(prev => prev ? { ...prev, address: addr } : null);
      } catch (err) {
        console.error('現在地の住所取得に失敗:', err);
      }
    })();
  }, [currentLocation]);

  const handleTrafficInfoUpdate = useCallback((info: any) => {
    console.log('交通情報更新:', info);
    setTrafficInfo(info);
    setShowTrafficInfo(true);
    setTimeout(() => {
      setShowTrafficInfo(false);
    }, 3000);
  }, []);

  useTrafficPolling(
    selectedRoute?.routeId ?? 0,
    30000,
    handleTrafficInfoUpdate,
    startLocation ?? undefined,
    endLocation ?? undefined
  );

  const handleRouteChange = useCallback((newRoute: Route) => {
    setSelectedRoute(newRoute);
    setShowNotification(true);
  }, []);

  useRouteChangeDetection(
    selectedRoute ?? undefined,
    trafficInfo,
    handleRouteChange
  );

  const handleGetCurrentLocation = async () => {
    try {
      setIsLoading(true);
      await getCurrentLocation();
      if (currentLocation) {
        console.log('現在地を出発地として設定:', currentLocation);
        // 現在地を即座に設定
        const locationWithAddress = { ...currentLocation };
        setStartLocation(locationWithAddress);
        setEndLocation(null);
        setSelectedRoute(null);
        setShowSearchForm(false);
        
        // 住所情報を非同期で更新
        try {
          const address = await getAddressFromLocation(currentLocation);
          setStartLocation(prev => prev ? { ...prev, address } : null);
        } catch (error) {
          console.error('現在地の住所取得に失敗:', error);
        }
      }
    } catch (error) {
      console.error('位置情報の取得に失敗しました:', error);
      setError('位置情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // デバッグ用：startLocationの変更を監視
  useEffect(() => {
    console.log('親: startLocationが変更:', startLocation);
  }, [startLocation]);

  const handleSearch = (start: Location, end: Location) => {
    setStartLocation(start);
    setEndLocation(end);
    setSelectedRoute(null);
    setShowSearchForm(false);
  };

  const handleNotificationAction = useCallback((action: 'accept' | 'dismiss') => {
    if (action === 'accept' && notification?.alternativeRoute) {
      setSelectedRoute(notification.alternativeRoute);
    }
    setNotification(null);
  }, [notification]);

  const handleRouteSelect = (route: google.maps.DirectionsRoute) => {
    if (!route.legs[0] || !route.legs[0].distance || !route.legs[0].duration) {
      console.error('ルート情報が不正です');
      return;
    }

    const selectedRoute: Route = {
      routeId: 1,
      path: route.overview_path.map(latLng => [latLng.lat(), latLng.lng()]),
      distance: route.legs[0].distance.value / 1000,
      duration: route.legs[0].duration.value / 60,
      durationInTraffic: route.legs[0].duration_in_traffic?.value ? route.legs[0].duration_in_traffic.value / 60 : undefined,
      isTollRoad: false,
      toll: 0
    };
    setSelectedRoute(selectedRoute);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    if (!canClickMap) {
      console.warn('出発地をまだ準備中です…');
      return;
    }

    if (!startLocation) {
      console.log('出発地が設定されていません');
      return;
    }

    const newEndLocation = { lat, lng };
    console.log('親: 目的地を設定:', newEndLocation);
    setEndLocation(newEndLocation);
    setSelectedRoute(null);

    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: new google.maps.LatLng(startLocation.lat, startLocation.lng),
        destination: new google.maps.LatLng(lat, lng),
        travelMode: google.maps.TravelMode.DRIVING
      });

      if (result.routes.length > 0) {
        handleRouteSelect(result.routes[0]);
      }
    } catch (error) {
      console.error('経路の計算に失敗しました:', error);
      setError('経路の計算に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
      <div className="w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Navbar onGetCurrentLocation={handleGetCurrentLocation} />
          <div className="flex-grow pb-32 pt-16">
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 左サイドバー */}
                <div className="lg:col-span-1 space-y-6">
                  {showSearchForm && (
                    <div className={`rounded-lg shadow-md p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <SearchForm
                        onSearch={handleSearch}
                        isSearching={isLoading}
                        onClose={() => setShowSearchForm(false)}
                      />
                    </div>
                  )}

                  {/* 位置情報表示 */}
                  <div className={`rounded-lg shadow-md p-6 space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className={`text-lg font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>位置情報</h2>
                    <LocationInfo location={startLocation} label="出発地" setStartLocation={setStartLocation} setEndLocation={setEndLocation} getAddressFromLocation={getAddressFromLocation} />
                    <LocationInfo location={endLocation} label="目的地" setStartLocation={setStartLocation} setEndLocation={setEndLocation} getAddressFromLocation={getAddressFromLocation} />
                  </div>

                  {/* ルート選択 */}
                  {startLocation && endLocation && (
                    <div className={`rounded-lg shadow-md p-6 space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h2 className={`text-lg font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ルート選択</h2>
                      <RouteSelector
                        startLocation={startLocation}
                        endLocation={endLocation}
                        onRouteSelect={setSelectedRoute}
                      />
                    </div>
                  )}

                  {/* ルート情報 */}
                  {selectedRoute && (
                    <div className={`rounded-lg shadow-md p-6 space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h2 className={`text-lg font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ルート情報</h2>
                      <RouteInfo
                        routeInfo={{
                          distance: selectedRoute.distance * 1000,
                          duration: {
                            driving: selectedRoute.duration * 60,
                            walking: selectedRoute.duration * 60 * 1.5
                          },
                          isTollRoad: selectedRoute.isTollRoad
                        }}
                      />
                      <RouteRecommendation
                        routes={[selectedRoute]}
                        onSelect={(route) => setSelectedRoute(route as Route)}
                      />
                      <RouteNotification
                        type="congestion"
                        message={selectedRoute.isTollRoad ? '有料ルート' : '無料ルート'}
                        onAccept={() => {}}
                        onDismiss={() => {}}
                        currentRoute={selectedRoute}
                        suggestedRoute={undefined}
                      />
                    </div>
                  )}
                </div>

                {/* 地図表示エリア */}
                <div className="lg:col-span-2">
                  <div className={`rounded-lg shadow-md overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="h-[600px] relative">
                      {!canClickMap && (
                        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                          <span className="text-gray-600">出発地を準備中…</span>
                        </div>
                      )}
                      <Map
                        startLocation={startLocation}
                        endLocation={endLocation}
                        onRouteSelect={handleRouteSelect}
                        selectedRoute={selectedRoute ? {
                          bounds: new google.maps.LatLngBounds(
                            new google.maps.LatLng(startLocation?.lat || 0, startLocation?.lng || 0),
                            new google.maps.LatLng(endLocation?.lat || 0, endLocation?.lng || 0)
                          ),
                          copyrights: '',
                          legs: [{
                            distance: { text: `${selectedRoute.distance}km`, value: selectedRoute.distance * 1000 },
                            duration: { text: `${selectedRoute.duration}分`, value: selectedRoute.duration * 60 },
                            duration_in_traffic: selectedRoute.durationInTraffic ? {
                              text: `${selectedRoute.durationInTraffic}分`,
                              value: selectedRoute.durationInTraffic * 60
                            } : undefined,
                            start_address: startLocation?.address || '',
                            end_address: endLocation?.address || '',
                            start_location: new google.maps.LatLng(startLocation?.lat || 0, startLocation?.lng || 0),
                            end_location: new google.maps.LatLng(endLocation?.lat || 0, endLocation?.lng || 0),
                            steps: [],
                            traffic_speed_entry: [],
                            via_waypoints: []
                          }],
                          overview_path: selectedRoute.path.map(([lat, lng]) => new google.maps.LatLng(lat, lng)),
                          overview_polyline: '',
                          warnings: [],
                          waypoint_order: [],
                          summary: `${startLocation?.address || ''}から${endLocation?.address || ''}まで`,
                          fare: undefined
                        } as google.maps.DirectionsRoute : null}
                        suggestedRoute={null}
                        onMapClick={(location) => {
                          handleMapClick(location.lat, location.lng);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 