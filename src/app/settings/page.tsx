'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocation } from '@/contexts/LocationContext';
import { useTheme } from '@/app/settings/ThemeContext';

export default function SettingsPage() {
  const router = useRouter();
  const { currentLocation } = useLocation();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [settings, setSettings] = useState({
    notifications: false,
    trafficUpdates: false,
    darkMode: isDarkMode
  });

  useEffect(() => {
    // ローカルストレージから設定を読み込む
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSettingChange = (key: keyof typeof settings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));

    // ダークモードの切り替え
    if (key === 'darkMode') {
      toggleDarkMode();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">設定</h1>
          
          <div className="space-y-6">
            {/* 通知設定 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">通知設定</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  重要な更新やアラートを受け取ります
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('notifications')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  settings.notifications ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 交通情報の更新 */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">交通情報の更新</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  リアルタイムの交通情報の更新を受け取ります
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('trafficUpdates')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  settings.trafficUpdates ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.trafficUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* ダークモード */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">ダークモード</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ダークテーマに切り替えます
                </p>
              </div>
              <button
                onClick={() => handleSettingChange('darkMode')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  settings.darkMode ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
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