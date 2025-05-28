'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Location } from '@/types/location';

type LocationContextType = {
  currentLocation: Location | null;
  getCurrentLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  const getCurrentLocation = useCallback(async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (error) {
      console.error('位置情報の取得に失敗しました:', error);
      throw error;
    }
  }, []);

  return (
    <LocationContext.Provider value={{ currentLocation, getCurrentLocation }}>
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