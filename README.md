# Fast-Map

Fast-Mapは、リアルタイムの交通情報を活用した最適なルート検索とナビゲーションを提供するWebアプリケーションです。

## 主な機能

- 🗺️ インタラクティブな地図表示
- 🚗 複数のルート選択オプション
  - 最短ルート
  - 混雑回避ルート
  - 景色の良いルート
- 📊 リアルタイム交通情報の表示
  - 混雑状況
  - 遅延情報
- ⚡ パフォーマンス最適化
  - ルート描画の高速化
  - キャッシュ機能

## 技術スタック

- **フロントエンド**
  - Next.js 14
  - TypeScript
  - Leaflet (地図表示)
  - React Hooks

- **バックエンド**
  - Next.js API Routes
  - キャッシュシステム

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/marumo333/Fast-Map.git
cd Fast-Map
```

2. 依存関係のインストール
```bash
npm install
```

3. 開発サーバーの起動
```bash
npm run dev
```

4. ブラウザで [http://localhost:3000](http://localhost:3000) にアクセス

## プロジェクト構造

```
src/
├── app/
│   ├── components/
│   │   ├── Map.tsx        # 地図表示コンポーネント
│   │   └── RouteSelector.tsx  # ルート選択コンポーネント
│   └── page.tsx           # メインページ
├── utils/
│   └── trafficPolling.ts  # 交通情報ポーリング機能
└── types/                 # 型定義
```

## パフォーマンス最適化

- ルート描画の最適化
- 交通情報のポーリング間隔の調整
- キャッシュシステムの実装

## 今後の開発予定

- [ ] ユーザー認証機能の追加
- [ ] お気に入りルートの保存機能
- [ ] モバイルアプリ版の開発
- [ ] より詳細な交通情報の表示

## ライセンス

MIT License

## 貢献

1. このリポジトリをフォーク
2. 新しいブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成
