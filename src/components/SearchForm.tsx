'use client';
import React, { useState, useEffect } from 'react';
import { Location } from '@/types/location';

export type SearchFormProps = {
  onSearch: (start: Location, end: Location) => void;
  isLoading?: boolean;
};

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, isLoading = false }) => {
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // 現在位置を取得する関数
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.error('お使いのブラウザは位置情報をサポートしていません。');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setStartLocation(location);
        setIsLocating(false);
      },
      (error) => {
        console.error('位置情報の取得に失敗しました:', error);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // コンポーネントのマウント時に位置情報を取得
  useEffect(() => {
    if (!startLocation) {
      getCurrentLocation();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (startLocation && endLocation) {
      onSearch(startLocation, endLocation);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md">
      <div className="space-y-4">
        <div>
          <label htmlFor="start-location" className="block text-sm font-medium text-gray-700 mb-1">
            出発地点
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="start-location"
              type="text"
              placeholder="出発地点を入力"
              value={startLocation ? `${startLocation.lat}, ${startLocation.lng}` : ''}
              onChange={(e) => {
                const [lat, lng] = e.target.value.split(',').map(Number);
                if (!isNaN(lat) && !isNaN(lng)) {
                  setStartLocation({ lat, lng });
                }
              }}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              required
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="p-2 text-primary hover:text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              title="現在地を設定"
            >
              {isLocating ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="end-location" className="block text-sm font-medium text-gray-700 mb-1">
            到着地点
          </label>
          <input
            id="end-location"
            type="text"
            placeholder="到着地点を入力"
            value={endLocation ? `${endLocation.lat}, ${endLocation.lng}` : ''}
            onChange={(e) => {
              const [lat, lng] = e.target.value.split(',').map(Number);
              if (!isNaN(lat) && !isNaN(lng)) {
                setEndLocation({ lat, lng });
              }
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !startLocation || !endLocation}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '検索中...' : 'ルートを検索'}
        </button>
      </div>
    </form>
  );
};

export default SearchForm; 