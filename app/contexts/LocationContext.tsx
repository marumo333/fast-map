'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
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

type LocationContextType = {
  currentLocation: Location | null;
  getCurrentLocation: () => Promise<void>;
  isGettingLocation: boolean;
  locationError: string | null;
  clearLocationError: () => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
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
          reject,
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      });

      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (error) {
      console.error('位置情報の取得に失敗しました:', error);
      setLocationError('位置情報の取得に失敗しました。');
    } finally {
      setIsGettingLocation(false);
    }
  }, []);

  return (
    <LocationContext.Provider value={{ 
      currentLocation, 
      getCurrentLocation,
      isGettingLocation,
      locationError,
      clearLocationError
    }}>
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