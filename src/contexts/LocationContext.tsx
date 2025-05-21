'use client';

import React, { createContext, useContext, useState } from 'react';

type Location = {
  lat: number;
  lng: number;
};

type LocationContextType = {
  currentLocation: Location | null;
  getCurrentLocation: () => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error('お使いのブラウザは位置情報をサポートしていません。');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('位置情報取得成功:', newLocation);
        setCurrentLocation(newLocation);
      },
      (error) => {
        console.error('位置情報取得エラー:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

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