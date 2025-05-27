'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Location } from '@/types/location';
import { useLocation } from '@/contexts/LocationContext';

type SearchFormProps = {
  onSearch: (start: Location, end: Location) => void;
  isSearching: boolean;
  onClose?: () => void;
};

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isSearching, onClose }) => {
  const { currentLocation } = useLocation();
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchBoxRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (currentLocation) {
      setStartLocation(currentLocation);
    }
  }, [currentLocation]);

  useEffect(() => {
    // Google Places APIのサービスを初期化
    const initializePlacesService = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const mapDiv = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(mapDiv);
      }
    };

    // Google Maps APIが読み込まれるのを待つ
    const checkGoogleMaps = setInterval(() => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initializePlacesService();
        clearInterval(checkGoogleMaps);
      }
    }, 100);

    // クリーンアップ関数
    return () => {
      clearInterval(checkGoogleMaps);
    };
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    if (!autocompleteService.current) {
      console.error('AutocompleteServiceが初期化されていません');
      return;
    }

    try {
      const response = await autocompleteService.current.getPlacePredictions({
        input: query,
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'jp' },
        language: 'ja'
      });

      if (response && response.predictions) {
        setSearchResults(response.predictions);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('検索エラー:', error);
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handlePlaceSelect = async (placeId: string) => {
    if (!placesService.current) {
      console.error('PlacesServiceが初期化されていません');
      return;
    }

    try {
      const place = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        placesService.current?.getDetails(
          { 
            placeId, 
            fields: ['geometry', 'name', 'formatted_address'],
            language: 'ja'
          },
          (result, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && result) {
              resolve(result);
            } else {
              reject(new Error('場所の詳細を取得できませんでした'));
            }
          }
        );
      });

      if (place.geometry?.location) {
        const location: Location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        setEndLocation(location);
        setSearchQuery(place.name || place.formatted_address || '');
        setShowResults(false);
      }
    } catch (error) {
      console.error('場所の詳細取得エラー:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startLocation && endLocation) {
      onSearch(startLocation, endLocation);
    }
  };

  const handleCurrentLocationClick = () => {
    if (currentLocation) {
      setStartLocation(currentLocation);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">ルート検索</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="検索を閉じる"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="start" className="block text-sm font-medium text-gray-700">
          出発地
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="start"
            value={startLocation ? `${startLocation.lat.toFixed(6)}, ${startLocation.lng.toFixed(6)}` : ''}
            readOnly
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-black"
            placeholder="出発地を選択"
          />
          <button
            type="button"
            onClick={handleCurrentLocationClick}
            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            現在地
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="end" className="block text-sm font-medium text-gray-700">
          目的地
        </label>
        <div className="relative">
          <input
            type="text"
            id="end"
            ref={searchBoxRef}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-black"
            placeholder="目的地を検索（例：東京スカイツリー、渋谷駅など）"
          />
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {searchResults.map((result) => (
                <div
                  key={result.place_id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handlePlaceSelect(result.place_id)}
                >
                  <div className="text-sm font-medium text-gray-900">{result.structured_formatting.main_text}</div>
                  <div className="text-xs text-gray-500">{result.structured_formatting.secondary_text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!startLocation || !endLocation || isSearching}
        className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSearching ? '検索中...' : 'ルート検索'}
      </button>
    </form>
  );
};

export default SearchForm; 