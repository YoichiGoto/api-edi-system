# API-based EDI System

中小企業共通EDI標準（ver.4.2）に準拠したAPIベースのEDIシステム

## 概要

OrderfulのようなREST APIを通じて、JSONとXML（UN/CEFACT標準）間の変換、バリデーション、マッピング機能を提供する共通EDIプロバイダシステムです。

## 機能

- REST APIによるEDIデータ送受信
- JSON ↔ XML自動変換
- XMLスキーマバリデーション
- JSONスキーマバリデーション
- マッピング機能（業務アプリ固有フォーマット ↔ 共通EDI標準フォーマット）
- 送信先振り分け機能
- 送達確認機能
- API Key認証、JWT認証

## 技術スタック

- Node.js + TypeScript
- Express.js
- PostgreSQL
- fast-xml-parser (XML処理)
- ajv (JSONバリデーション)
- xlsx (Excel読み込み)

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
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edi_system
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
API_KEY_HEADER=zag-api-key

# Gemini API (オプション - Excel前処理のAIフォールバック用)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. データベースのセットアップ（Supabase）

このプロジェクトはSupabaseを使用しています。スキーマは既に適用済みです。

#### 環境変数の設定

プロジェクトルートに `.env` ファイルを作成：

```bash
# Supabase接続情報を設定
DATABASE_URL=postgresql://postgres.rxripszlaakydjkwhxrt:[YOUR-PASSWORD]@db.rxripszlaakydjkwhxrt.supabase.co:5432/postgres

# または個別パラメータで設定
# DB_HOST=db.rxripszlaakydjkwhxrt.supabase.co
# DB_PORT=5432
# DB_NAME=postgres
# DB_USER=postgres.rxripszlaakydjkwhxrt
# DB_PASSWORD=your_password_here
```

接続情報は [Supabase Dashboard](https://supabase.com/dashboard) > Settings > Database から取得できます。

詳細は [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) を参照してください。

#### 接続テスト

```bash
npm run test-db
```

### 4. Excel前処理（JSON化）

付表１（相互連携性情報項目表）、付表３（マッピング表）、付表４（識別コード定義表）をJSONに変換：

```bash
# 前処理セットアップの確認
npm run test-preprocess

# 前処理の実行（すべての付表を変換）
npm run preprocess
```

または個別に実行：

```bash
# 情報項目表の変換
ts-node scripts/preprocess/info-item-converter.ts

# マッピング表の変換
ts-node scripts/preprocess/mapping-converter.ts

# コード定義表の変換
ts-node scripts/preprocess/code-def-converter.ts

# JSON検証
ts-node scripts/preprocess/validate-json.ts
```

**注意**: 前処理スクリプトは複数テーブルを自動検出し、AIフォールバック（Gemini API）を使用する場合があります。

### 5. ビルド

```bash
npm run build
```

### 6. サーバー起動

```bash
# 開発モード
npm run dev

# 本番モード
npm start
```

## APIエンドポイント

### ヘルスチェック
- `GET /health` - サーバー状態確認

### 注文関連
- `POST /api/v1/orders` - 注文送信（JSON受信）
- `GET /api/v1/orders/:id` - 注文取得
- `GET /api/v1/orders` - 注文一覧

### 請求関連
- `POST /api/v1/invoices` - 請求送信（JSON受信）
- `GET /api/v1/invoices/:id` - 請求取得

### メッセージ関連
- `GET /api/v1/messages` - メッセージ一覧
- `GET /api/v1/messages/:id` - メッセージ取得
- `GET /api/v1/messages/:id/status` - 送達状況確認

### 情報項目関連
- `GET /api/v1/information-items` - 情報項目一覧
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

## プロジェクト構造

```
api-edi-system/
├── src/
│   ├── api/              # APIルートとミドルウェア
│   ├── services/         # ビジネスロジック
│   ├── models/           # データモデル
│   ├── utils/            # ユーティリティ
│   ├── data/             # JSON化されたデータ
│   │   ├── information-items/  # 付表１（相互連携性情報項目表）
│   │   ├── mappings/           # 付表３（マッピング表）
│   │   └── code-definitions/   # 付表４（識別コード定義表）
│   └── schemas/          # XML/JSONスキーマ
├── scripts/
│   ├── preprocess/       # Excel前処理スクリプト
│   │   ├── table-detector.ts    # ルールベーステーブル検出
│   │   ├── ai-table-detector.ts # AIフォールバック（Gemini API）
│   │   ├── info-item-converter.ts
│   │   ├── mapping-converter.ts
│   │   └── code-def-converter.ts
│   └── test-preprocess.ts # 前処理セットアップテスト
├── database/             # データベーススキーマ
└── tests/                # テスト
```

## 開発

### 型チェック

```bash
npm run build
```

### テスト

```bash
npm test
```

## ライセンス

MIT

