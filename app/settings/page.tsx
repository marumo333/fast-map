'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocation } from '../contexts/LocationContext';
import { useTheme } from './ThemeContext';

export default function SettingsPage() {
  const router = useRouter();
  const { currentLocation } = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [settings, setSettings] = useState({
    notifications: false,
    trafficUpdates: false,
    darkMode: isDarkMode
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // ローカルストレージから設定を読み込む
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      // ダークモードの状態を同期
      if (parsedSettings.darkMode !== isDarkMode) {
        toggleDarkMode();
      }
    }
  }, []);

  // ダークモードの状態が変更されたときに設定を更新
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: isDarkMode
    }));
  }, [isDarkMode]);

  const handleSettingChange = async (key: keyof typeof settings) => {
    setIsTransitioning(true);
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));

    // ダークモードの切り替え
    if (key === 'darkMode') {
      // トランジション用のクラスを追加
      document.documentElement.classList.add('theme-transition');
      await toggleDarkMode();
      // トランジション完了後にクラスを削除
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
        setIsTransitioning(false);
      }, 300);
    } else {
      setIsTransitioning(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-6 transition-colors duration-300`}>
          <h1 className={`text-2xl font-bold mb-8 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>設定</h1>
          
          <div className="space-y-6">
            {/* 通知設定 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>通知設定</h2>
                <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  重要な更新やアラートを受け取ります
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications')}
                disabled={isTransitioning}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  settings.notifications ? 'bg-primary' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 交通情報の更新 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>交通情報の更新</h2>
                <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  リアルタイムの交通情報の更新を受け取ります
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('trafficUpdates')}
                disabled={isTransitioning}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  settings.trafficUpdates ? 'bg-primary' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    settings.trafficUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* ダークモード */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-lg font-medium transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ダークモード</h2>
                <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ダークテーマに切り替えます
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('darkMode')}
                disabled={isTransitioning}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  settings.darkMode ? 'bg-primary' : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 