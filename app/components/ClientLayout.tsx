'use client';

import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { LocationProvider, useLocation } from '../contexts/LocationContext';

type ClientLayoutProps = {
  children: React.ReactNode;
};

const LayoutContent: React.FC<ClientLayoutProps> = ({ children }) => {
  const { getCurrentLocation } = useLocation();

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

const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <LocationProvider>
      <LayoutContent>{children}</LayoutContent>
    </LocationProvider>
  );
};

export default ClientLayout; 