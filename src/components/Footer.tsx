import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Fast-Map</h3>
            <p className="text-gray-300 text-sm">
              リアルタイムの交通情報を活用した最適なルート検索サービス
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">サービス</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white text-sm">
                  ルート検索
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-gray-300 hover:text-white text-sm">
                  履歴
                </Link>
              </li>
              <li>
                <Link href="/settings" className="text-gray-300 hover:text-white text-sm">
                  設定
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">サポート</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-300 hover:text-white text-sm">
                  ヘルプセンター
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white text-sm">
                  お問い合わせ
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white text-sm">
                  よくある質問
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">法的情報</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white text-sm">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white text-sm">
                  プライバシーポリシー
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700">
          <p className="text-gray-300 text-sm text-center">
            © {new Date().getFullYear()} Fast-Map. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 