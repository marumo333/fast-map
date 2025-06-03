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
  const { currentLocation, getCurrentLocation } = useLocation() as { 
    currentLocation: LocationWithAddress | null;
    getCurrentLocation: () => Promise<void>;
  };

  const updateLocationAddress = useCallback(async (
    location: LocationWithAddress | null,
    setLocation: (location: LocationWithAddress | null) => void
  ) => {
    if (location && !location.address) {
      try {
        const address = await getAddressFromLocation(location);
        setLocation({ ...location, address });
      } catch (error) {
        console.error('住所の更新に失敗:', error);
      }
    }
  }, []);

  useEffect(() => {
    const updateLocations = async () => {
      if (!startLocation?.address) {
        await updateLocationAddress(startLocation, setStartLocation);
      }
      if (!endLocation?.address) {
        await updateLocationAddress(endLocation, setEndLocation);
      }
      if (currentLocation && !currentLocation.address) {
        await updateLocationAddress(currentLocation as LocationWithAddress, (loc) => {
          if (loc) setStartLocation(loc);
        });
      }
    };

    updateLocations();
  }, [startLocation, endLocation, currentLocation, updateLocationAddress, setStartLocation, setEndLocation]);

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
      await getCurrentLocation();
      if (currentLocation) {
        console.log('現在地を出発地として設定:', currentLocation);
        setStartLocation(currentLocation);
        setEndLocation(null);
        setSelectedRoute(null);
        setShowSearchForm(false);
      }
    } catch (error) {
      console.error('位置情報の取得に失敗しました:', error);
    }
  };

  useEffect(() => {
    const initializeCurrentLocation = async () => {
      if (currentLocation && !startLocation) {
        console.log('初期化: 現在地を出発地として設定:', currentLocation);
        try {
          const address = await getAddressFromLocation(currentLocation);
          setStartLocation({ ...currentLocation, address });
        } catch (error) {
          console.error('現在地の住所取得に失敗:', error);
          setStartLocation(currentLocation as LocationWithAddress);
        }
      }
    };

    initializeCurrentLocation();
  }, [currentLocation, startLocation, getAddressFromLocation]);

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
    if (!startLocation) {
      console.log('出発地が設定されていません');
      return;
    }

    const newEndLocation = { lat, lng };
    console.log('目的地を設定:', newEndLocation);
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
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
      <div className="w-full h-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Navbar onGetCurrentLocation={handleGetCurrentLocation} />
          <div className="flex-grow pb-32 pt-16">
            <div className="container mx-auto px-4 py-8">
              <h1 className={`text-3xl font-bold mb-8 text-center transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                最適なルートを探す
              </h1>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <div className="h-[calc(100vh-12rem)] rounded-lg overflow-hidden shadow-lg">
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
                <div className="lg:col-span-1">
                  {showSearchForm ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-300">
                      <SearchForm
                        onSearch={handleSearch}
                        isSearching={false}
                        onClose={() => setShowSearchForm(false)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-300">
                        <LocationInfo
                          location={startLocation}
                          label="出発地"
                          setStartLocation={setStartLocation}
                          setEndLocation={setEndLocation}
                          getAddressFromLocation={getAddressFromLocation}
                        />
                        <LocationInfo
                          location={endLocation}
                          label="目的地"
                          setStartLocation={setStartLocation}
                          setEndLocation={setEndLocation}
                          getAddressFromLocation={getAddressFromLocation}
                        />
                        <button
                          onClick={() => setShowSearchForm(true)}
                          className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          場所を検索
                        </button>
                      </div>
                      {selectedRoute && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 transition-colors duration-300">
                          <h2 className="text-lg font-semibold mb-4">ルート情報</h2>
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
                          {startLocation && endLocation && (
                            <div className="mt-4">
                              <RouteSelector
                                startLocation={startLocation}
                                endLocation={endLocation}
                                onRouteSelect={setSelectedRoute}
                              />
                              <RouteRecommendation
                                routes={[selectedRoute]}
                                onSelect={(route) => setSelectedRoute(route as Route)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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