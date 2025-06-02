'use client';
import React, { useState, useEffect, useCallback } from 'react';
import RouteSelector from './components/RouteSelector';
import { useTrafficPolling } from './utils/trafficPolling';
import { Location } from './types/location';
import { Route } from './types/route';
import { useRouteChangeDetection } from './hooks/useRouteChangeDetection';
import RouteNotification from './components/RouteNotification';
import dynamic from 'next/dynamic';
import { useLocation } from './contexts/LocationContext';
import SearchForm from './components/SearchForm';
import Navbar from './components/Navbar';
import { useTheme } from './settings/ThemeContext';

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

// Leafletのマップコンポーネントを動的にインポート
const Map = dynamic(() => import('./components/Map'), {
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
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [trafficInfo, setTrafficInfo] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showTrafficInfo, setShowTrafficInfo] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSearchForm, setShowSearchForm] = useState(true);
  const { currentLocation, getCurrentLocation } = useLocation() as { 
    currentLocation: LocationWithAddress | null;
    getCurrentLocation: () => Promise<void>;
  };

  const getAddressFromLocation = useCallback(async (location: Location): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      // Google Maps APIが読み込まれるのを待つ
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location },
            (
              results: google.maps.GeocoderResult[],
              status: google.maps.GeocoderStatus
            ) => {
              if (status === 'OK' && results && results[0]) {
                resolve(results[0].formatted_address);
              } else {
                console.error('住所の取得に失敗:', status);
                reject(new Error(`住所の取得に失敗しました: ${status}`));
              }
            }
          );
        }
      }, 100);

      // タイムアウト処理
      setTimeout(() => {
        clearInterval(checkGoogleMaps);
        reject(new Error('Google Maps APIの初期化がタイムアウトしました'));
      }, 10000);
    });
  }, []);

  // 位置情報が更新されたときに住所を取得
  useEffect(() => {
    const updateLocationAddress = async (location: LocationWithAddress | null, setLocation: (location: LocationWithAddress | null) => void) => {
      if (location && !location.address) {
        const address = await getAddressFromLocation(location);
        setLocation({ ...location, address });
      }
    };

    // 初回のみ実行
    if (!startLocation?.address) {
      updateLocationAddress(startLocation, setStartLocation);
    }
    if (!endLocation?.address) {
      updateLocationAddress(endLocation, setEndLocation);
    }
    if (currentLocation && !currentLocation.address) {
      updateLocationAddress(currentLocation as LocationWithAddress, (loc) => {
        if (loc) setStartLocation(loc);
      });
    }
  }, [startLocation, endLocation, currentLocation, getAddressFromLocation]);

  // 交通情報のポーリング
  useTrafficPolling(
    selectedRoute?.routeId ?? 0,
    30000, // 30秒ごとに更新
    (info) => {
      console.log('交通情報更新:', info);
      setTrafficInfo(info);
      setShowTrafficInfo(true);
      // 3秒後に通知を非表示
      setTimeout(() => {
        setShowTrafficInfo(false);
      }, 3000);
    },
    startLocation ?? undefined,
    endLocation ?? undefined
  );

  // ルート変更の検出
  useRouteChangeDetection(
    selectedRoute ?? undefined,
    trafficInfo,
    (newRoute) => {
      setSelectedRoute(newRoute);
      setShowNotification(true);
    }
  );

  // 現在地が取得されたら出発地として設定（初回のみ）
  useEffect(() => {
    if (currentLocation && !startLocation) {
      setStartLocation(currentLocation as LocationWithAddress);
      // 現在地の住所を取得
      getAddressFromLocation(currentLocation).then(address => {
        setStartLocation(prev => prev ? { ...prev, address } : null);
      });
    }
  }, [currentLocation, startLocation, getAddressFromLocation]);

  const handleSearch = async (start: Location, end: Location) => {
    try {
      // 出発地が指定されていない場合は現在地を使用
      const startLocation = start || currentLocation;
      if (!startLocation) {
        throw new Error('出発地が設定されていません。現在地の取得を許可してください。');
      }

      setStartLocation(startLocation as LocationWithAddress);
      setEndLocation(end as LocationWithAddress);
      setIsLoading(true);
      setError(null);

      const response = await fetch('https://fast-6ir0sv4r8-marumo333s-projects.vercel.app/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start: startLocation, end }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          throw new Error('指定された地点間のルートが見つかりませんでした。別の地点を指定するか、移動手段を変更してください。');
        }
        throw new Error(errorData.error || 'ルート情報の取得に失敗しました');
      }

      const routeData = await response.json();
      // ルートデータに必要なプロパティを追加
      const selectedRoute = {
        ...routeData,
        routeId: 1, // デフォルトのルートID
        path: routeData.path || [],
        distance: routeData.distance || 0,
        duration: routeData.duration?.driving || 0,
        durationInTraffic: routeData.duration_in_traffic || undefined,
        isTollRoad: routeData.isTollRoad || false,
        toll: routeData.tollFee || 0
      };
      setSelectedRoute(selectedRoute);
      setIsLoading(false);
      setShowNotification(true);
      setShowSearchForm(false); // 検索完了後にフォームを閉じる
    } catch (error) {
      console.error('ルート検索エラー:', error);
      setError(error instanceof Error ? error.message : 'ルート検索中にエラーが発生しました');
      setIsLoading(false);
    }
  };

  const handleNotificationAction = (action: 'accept' | 'dismiss') => {
    if (action === 'accept' && notification?.alternativeRoute) {
      setSelectedRoute(notification.alternativeRoute);
    }
    setNotification(null);
  };

  // 位置情報を表示するコンポーネント
  const LocationInfo = ({ location, label }: { location: LocationWithAddress | null, label: string }) => {
    const [address, setAddress] = useState<string | null>(null);

    useEffect(() => {
      if (location && !location.address) {
        getAddressFromLocation(location).then(newAddress => {
          setAddress(newAddress);
          if (label === '出発地') {
            setStartLocation(prev => prev ? { ...prev, address: newAddress } : null);
          } else {
            setEndLocation(prev => prev ? { ...prev, address: newAddress } : null);
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

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
      <div className="w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Navbar onGetCurrentLocation={getCurrentLocation} />
          <div className="flex-grow pb-32 pt-16">
            <div className="container mx-auto px-4 py-8">
              <h1 className={`text-3xl font-bold mb-8 text-center transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                最適なルートを探す
              </h1>
              
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
                    <LocationInfo location={startLocation} label="出発地" />
                    <LocationInfo location={endLocation} label="目的地" />
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
                      <div className={`space-y-2 text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <p>距離: {selectedRoute.distance}km</p>
                        <p>所要時間: {selectedRoute.duration}分</p>
                        {selectedRoute.isTollRoad && (
                          <p className="text-yellow-600 dark:text-yellow-400">有料道路を含む</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 地図表示エリア */}
                <div className="lg:col-span-2">
                  <div className={`rounded-lg shadow-md overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="h-[600px] relative">
                      <Map
                        selectedRoute={selectedRoute}
                        currentLocation={currentLocation}
                        onLocationSelect={(location) => {
                          if (!startLocation) {
                            setStartLocation(location as LocationWithAddress);
                          } else {
                            setEndLocation(location as LocationWithAddress);
                          }
                        }}
                        endLocation={endLocation}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 通知 */}
          {showNotification && notification && (
            <RouteNotification
              type={notification.type}
              message={notification.message}
              onAccept={() => handleNotificationAction('accept')}
              onDismiss={() => handleNotificationAction('dismiss')}
              currentRoute={selectedRoute || undefined}
              suggestedRoute={notification.alternativeRoute || undefined}
            />
          )}

          {/* 交通情報通知 */}
          {showTrafficInfo && trafficInfo && (
            <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <p className="text-sm">交通情報が更新されました</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 