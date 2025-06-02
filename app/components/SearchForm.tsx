'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Location } from '../types/location';
import { useLocation } from '../contexts/LocationContext';
import { getAddressFromLocation } from '../utils/geocoding';
import { initializePlaceAutocomplete } from '../utils/googleMaps';

interface SearchFormProps {
  onSearch: (start: Location, end: Location) => void;
  isSearching: boolean;
  onClose: () => void;
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

  useEffect(() => {
    const initializeCurrentLocation = async () => {
      if (currentLocation && !selectedStart) {
        try {
          const address = await getAddressFromLocation(currentLocation);
          setSelectedStart(currentLocation);
          setStartQuery(address);
        } catch (error) {
          console.error('現在地の住所取得に失敗:', error);
          setSelectedStart(currentLocation);
        }
      }
    };

    initializeCurrentLocation();
  }, [currentLocation, selectedStart]);

  useEffect(() => {
    const initAutocomplete = async () => {
      if (startInputRef.current && !startAutocomplete.current) {
        startAutocomplete.current = await initializePlaceAutocomplete(
          startInputRef,
          (place) => {
            const location = place.geometry?.location;
            if (location) {
              setSelectedStart({
                lat: location.lat(),
                lng: location.lng(),
                address: place.formatted_address || ''
              });
              setStartQuery(place.formatted_address || '');
            }
          }
        );
      }

      if (endInputRef.current && !endAutocomplete.current) {
        endAutocomplete.current = await initializePlaceAutocomplete(
          endInputRef,
          (place) => {
            const location = place.geometry?.location;
            if (location) {
              setSelectedEnd({
                lat: location.lat(),
                lng: location.lng(),
                address: place.formatted_address || ''
              });
              setEndQuery(place.formatted_address || '');
            }
          }
        );
      }
    };

    initAutocomplete();
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStart && selectedEnd) {
      onSearch(selectedStart, selectedEnd);
    }
  }, [selectedStart, selectedEnd, onSearch]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="start" className="block text-sm font-medium text-gray-700">
          出発地
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="start"
            ref={startInputRef}
            value={startQuery}
            onChange={(e) => setStartQuery(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="出発地を入力"
          />
        </div>
      </div>

      <div>
        <label htmlFor="end" className="block text-sm font-medium text-gray-700">
          目的地
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="end"
            ref={endInputRef}
            value={endQuery}
            onChange={(e) => setEndQuery(e.target.value)}
            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="目的地を入力"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!selectedStart || !selectedEnd || isSearching}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {isSearching ? '検索中...' : 'ルートを検索'}
        </button>
      </div>
    </form>
  );
};

export default SearchForm; 