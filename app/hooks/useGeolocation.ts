import { useState, useEffect } from 'react';
import { Location } from '../types/location';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface UseGeolocationReturn {
  currentLocation: Location | null;
  isGettingLocation: boolean;
  locationError: string | null;
  getCurrentLocation: () => Promise<void>;
  clearLocationError: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [isWatching, setIsWatching] = useState(false);
  const UPDATE_INTERVAL = 30000; // 30秒

  const clearLocationError = () => {
    setError(null);
  };

  const getCurrentLocation = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('このブラウザは位置情報をサポートしていません');
      setLoading(false);
      return;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setLastUpdateTime(Date.now());
          setLoading(false);
          setIsWatching(true); // 位置情報の監視を開始
          resolve();
        },
        (error) => {
          setError('位置情報の取得に失敗しました');
          setLoading(false);
          reject(error);
        }
      );
    });
  };

  useEffect(() => {
    // 監視が開始されていない場合は何もしない
    if (!isWatching) return;

    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastUpdateTime >= UPDATE_INTERVAL) {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setLastUpdateTime(now);
        }
      },
      (error) => {
        setError('位置情報の取得に失敗しました');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: UPDATE_INTERVAL  // 30秒前までの位置情報を使用可能に
      }
    );

    setWatchId(id);

    return () => {
      if (id) {
        navigator.geolocation.clearWatch(id);
      }
    };
  }, [isWatching, lastUpdateTime]);

  return {
    currentLocation,
    isGettingLocation: loading,
    locationError: error,
    getCurrentLocation,
    clearLocationError
  };
}; 