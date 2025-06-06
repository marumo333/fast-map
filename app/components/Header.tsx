'use client';

import React from 'react';

type HeaderProps = {
  onToggleMenu: () => void;
  onGetCurrentLocation: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggleMenu, onGetCurrentLocation }) => {
  const handleGetCurrentLocation = () => {
    onGetCurrentLocation();
    // Mapコンポーネントにメッセージを送信
    window.postMessage('getCurrentLocation', '*');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Fast-Map</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGetCurrentLocation}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
            >
              現在地を取得
            </button>
            <button
              onClick={onToggleMenu}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 