'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Location } from '../types/location';

// GeolocationPositionの型定義
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

export type LocationContextType = {
  currentLocation: Location | null;
  setCurrentLocation: (location: Location | null) => void;
  destination: Location | null;
  setDestination: (location: Location | null) => void;
  getCurrentLocation: () => Promise<void>;
  isGettingLocation: boolean;
  locationError: string | null;
  clearLocationError: () => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const clearLocationError = () => {
    setLocationError(null);
  };

  const getCurrentLocation = async () => {
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
    } catch (error) {
      console.error('位置情報の取得に失敗しました:', error);
      setLocationError(error instanceof Error ? error.message : '位置情報の取得に失敗しました。');
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setCurrentLocation,
        destination,
        setDestination,
        getCurrentLocation,
        isGettingLocation,
        locationError,
        clearLocationError
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
} 