'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Location } from '@/types/location';
import { useLocation } from '@/contexts/LocationContext';

interface SearchFormProps {
  onSearch: (start: Location, end: Location) => void;
  isSearching: boolean;
  onClose: () => void;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isSearching, onClose }) => {
  const { currentLocation } = useLocation();
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<google.maps.places.PlaceResult[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<google.maps.places.PlaceResult[]>([]);
  const [selectedStart, setSelectedStart] = useState<Location | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Location | null>(null);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (currentLocation) {
      setSelectedStart(currentLocation);
    }
  }, [currentLocation]);

  useEffect(() => {
    // Google Places APIのサービスを初期化
    const initializePlacesService = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
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

    return () => {
      clearInterval(checkGoogleMaps);
    };
  }, []);

  const fetchSuggestions = async (
    query: string,
    setSuggestions: React.Dispatch<React.SetStateAction<google.maps.places.PlaceResult[]>>
  ) => {
    if (!query.trim() || !placesService.current) {
      setSuggestions([]);
      return;
    }

    try {
      const request: google.maps.places.FindPlaceFromQueryRequest = {
        query,
        fields: ['name', 'geometry', 'formatted_address'],
        locationBias: {
          center: { lat: 35.6762, lng: 139.6503 }, // 東京の座標
          radius: 50000 // 50km
        }
      };

      const response = await new Promise<{ results: google.maps.places.PlaceResult[] }>((resolve, reject) => {
        placesService.current?.findPlaceFromQuery(
          request,
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              resolve({ results });
            } else {
              reject(new Error('場所の検索に失敗しました'));
            }
          }
        );
      });

      if (response.results) {
        setSuggestions(response.results);
      }
    } catch (error) {
      console.error('予測検索エラー:', error);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      fetchSuggestions(startQuery, setStartSuggestions);
    }, 300);

    const endTimeout = setTimeout(() => {
      fetchSuggestions(endQuery, setEndSuggestions);
    }, 300);

    return () => {
      clearTimeout(startTimeout);
      clearTimeout(endTimeout);
    };
  }, [startQuery, endQuery]);

  const handleStartSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      const location: Location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setSelectedStart(location);
      setStartQuery(place.formatted_address || place.name || '');
      setShowStartSuggestions(false);
    }
  };

  const handleEndSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      const location: Location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setSelectedEnd(location);
      setEndQuery(place.formatted_address || place.name || '');
      setShowEndSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStart && selectedEnd) {
      onSearch(selectedStart, selectedEnd);
    }
  };

  const handleCurrentLocationClick = () => {
    if (currentLocation) {
      setSelectedStart(currentLocation);
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
            value={startQuery}
            onChange={(e) => {
              setStartQuery(e.target.value);
              setShowStartSuggestions(true);
            }}
            onFocus={() => setShowStartSuggestions(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-black"
            placeholder="出発地を入力"
            required
          />
          {showStartSuggestions && startSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              {startSuggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleStartSelect(suggestion)}
                >
                  {suggestion.formatted_address || suggestion.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">
            目的地
          </label>
          <input
            ref={endInputRef}
            type="text"
            id="end"
            value={endQuery}
            onChange={(e) => {
              setEndQuery(e.target.value);
              setShowEndSuggestions(true);
            }}
            onFocus={() => setShowEndSuggestions(true)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-black"
            placeholder="目的地を入力"
            required
          />
          {showEndSuggestions && endSuggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              {endSuggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleEndSelect(suggestion)}
                >
                  {suggestion.formatted_address || suggestion.name}
                </div>
              ))}
            </div>
          )}
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