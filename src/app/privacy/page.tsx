import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">プライバシーポリシー</h1>
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. 個人情報の収集について</h2>
          <p className="text-gray-600">
            本サービスでは、以下の情報を収集する場合があります：
          </p>
          <ul className="list-disc list-inside text-gray-600 ml-4 mt-2">
            <li>位置情報（現在地、目的地）</li>
            <li>デバイス情報</li>
            <li>利用履歴</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. 個人情報の利用目的</h2>
          <p className="text-gray-600">
            収集した情報は、以下の目的で利用されます：
          </p>
          <ul className="list-disc list-inside text-gray-600 ml-4 mt-2">
            <li>ルート検索の提供</li>
            <li>交通情報の提供</li>
            <li>サービスの改善</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. 個人情報の管理</h2>
          <p className="text-gray-600">
            本サービスは、収集した個人情報を適切に管理し、以下の場合を除き、個人情報を第三者に開示することはありません：
          </p>
          <ul className="list-disc list-inside text-gray-600 ml-4 mt-2">
            <li>法令に基づく場合</li>
            <li>ユーザーの同意がある場合</li>
            <li>統計的な情報として、個人を特定できない形式で開示する場合</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. アクセス解析ツール</h2>
          <p className="text-gray-600">
            本サービスでは、Googleアナリティクスを使用してアクセス解析を行っています。
            GoogleアナリティクスはCookieを使用して、個人を特定できない形式で情報を収集します。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. プライバシーポリシーの変更</h2>
          <p className="text-gray-600">
            本プライバシーポリシーは、予告なく変更される場合があります。
            変更後のプライバシーポリシーは、本サービス上で公開された時点で効力を生じるものとします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. お問い合わせ</h2>
          <p className="text-gray-600">
            本プライバシーポリシーに関するお問い合わせは、<a href="/contact" className="text-blue-600 hover:underline">お問い合わせフォーム</a>からご連絡ください。
          </p>
        </section>
      </div>
    </div>
  );
} 