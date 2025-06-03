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
          console.log('現在地を設定:', location);
          setCurrentLocation(location);
          setLastUpdateTime(Date.now());
          setLoading(false);
          setIsWatching(true);
          resolve();
        },
        (error) => {
          console.error('位置情報の取得に失敗:', error);
          let errorMessage = '位置情報の取得に失敗しました';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '位置情報の使用が許可されていません';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '位置情報を取得できません';
              break;
            case error.TIMEOUT:
              errorMessage = '位置情報の取得がタイムアウトしました';
              break;
          }
          setError(errorMessage);
          setLoading(false);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  useEffect(() => {
    if (!isWatching) return;

    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        console.log('位置情報更新チェック:', {
          lastUpdate: new Date(lastUpdateTime).toLocaleTimeString(),
          now: new Date(now).toLocaleTimeString(),
          diff: (now - lastUpdateTime) / 1000,
          shouldUpdate: now - lastUpdateTime >= UPDATE_INTERVAL
        });

        if (now - lastUpdateTime >= UPDATE_INTERVAL) {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('位置情報を更新:', location);
          setCurrentLocation(location);
          setLastUpdateTime(now);
        }
      },
      (error) => {
        console.error('位置情報の監視に失敗:', error);
        let errorMessage = '位置情報の取得に失敗しました';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置情報の使用が許可されていません';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報を取得できません';
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました';
            break;
        }
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: UPDATE_INTERVAL
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