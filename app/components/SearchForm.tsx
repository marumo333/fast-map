'use client';
import React, { useState, useEffect, useRef } from 'react';
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
  // TODO: 2025年3月1日以降、PlaceAutocompleteElementに移行予定
  const startAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const endAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (currentLocation && !selectedStart) {
      setSelectedStart(currentLocation);
      // 現在地の住所を取得して表示
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: currentLocation.lat, lng: currentLocation.lng } },
        (results: GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          if (status === 'OK' && results && results[0]) {
            setStartQuery(results[0].formatted_address);
          }
        }
      );
    }
  }, []); // 依存配列を空にして初回のみ実行

  useEffect(() => {
    // Google Places APIのサービスを初期化
    const initializeAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.error('Google Maps APIが初期化されていません');
        return;
      }

      const startAutocomplete = new window.google.maps.places.Autocomplete(startInputRef.current!, {
        componentRestrictions: { country: 'jp' },
        fields: ['geometry', 'formatted_address'],
        language: 'ja'
      });

      const endAutocomplete = new window.google.maps.places.Autocomplete(endInputRef.current!, {
        componentRestrictions: { country: 'jp' },
        fields: ['geometry', 'formatted_address'],
        language: 'ja'
      });

      startAutocomplete.addListener('place_changed', () => {
        const place = startAutocomplete.getPlace();
        if (place.geometry) {
          setSelectedStart({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address
          });
          setStartQuery(place.formatted_address);
        }
      });

      endAutocomplete.addListener('place_changed', () => {
        const place = endAutocomplete.getPlace();
        if (place.geometry) {
          setSelectedEnd({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address
          });
          setEndQuery(place.formatted_address);
        }
      });
    };

    // Google Maps APIが読み込まれるのを待つ
    let retryCount = 0;
    const maxRetries = 10;
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializeAutocomplete();
        clearInterval(checkGoogleMaps);
      } else {
        retryCount++;
        if (retryCount >= maxRetries) {
          console.error('Google Maps APIの読み込みがタイムアウトしました');
          clearInterval(checkGoogleMaps);
        }
      }
    }, 1000);

    return () => {
      clearInterval(checkGoogleMaps);
    };
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
          <input
            ref={startInputRef}
            type="text"
            id="start"
            name="start"
            value={startQuery}
            onChange={(e) => setStartQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-black"
            placeholder="出発地を入力"
            required
            aria-label="出発地"
          />
        </div>

        <div className="relative">
          <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">
            目的地
          </label>
          <input
            ref={endInputRef}
            type="text"
            id="end"
            name="end"
            value={endQuery}
            onChange={(e) => setEndQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-black"
            placeholder="目的地を入力"
            required
            aria-label="目的地"
          />
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