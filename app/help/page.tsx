import React from 'react';

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ヘルプ</h1>
      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">基本的な使い方</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>出発地と目的地を地図上でクリックして選択</li>
            <li>「ルート検索」ボタンをクリック</li>
            <li>表示された有料・無料ルートから選択</li>
            <li>案内に従って目的地まで移動</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">よくある質問</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Q: ルートはどのように選択されますか？</h3>
              <p className="text-gray-600">
                A: リアルタイムの交通情報を基に、有料ルートと無料ルートの2つの選択肢を提示します。
              </p>
            </div>
            <div>
              <h3 className="font-medium">Q: 交通情報はどのくらいの頻度で更新されますか？</h3>
              <p className="text-gray-600">
                A: 30〜60秒ごとに自動的に更新されます。
              </p>
            </div>
            <div>
              <h3 className="font-medium">Q: 渋滞が発生した場合はどうなりますか？</h3>
              <p className="text-gray-600">
                A: 渋滞が発生した場合、自動的に代替ルートを提案します。
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">お問い合わせ</h2>
          <p className="text-gray-600">
            ご不明な点がございましたら、<a href="/contact" className="text-blue-600 hover:underline">お問い合わせフォーム</a>からご連絡ください。
          </p>
        </section>
      </div>
    </div>
  );
} 