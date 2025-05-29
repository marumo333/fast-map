import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">Fast-Map</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              リアルタイムの交通情報を活用した最適なルート検索サービス。
              より快適な移動をサポートします。
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-200">サービス</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-400 hover:text-primary transition-colors duration-200">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-gray-400 hover:text-primary transition-colors duration-200">
                  設定
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-200">サポート</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-gray-400 hover:text-primary transition-colors duration-200">
                  ヘルプ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-primary transition-colors duration-200">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-200">法的情報</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors duration-200">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-primary transition-colors duration-200">
                  利用規約
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Fast-Map. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 