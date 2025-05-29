import React from 'react';

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">利用規約</h1>
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. はじめに</h2>
          <p className="text-gray-600">
            本規約は、Fast-Map（以下「本サービス」）の利用条件を定めるものです。
            ユーザーは本規約に同意の上、本サービスを利用するものとします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. サービスの利用</h2>
          <p className="text-gray-600">
            本サービスは、リアルタイムの交通情報を基に最適なルートを提案するナビゲーションサービスです。
            ユーザーは、本サービスを利用する際に、正確な情報を入力する責任があります。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. 免責事項</h2>
          <p className="text-gray-600">
            本サービスは、交通状況や道路状況の変化により、提案するルートが最適でない場合があります。
            ユーザーは、実際の道路状況を確認し、安全運転を心がけてください。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. プライバシーポリシー</h2>
          <p className="text-gray-600">
            本サービスのプライバシーポリシーについては、<a href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</a>をご覧ください。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. 規約の変更</h2>
          <p className="text-gray-600">
            本規約は、予告なく変更される場合があります。
            変更後の規約は、本サービス上で公開された時点で効力を生じるものとします。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. お問い合わせ</h2>
          <p className="text-gray-600">
            本規約に関するお問い合わせは、<a href="/contact" className="text-blue-600 hover:underline">お問い合わせフォーム</a>からご連絡ください。
          </p>
        </section>
      </div>
    </div>
  );
} 