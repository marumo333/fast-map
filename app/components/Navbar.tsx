'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocation } from '../contexts/LocationContext';
import { Location } from '../types/location';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { useCookies } from 'react-cookie';
import { RootState } from '../store/store';

type NavbarProps = {
  onGetCurrentLocation: () => Promise<Location | null>;
};

const Navbar: React.FC<NavbarProps> = ({ onGetCurrentLocation }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { isGettingLocation, locationError, clearLocationError } = useLocation();
  const dispatch = useDispatch();
  const [cookies, setCookie, removeCookie] = useCookies(['userId']);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    clearLocationError();
  }, [pathname, clearLocationError]);

  const handleGetLocation = async () => {
    await onGetCurrentLocation();
    router.push('/');
  };

  const handleLogout = () => {
    dispatch(logout());
    removeCookie('userId', { path: '/' });
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Fast-Map</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              className={`bg-primary text-white px-4 py-2 rounded-lg transition-colors ${
                isGettingLocation ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark'
              }`}
            >
              {isGettingLocation ? '取得中...' : '現在地を取得'}
            </button>
            {locationError && (
              <span className="text-red-500 text-sm">{locationError}</span>
            )}
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ホーム
            </Link>
            <Link
              href="/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/settings' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              設定
            </Link>
            <Link
              href="/contact"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/contact' ? 'text-primary' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              お問い合わせ
            </Link>
            {user && (
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                ログアウト
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 