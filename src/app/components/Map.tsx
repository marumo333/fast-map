'use client';
import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { Location } from '@/types/location';
import { Route } from '@/types/route';

type MapProps = {
  selectedRoute: Route | null;
  currentLocation: Location | null;
  onLocationSelect: (location: Location) => void;
};

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 35.6812,
  lng: 139.7671
};

const Map: React.FC<MapProps> = ({ selectedRoute, currentLocation, onLocationSelect }) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setIsMapReady(true);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    setIsMapReady(false);
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onLocationSelect({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">地図を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          minZoom: 5,
          maxZoom: 18
        }}
      >
        {currentLocation && (
          <Marker
            position={{ lat: currentLocation.lat, lng: currentLocation.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2
            }}
          />
        )}

        {selectedRoute && (
          <Polyline
            path={selectedRoute.path.map(point => ({
              lat: point[0],
              lng: point[1]
            }))}
            options={{
              strokeColor: selectedRoute.isTollRoad ? '#FF0000' : '#00FF00',
              strokeWeight: 6,
              strokeOpacity: 0.8
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default Map; 