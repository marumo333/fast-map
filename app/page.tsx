'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTrafficPolling } from './utils/trafficPolling';
import { Location } from './types/location';
import type { RouteInfo } from './types/route';
import type { Route } from './types/route';
import { useRouteChangeDetection } from './hooks/useRouteChangeDetection';
import RouteInfoComponent from './components/RouteInfo';
import dynamic from 'next/dynamic';
import { useLocation } from './contexts/LocationContext';
import Navbar from './components/Navbar';
import { useTheme } from './settings/ThemeContext';
import { getAddressFromLocation } from './utils/geocoding';
import { checkSearchLimit, incrementSearchCount, getRemainingSearches } from './utils/searchLimit';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store/store';
import { logout } from './store/authSlice';
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';

// Notification型を定義
type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  alternativeRoute?: RouteInfo;
};

// 位置情報の型を拡張
type LocationWithAddress = Location & {
  address?: string;
};

// Mapコンポーネントのpropsの型を更新
interface MapComponentProps {
  startLocation: LocationWithAddress | null;
  endLocation: LocationWithAddress | null;
  onRouteSelect: (route: google.maps.DirectionsRoute) => void;
  selectedRoute: google.maps.DirectionsRoute | null;
  suggestedRoute: google.maps.DirectionsRoute | null;
  onMapClick: (location: google.maps.LatLng) => void;
  shouldFitBounds?: boolean;
  onFitBoundsComplete?: () => void;
}

// Leafletのマップコンポーネントを動的にインポート
const MapComponent = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
      <div className="text-gray-600 dark:text-gray-300 transition-colors duration-300">地図を読み込み中...</div>
    </div>
  )
});

