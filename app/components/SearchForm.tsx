'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Location } from '../types/location';
import { useLocation } from '../contexts/LocationContext';

interface SearchFormProps {
  onSearch: (start: Location, end: Location) => void;
  isSearching: boolean;
  onClose: () => void;
}

interface GeocoderResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isSearching, onClose }) => {
  const { currentLocation } = useLocation();
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [selectedStart, setSelectedStart] = useState<Location | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Location | null>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const startAutocomplete = useRef<google.maps.PlaceAutocompleteElement | null>(null);
  const endAutocomplete = useRef<google.maps.PlaceAutocompleteElement | null>(null);

  const getAddressFromLocation = useCallback(async (location: Location): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      // Google Maps APIが読み込まれるのを待つ
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps);
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location },
            (
              results: google.maps.GeocoderResult[],
              status: google.maps.GeocoderStatus
            ) => {
              if (status === 'OK' && results && results[0]) {
                resolve(results[0].formatted_address);
              } else {
                console.error('住所の取得に失敗:', status);
                reject(new Error(`住所の取得に失敗しました: ${status}`));
              }
            }
          );
        }
      }, 100);

      // タイムアウト処理
      setTimeout(() => {
        clearInterval(checkGoogleMaps);
        reject(new Error('Google Maps APIの初期化がタイムアウトしました'));
      }, 10000);
    });
  }, []);

  useEffect(() => {
    if (currentLocation && !selectedStart) {
      setSelectedStart(currentLocation);
      getAddressFromLocation(currentLocation).then(address => {
        setStartQuery(address);
      });
    }
  }, [currentLocation, selectedStart, getAddressFromLocation]);

  useEffect(() => {
    // Google Places APIのサービスを初期化
    const initializeAutocomplete = async () => {
      try {
        // Google Maps APIが読み込まれるのを待つ
        const waitForGoogleMaps = () => {
          return new Promise<void>((resolve, reject) => {
            const checkGoogleMaps = setInterval(() => {
              if (window.google && window.google.maps) {
                clearInterval(checkGoogleMaps);
                resolve();
              }
            }, 100);

            // タイムアウト処理
            setTimeout(() => {
              clearInterval(checkGoogleMaps);
              reject(new Error('Google Maps APIの初期化がタイムアウトしました'));
            }, 10000);
          });
        };

        await waitForGoogleMaps();
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        if (startInputRef.current && !startAutocomplete.current) {
          const placeAutocomplete = new PlaceAutocompleteElement({
            componentRestrictions: { country: 'jp' }
          });

          startInputRef.current.parentNode?.insertBefore(
            placeAutocomplete,
            startInputRef.current
          );

          placeAutocomplete.addEventListener('place_changed', () => {
            const place = placeAutocomplete.getPlace();
            if (place.geometry?.location) {
              setSelectedStart({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address || ''
              });
              setStartQuery(place.formatted_address || '');
            }
          });

          startAutocomplete.current = placeAutocomplete as unknown as google.maps.PlaceAutocompleteElement;
        }

        if (endInputRef.current && !endAutocomplete.current) {
          const placeAutocomplete = new PlaceAutocompleteElement({
            componentRestrictions: { country: 'jp' }
          });

          endInputRef.current.parentNode?.insertBefore(
            placeAutocomplete,
            endInputRef.current
          );

          placeAutocomplete.addEventListener('place_changed', () => {
            const place = placeAutocomplete.getPlace();
            if (place.geometry?.location) {
              setSelectedEnd({
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address || ''
              });
              setEndQuery(place.formatted_address || '');
            }
          });

          endAutocomplete.current = placeAutocomplete as unknown as google.maps.PlaceAutocompleteElement;
        }
      } catch (error) {
        console.error('PlaceAutocompleteElementの初期化に失敗:', error);
      }
    };

    initializeAutocomplete();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStart && selectedEnd) {
      onSearch(selectedStart, selectedEnd);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">ルート検索</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">
            出発地
          </label>
          <div className="relative">
            <input
              ref={startInputRef}
              type="text"
              id="start"
              name="start"
              value={startQuery}
              onChange={(e) => setStartQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-black opacity-0 absolute"
              placeholder="出発地を入力"
              required
              aria-label="出発地"
            />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">
            目的地
          </label>
          <div className="relative">
            <input
              ref={endInputRef}
              type="text"
              id="end"
              name="end"
              value={endQuery}
              onChange={(e) => setEndQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-black opacity-0 absolute"
              placeholder="目的地を入力"
              required
              aria-label="目的地"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedStart || !selectedEnd || isSearching}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            !selectedStart || !selectedEnd || isSearching
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-primary-dark'
          }`}
        >
          {isSearching ? '検索中...' : 'ルートを検索'}
        </button>
      </form>
    </div>
  );
};

export default SearchForm; 