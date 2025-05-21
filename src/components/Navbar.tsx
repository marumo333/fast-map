'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Fast-Map</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ホーム
            </Link>
            <Link
              href="/history"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/history' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              履歴
            </Link>
            <Link
              href="/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/settings' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              設定
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 