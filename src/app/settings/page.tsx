'use client';
import React, { useState } from 'react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    tollRoads: true,
    trafficUpdates: true,
    language: 'ja'
  });

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">設定</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-6">
            {/* 通知設定 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">通知設定</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={settings.notifications}
                    onChange={(e) => handleChange('notifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="notifications" className="ml-3 text-sm text-gray-700">
                    通知を受け取る
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="trafficUpdates"
                    checked={settings.trafficUpdates}
                    onChange={(e) => handleChange('trafficUpdates', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="trafficUpdates" className="ml-3 text-sm text-gray-700">
                    交通情報の更新を受け取る
                  </label>
                </div>
              </div>
            </div>

            {/* 表示設定 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">表示設定</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="darkMode"
                    checked={settings.darkMode}
                    onChange={(e) => handleChange('darkMode', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="darkMode" className="ml-3 text-sm text-gray-700">
                    ダークモード
                  </label>
                </div>
              </div>
            </div>

            {/* ルート設定 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">ルート設定</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="tollRoads"
                    checked={settings.tollRoads}
                    onChange={(e) => handleChange('tollRoads', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="tollRoads" className="ml-3 text-sm text-gray-700">
                    有料道路を含める
                  </label>
                </div>
              </div>
            </div>

            {/* 言語設定 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">言語設定</h3>
              <div className="mt-4">
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              設定を保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 