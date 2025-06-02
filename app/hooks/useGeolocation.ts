import { useState, useEffect, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const clearLocationError = useCallback(() => {
    setError(null);
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('お使いのブラウザは位置情報をサポートしていません');
      setIsLoading(false);
      return;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setIsLoading(false);

          // 30秒ごとに位置情報を更新
          if (watchId) {
            navigator.geolocation.clearWatch(watchId);
          }

          const id = navigator.geolocation.watchPosition(
            (pos) => {
              const newLocation: Location = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              };
              setCurrentLocation(newLocation);
            },
            (err) => {
              console.error('位置情報の監視中にエラーが発生しました:', err);
              setError('位置情報の取得に失敗しました');
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 30000, // 30秒以上古い位置情報は使用しない
            }
          );
          setWatchId(id);
          resolve();
        },
        (error) => {
          console.error('位置情報の取得に失敗:', error);
          setError('位置情報の取得に失敗しました');
          setIsLoading(false);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  }, [watchId]);

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    currentLocation,
    isGettingLocation: isLoading,
    locationError: error,
    getCurrentLocation,
    clearLocationError
  };
}; 