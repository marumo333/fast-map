# Fast-Map

Fast-Mapは、Google Maps APIを使用した高速なルート検索アプリケーションです。

## 主な機能

- 出発地と目的地の検索（Google Places Autocomplete）
- 車でのルート検索（所要時間、距離、混雑状況）
- 徒歩でのルート検索（所要時間、距離）
- リアルタイムの交通情報表示
- 複数のルート選択肢の表示
- レスポンシブデザイン
- ダークモード/ライトモードの切り替え
- 現在地の自動取得と表示
- 交通情報のリアルタイム通知
- 代替ルートの提案機能

## 実装の苦労点

1. **Google Maps APIの型定義**
   - `@googlemaps/google-maps-services-js`の型定義が不完全で、特に`DirectionsStep`の型定義に苦労
   - 有料道路の判定機能は一時的に削除し、将来的な実装を検討中

2. **ルート検索の最適化**
   - 複数のルート選択肢を表示する際のパフォーマンス最適化
   - 交通情報の取得と表示の実装

3. **エラーハンドリング**
   - APIのレスポンスに応じた適切なエラーメッセージの表示
   - ユーザーフレンドリーなエラー表示の実装

4. **ダークモードの実装**
   - システムの設定に応じた自動切り替え
   - ユーザー設定の永続化（localStorage）
   - ページ遷移時の状態維持
   - コンポーネント間での状態共有（Context API）
   - スムーズな切り替えアニメーション

5. **位置情報の取得と表示**
   - ブラウザの位置情報APIの非同期処理
   - 位置情報の取得失敗時のフォールバック
   - 住所の逆ジオコーディング（緯度経度から住所への変換）

6. **リアルタイム通知**
   - 交通情報の定期的なポーリング
   - 通知の表示タイミングの最適化
   - 代替ルートの提案ロジック

## 技術スタック

- Next.js 14
- TypeScript
- Google Maps API
- Tailwind CSS
- Vercel（デプロイ）

## デプロイ

アプリケーションはVercelでデプロイされています：
[Fast-Map on Vercel](https://fast-map-five.vercel.app)

## 環境変数

以下の環境変数を設定する必要があります：

```env
GOOGLE_MAPS_API_KEY=your_api_key_here
```

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/marumo333/fast-map.git
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
`.env.local`ファイルを作成し、必要な環境変数を設定

4. 開発サーバーの起動
```bash
npm run dev
```

## 今後の改善点

- 有料道路の判定機能の再実装
- より詳細な交通情報の表示
- ルートの保存機能
- ユーザー認証の追加

## ライセンス

MIT

---

詳細な要件・仕様は [PRD.md](./PRD.md) を参照してください。
