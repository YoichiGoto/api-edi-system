# API-based EDI System

中小企業共通EDI標準（ver.4.2）に準拠したAPIベースのEDIシステム

## 概要

OrderfulのようなREST APIを通じて、JSONとXML（UN/CEFACT標準）間の変換、バリデーション、マッピング機能を提供する共通EDIプロバイダシステムです。

## 主な機能

- REST APIによるEDIデータ送受信
- JSON ↔ XML自動変換
- XMLスキーマバリデーション
- JSONスキーマバリデーション
- マッピング機能（業務アプリ固有フォーマット ↔ 共通EDI標準フォーマット）
  - データ型変換（文字列、数値、日付、日時、ブール値、コード）
  - デフォルト値の補完
  - 条件付きマッピング
  - カスタム変換関数
- 送信先振り分け機能
- 送達確認機能
- API Key認証、JWT認証
- ログ機能（Winston）
- テスト機能（Jest）

## 技術スタック

- Node.js + TypeScript
- Express.js
- PostgreSQL (Supabase)
- fast-xml-parser (XML処理)
- ajv (JSONバリデーション)
- xlsx (Excel読み込み)
- Winston (ログ)
- Jest (テスト)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下の変数を設定してください：

```env
PORT=3000
NODE_ENV=development

# Supabase接続情報
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 認証設定
JWT_SECRET=your_jwt_secret_key
API_KEY_HEADER=zag-api-key

# ログ設定
LOG_LEVEL=info

# Gemini API (オプション - Excel前処理のAIフォールバック用)
GEMINI_API_KEY=your_gemini_api_key_here
```

詳細は [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) を参照してください。

### 3. データベースのセットアップ

このプロジェクトはSupabaseを使用しています。スキーマは既に適用済みです。

接続情報は [Supabase Dashboard](https://supabase.com/dashboard) > Settings > Database から取得できます。

### 4. 前処理データの生成

```bash
npm run preprocess
```

### 5. ビルド

```bash
npm run build
```

### 6. サーバー起動

```bash
npm start
# または開発モード
npm run dev
```

## 使用方法

### ヘルスチェック

```bash
curl http://localhost:3000/health
```

### 注文送信

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "zag-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "messageType": "order",
    "receiverId": "receiver@provider",
    "data": {
      "orderNumber": "ORD-001",
      "orderDate": "2024-01-01",
      "totalAmount": 10000
    }
  }'
```

## テスト

```bash
# すべてのテストを実行
npm test

# カバレッジ付きで実行
npm test -- --coverage
```

## ログ

ログは`logs/`ディレクトリに保存されます：

- `error.log`: エラーログのみ
- `combined.log`: すべてのログ
- `access.log`: APIアクセスログ

```bash
# エラーログを確認
tail -f logs/error.log
```

詳細は [docs/LOGGING.md](docs/LOGGING.md) を参照してください。

## APIエンドポイント

### 注文関連
- `POST /api/v1/orders` - 注文送信
- `GET /api/v1/orders` - 注文一覧取得
- `GET /api/v1/orders/:id` - 注文取得

### 請求関連
- `POST /api/v1/invoices` - 請求送信
- `GET /api/v1/invoices/:id` - 請求取得

### メッセージ管理
- `GET /api/v1/messages` - メッセージ一覧取得
- `GET /api/v1/messages/:id` - メッセージ取得
- `GET /api/v1/messages/:id/status` - メッセージ送達状況確認

### 情報項目参照
- `GET /api/v1/information-items` - 情報項目一覧取得
- `GET /api/v1/information-items/:messageType` - メッセージタイプ別の情報項目取得
- `GET /api/v1/information-items/search?q=検索キーワード` - 情報項目検索

### アプリケーション管理
- `POST /api/v1/applications` - アプリケーション作成（JWT認証必須）
- `GET /api/v1/applications` - アプリケーション一覧（JWT認証必須）
- `GET /api/v1/applications/:id` - アプリケーション取得（JWT認証必須）
- `DELETE /api/v1/applications/:id` - アプリケーション無効化（JWT認証必須）

### マッピング設定管理
- `POST /api/v1/mapping-configs` - マッピング設定作成
- `GET /api/v1/mapping-configs` - マッピング設定一覧
- `GET /api/v1/mapping-configs/:id` - マッピング設定取得
- `PUT /api/v1/mapping-configs/:id` - マッピング設定更新
- `DELETE /api/v1/mapping-configs/:id` - マッピング設定削除

## 認証

APIリクエストには以下のいずれかの認証が必要です：

1. **API Key認証**: リクエストヘッダーに`zag-api-key`を設定
2. **JWT認証**: リクエストヘッダーに`Authorization: Bearer <token>`を設定

## ドキュメント

- [Supabaseセットアップガイド](docs/SUPABASE_SETUP.md)
- [XMLスキーマセットアップガイド](docs/XML_SCHEMA_SETUP.md)
- [マッピング機能詳細ガイド](docs/MAPPING_FEATURES.md)
- [テストガイド](docs/TESTING.md)
- [ログ機能ガイド](docs/LOGGING.md)
- [実装サマリー](docs/IMPLEMENTATION_SUMMARY.md)
- [次のステップ](docs/NEXT_STEPS.md)

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。