export default function Home() {
  const { isDarkMode } = useTheme();
  const [startLocation, setStartLocation] = useState<LocationWithAddress | null>(null);
  const [endLocation, setEndLocation] = useState<LocationWithAddress | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showTrafficInfo, setShowTrafficInfo] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canClickMap, setCanClickMap] = useState(false);
  const { currentLocation, getCurrentLocation } = useLocation() as { 
    currentLocation: LocationWithAddress | null;
    getCurrentLocation: () => Promise<Location | null>;
  };
  const [shouldFitBounds, setShouldFitBounds] = useState(false);
  // 住所キャッシュ
  const addressCache = useRef<Map<string, string>>(new Map());
  const dispatch = useDispatch();
  const [cookies, setCookie, removeCookie] = useCookies(['userId']);
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  // ログイン状態のチェック
  useEffect(() => {
    if (!cookies.userId) {
      router.push('/login');
    }
  }, [cookies.userId, router]);

  const getCachedAddress = useCallback(async (location: Location) => {
    const key = `${location.lat},${location.lng}`;
    if (addressCache.current.has(key)) {
      return addressCache.current.get(key)!;
    }
    const address = await getAddressFromLocation(location);
    addressCache.current.set(key, address);
    return address;
  }, []);

  // LocationInfoコンポーネントを通常の関数コンポーネントとして分離
  const LocationInfo: React.FC<{ location: LocationWithAddress | null, label: string }> = ({ location, label }) => {
    const [address, setAddress] = useState<string | null>(null);

    useEffect(() => {
      if (location && !location.address) {
        getAddressFromLocation(location).then(newAddress => {
          setAddress(newAddress);
        });
      } else if (location?.address) {
        setAddress(location.address);
      }
    }, [location]);

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

  const handleTrafficInfoUpdate = useCallback((info: any) => {
    console.log('交通情報更新:', info);
    setTrafficInfo(info);
  }, []);

  useTrafficPolling(
    selectedRoute?.routeId ?? 0,
    300000, // 5分
    handleTrafficInfoUpdate,
    startLocation ?? undefined,
    endLocation ?? undefined
  );

  const handleRouteChange = useCallback((newRoute: RouteInfo) => {
    setSelectedRoute(newRoute);
    setShowNotification(true);
  }, []);

  useRouteChangeDetection(
    selectedRoute as unknown as Route | undefined,
    trafficInfo,
    handleRouteChange as unknown as (newRoute: Route) => void
  );

  const handleGetCurrentLocation = async (): Promise<Location | null> => {
    try {
      setIsLoading(true);
      const location = await getCurrentLocation();
      if (!location) {
        throw new Error('位置情報が取得できませんでした');
      }

      console.log('現在地を出発地として設定:', location);
      // まず緯度経度だけセット
      setStartLocation(location);
      setEndLocation(null);
      setSelectedRoute(null);

      // 住所を取得
      try {
        const address = await getCachedAddress(location);
        if (address) {
          setStartLocation(prev => {
            if (!prev) return null;
            return { ...prev, address };
          });
        }
      } catch (error) {
        console.error('現在地の住所取得に失敗:', error);
      }

      // canClickMapの設定はuseEffectに任せる
      return location;
    } catch (error) {
      console.error('位置情報の取得に失敗しました:', error);
      setError('位置情報の取得に失敗しました');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // startLocationの変更を監視
  useEffect(() => {
    console.log('[useEffect]startLocationが更新されました:', startLocation);
    // startLocationが更新された時点でcanClickMapをtrueに設定
    if (startLocation && startLocation.lat && startLocation.lng) {
      console.log('startLocationが有効なため、canClickMapをtrueに設定します');
      setCanClickMap(true);
    } else {
      console.log('startLocationが無効なため、canClickMapをfalseに設定します');
      setCanClickMap(false);
    }
  }, [startLocation]);

  useEffect(() => {
    if (startLocation && !startLocation.address) {
      getCachedAddress(startLocation).then(address => {
        setStartLocation(prev => {
          if (!prev) return prev;
          if (prev.address === address) return prev;
          return { ...prev, address };
        });
      });
    }
    if (endLocation && !endLocation.address) {
      getCachedAddress(endLocation).then(address => {
        setEndLocation(prev => {
          if (!prev) return prev;
          if (prev.address === address) return prev;
          return { ...prev, address };
        });
      });
    }
  }, [startLocation, endLocation, getCachedAddress]);

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

    const selectedRoute: RouteInfo = {
      routeId: 1,
      path: route.overview_path.map(latLng => [latLng.lat(), latLng.lng()]),
      distance: route.legs[0].distance.value / 1000,
      duration: {
        driving: route.legs[0].duration.value / 60,
        walking: route.legs[0].duration.value / 60 * 1.5
      },
      duration_in_traffic: route.legs[0].duration_in_traffic?.value ? route.legs[0].duration_in_traffic.value / 60 : 0,
      isTollRoad: false,
      mode: 'driving',
      trafficInfo: [],
      tollFee: 0
    };
    setSelectedRoute(selectedRoute);
  };

  const handleMapClick = useCallback((lat: number, lng: number) => {
    console.log('[handleMapClick]直前の状態:', { canClickMap, startLocation });
    
    // 「出発地がセットされていない」または「クリック受付前」なら警告だけ出す
    if (!startLocation || !canClickMap) {
      console.warn('出発地がまだ準備できていないため、目的地に設定できません');
      return;
    }

    // 検索回数の制限をチェック
    if (!checkSearchLimit()) {
      alert('本日の検索回数が3回に達しました。明日までお待ちください。');
      return;
    }

    // 残り検索回数を表示
    const remaining = getRemainingSearches();
    alert(`目的地を設定します。あと${remaining}回検索できます。`);

    // ここまできたら「目的地として」endLocationをセット
    console.log('目的地を設定します:', { lat, lng });
    const newEndLocation = { lat, lng };
    setEndLocation(newEndLocation);
    setSelectedRoute(null);
    setShouldFitBounds(true);
    // 目的地選択時にメッセージを送信
    window.postMessage('selectEndLocation', '*');
    // 検索回数をインクリメント
    incrementSearchCount();
  }, [canClickMap, startLocation]);

  const handleLogout = () => {
    dispatch(logout());
    removeCookie('userId', { path: '/' });
    router.push('/login');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Navbar onGetCurrentLocation={handleGetCurrentLocation} />
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="grid grid-cols-1">
          {/* 地図表示エリア */}
          <div>
            <div className={`rounded-lg shadow-md overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="h-[calc(100vh-12rem)] relative">
                {!canClickMap && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
                    <span className="text-gray-600">出発地を準備中…</span>
                  </div>
                )}
                <MapComponent
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
                      duration: { 
                        text: `${selectedRoute.duration?.driving ?? 0}分`, 
                        value: (selectedRoute.duration?.driving ?? 0) * 60 
                      },
                      duration_in_traffic: selectedRoute.duration_in_traffic ? {
                        text: `${selectedRoute.duration_in_traffic}分`,
                        value: selectedRoute.duration_in_traffic * 60
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
                  shouldFitBounds={shouldFitBounds}
                  onFitBoundsComplete={() => setShouldFitBounds(false)}
                />
                {/* ルート情報を地図内に移動 */}
                {startLocation && endLocation && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className={`rounded-lg shadow-md p-6 space-y-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                      <h2 className={`text-lg font-semibold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ルート情報</h2>
                      <RouteInfoComponent
                        routeInfo={{
                          distance: (selectedRoute?.distance ?? 0) * 1000,
                          duration: {
                            driving: (selectedRoute?.duration?.driving ?? 0) * 60,
                            walking: (selectedRoute?.duration?.walking ?? 0) * 60
                          },
                          isTollRoad: selectedRoute?.isTollRoad ?? false
                        }}
                        onClose={() => setSelectedRoute(null)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 