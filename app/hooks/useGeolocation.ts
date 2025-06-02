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

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('お使いのブラウザは位置情報をサポートしていません。');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.error('位置情報の取得エラー:', error);
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error('位置情報の使用が許可されていません。ブラウザの設定を確認してください。'));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error('位置情報を取得できませんでした。'));
                break;
              case error.TIMEOUT:
                reject(new Error('位置情報の取得がタイムアウトしました。'));
                break;
              default:
                reject(new Error('位置情報の取得に失敗しました。'));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      console.log('現在地を取得しました:', newLocation);
      setCurrentLocation(newLocation);

      // 位置情報の監視を開始
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const updatedLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('現在地が更新されました:', updatedLocation);
          setCurrentLocation(updatedLocation);
        },
        (error) => {
          console.error('位置情報の監視エラー:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

      // コンポーネントのアンマウント時に監視を停止
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } catch (error) {
      console.error('位置情報の取得に失敗しました:', error);
      setLocationError(error instanceof Error ? error.message : '位置情報の取得に失敗しました。');
    } finally {
      setIsGettingLocation(false);
    }
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