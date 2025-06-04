'use client';

import React, { createContext, useContext } from 'react';
import { Location } from '../types/location';
import { Route } from '../types/route';
import { useGeolocation } from '../hooks/useGeolocation';

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

interface LocationContextType {
  currentLocation: Location | null;
  setCurrentLocation: (location: Location | null) => void;
  destination: Location | null;
  setDestination: (location: Location | null) => void;
  route: Route | null;
  setRoute: (route: Route | null) => void;
  getCurrentLocation: () => Promise<Location | null>;
  isGettingLocation: boolean;
  locationError: string | null;
  clearLocationError: () => void;
  isLocationInitialized: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const {
    currentLocation,
    isGettingLocation,
    locationError,
    getCurrentLocation,
    clearLocationError
  } = useGeolocation();

  const [destination, setDestination] = React.useState<Location | null>(null);
  const [route, setRoute] = React.useState<Route | null>(null);
  const [isLocationInitialized, setIsLocationInitialized] = React.useState(false);

  // currentLocationの変更を監視し、初期化状態を管理
  React.useEffect(() => {
    if (currentLocation && !isLocationInitialized) {
      console.log('LocationContext: 現在地を初期化:', currentLocation);
      setIsLocationInitialized(true);
    }
  }, [currentLocation, isLocationInitialized]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        setCurrentLocation: () => {}, // useGeolocationで管理するため、空の関数を提供
        destination,
        setDestination,
        route,
        setRoute,
        getCurrentLocation,
        isGettingLocation,
        locationError,
        clearLocationError,
        isLocationInitialized
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