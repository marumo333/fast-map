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
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const clearLocationError = useCallback(() => {
    setLocationError(null);
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<void> => {
    if (!navigator.geolocation) {
      setLocationError('位置情報が利用できません');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000 // 30秒間キャッシュされた位置情報を使用可能
        });
      });

      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (error) {
      console.error('位置情報の取得に失敗:', error);
      setLocationError('位置情報の取得に失敗しました');
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  // 位置情報の監視を開始
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('位置情報が利用できません');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        console.error('位置情報の監視に失敗:', error);
        setLocationError('位置情報の監視に失敗しました');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000 // 30秒間キャッシュされた位置情報を使用可能
      }
    );

    // クリーンアップ関数
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 初期位置を東京に設定
  useEffect(() => {
    if (!currentLocation) {
      setCurrentLocation({ lat: 35.6812, lng: 139.7671 });
    }
  }, [currentLocation]);

  return {
    currentLocation,
    isGettingLocation,
    locationError,
    getCurrentLocation,
    clearLocationError
  };
}; 