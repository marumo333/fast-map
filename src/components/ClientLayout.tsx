'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type ClientLayoutProps = {
  children: React.ReactNode;
};

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

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
    <div className="min-h-screen flex flex-col">
      <Navbar onGetCurrentLocation={getCurrentLocation} />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default ClientLayout; 