# Supabaseデータベースセットアップガイド

## ✅ セットアップ完了

Supabaseへのデータベーススキーマ適用が完了しました。

### 作成済みテーブル

以下のテーブルがSupabaseプロジェクト `rxripszlaakydjkwhxrt` に作成されています：

- ✅ `users` - ユーザー情報
- ✅ `applications` - アプリケーション情報（APIキー管理）
- ✅ `messages` - EDIメッセージ履歴
- ✅ `mapping_configs` - マッピング設定
- ✅ `code_definitions` - コード定義（参照用）

### インデックス

以下のインデックスも作成済みです：

- `messages` テーブル: sender_id, receiver_id, message_type, status, created_at
- `mapping_configs` テーブル: app_id, message_type
- `code_definitions` テーブル: code_type, code, category

## 接続情報の取得

Supabaseダッシュボードからデータベース接続情報を取得してください：

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクト `rxripszlaakydjkwhxrt` を選択
3. **Settings** > **Database** に移動
4. **Connection string** セクションで接続情報を確認

### 接続情報の形式

- **Host**: `db.rxripszlaakydjkwhxrt.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres.rxripszlaakydjkwhxrt`
- **Password**: Supabaseダッシュボードから取得

## 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、以下の内容を設定してください：

```env
# 方法1: 接続文字列を使用（推奨）
DATABASE_URL=postgresql://postgres.rxripszlaakydjkwhxrt:[YOUR-PASSWORD]@db.rxripszlaakydjkwhxrt.supabase.co:5432/postgres

# 方法2: 個別パラメータを使用
# DB_HOST=db.rxripszlaakydjkwhxrt.supabase.co
# DB_PORT=5432
# DB_NAME=postgres
# DB_USER=postgres.rxripszlaakydjkwhxrt
# DB_PASSWORD=your_supabase_database_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# API Key Configuration
API_KEY_HEADER=zag-api-key

# Gemini API (オプション) - .env にのみ記載し、Git にコミットしないでください
GEMINI_API_KEY=your_gemini_api_key_here
```

## データベースパスワードの取得方法

### 方法1: Connection Stringから取得

1. Supabase Dashboard > **Settings** > **Database**
2. **Connection string** セクションで **URI** を表示
3. URIの形式: `postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres`
4. パスワード部分をコピーして `.env` の `DATABASE_URL` に設定

### 方法2: Connection Parametersから取得

1. **Connection parameters** セクションで直接確認
2. **Password** フィールドの値をコピー
3. 個別パラメータとして `.env` に設定

### パスワードをリセットする場合

1. Supabase Dashboard > **Settings** > **Database** > **Reset Database Password**
2. 新しいパスワードを生成
3. `.env` ファイルを更新

## 接続テスト

環境変数を設定後、接続テストを実行：

```bash
# ビルド
npm run build

# サーバー起動
npm start
```

サーバーが起動したら、以下のエンドポイントで接続確認：

```bash
curl http://localhost:3000/health
```

## Supabase Dashboardでの確認

### Table Editor

1. **Table Editor** でテーブル構造を確認できます
2. データの閲覧・編集が可能です

### SQL Editor

1. **SQL Editor** でクエリを実行できます
2. マイグレーション履歴も確認できます

### Database > Tables

1. **Database** > **Tables** でテーブル一覧を確認できます
2. テーブルごとの行数やインデックス情報も表示されます

## セキュリティに関する注意事項

### Row Level Security (RLS)

現在、RLSは無効になっています。これは以下の理由によるものです：

1. アプリケーションレベルでAPIキー認証を実装しているため
2. データベース接続は直接公開されていないため

**本番環境での推奨事項**：

- 必要に応じてRLSを有効化
- サービスロールキーを使用する場合は、RLSを有効化することを強く推奨

### 関数のセキュリティ

`update_updated_at_column()` 関数は `SECURITY DEFINER` と `SET search_path` を設定済みです。

## トラブルシューティング

### 接続エラーが発生する場合

1. `.env` ファイルの接続情報が正しいか確認
2. Supabaseプロジェクトがアクティブか確認
3. ファイアウォール設定を確認（Supabaseは通常、IP制限なし）
4. SSL接続が必要です（コードで自動設定済み）

### "password authentication failed" エラー

- パスワードが正しいか確認
- パスワードに特殊文字が含まれる場合は、URLエンコードが必要な場合があります
- 接続文字列（DATABASE_URL）を使用することを推奨

### SSL接続エラー

- SupabaseはSSL接続が必要です
- コードで自動的にSSL接続を有効化しています
- エラーが続く場合は、`.env` に `DB_SSL=false` を設定して確認（通常は不要）

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [Supabase Database Security](https://supabase.com/docs/guides/database/security)
