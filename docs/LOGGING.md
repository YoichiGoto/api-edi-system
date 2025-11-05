# ログ機能ガイド

## 概要

Winstonを使用したログ機能を実装しています。ログはファイルとコンソールに出力されます。

## ログレベル

以下のログレベルが使用できます：

- `error`: エラーログ
- `warn`: 警告ログ
- `info`: 情報ログ
- `debug`: デバッグログ

## 環境変数

### LOG_LEVEL

ログレベルを設定します：

```env
LOG_LEVEL=info  # error, warn, info, debug
```

デフォルト:
- プロダクション: `info`
- 開発環境: `debug`

### ENABLE_CONSOLE_LOG

プロダクション環境でコンソールログを有効にする場合：

```env
ENABLE_CONSOLE_LOG=true
```

## ログファイル

ログは`logs/`ディレクトリに保存されます：

- `error.log`: エラーログのみ
- `combined.log`: すべてのログ
- `access.log`: APIアクセスログ（infoレベル以上）

### ログファイルのローテーション

- 最大ファイルサイズ: 5MB
- 最大保持ファイル数: 5

## 使用方法

### 基本的なログ出力

```typescript
import logger from './utils/logger';

logger.info('Server started');
logger.error('Database connection failed', { error: error.message });
logger.warn('Rate limit approaching');
logger.debug('Processing request', { requestId: '123' });
```

### パフォーマンス計測

```typescript
import { loggerExtensions } from './utils/logger';

const endMeasure = loggerExtensions.measurePerformance('database-query');
// ... 処理 ...
const duration = endMeasure(); // 経過時間を返す
```

### APIリクエストログ

```typescript
import { loggerExtensions } from './utils/logger';

loggerExtensions.logRequest(req);
loggerExtensions.logResponse(req, res, duration);
```

### データベースクエリログ

```typescript
import { loggerExtensions } from './utils/logger';

loggerExtensions.logQuery('SELECT * FROM users', ['user1'], 150);
```

## ログフォーマット

### 開発環境

コンソールにカラー付きで出力：

```
2024-01-01 12:00:00 [info]: Server is running on port 3000
```

### プロダクション環境

JSON形式でファイルに出力：

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "Server is running",
  "service": "api-edi-system",
  "port": 3000,
  "environment": "production"
}
```

## エラーログ

エラーハンドリングユーティリティと統合されています：

```typescript
import { logError } from './utils/errorHandler';

try {
  // ...
} catch (error) {
  logError(error, { context: 'additional info' });
}
```

## ログの監視

### ログファイルの確認

```bash
# エラーログを確認
tail -f logs/error.log

# すべてのログを確認
tail -f logs/combined.log

# アクセスログを確認
tail -f logs/access.log
```

### ログの検索

```bash
# エラーログを検索
grep "ERROR" logs/combined.log

# 特定のリクエストを検索
grep "requestId.*123" logs/access.log
```

## パフォーマンス監視

### レスポンス時間の監視

APIリクエストのレスポンス時間は自動的にログに記録されます：

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "API Response",
  "method": "POST",
  "path": "/api/v1/orders",
  "statusCode": 201,
  "duration": "150ms",
  "applicationId": "app-123"
}
```

### パフォーマンス計測

```typescript
const endMeasure = loggerExtensions.measurePerformance('heavy-operation');
// 重い処理
const duration = endMeasure();
logger.info(`Heavy operation completed in ${duration}ms`);
```

## ベストプラクティス

1. **適切なログレベルを使用**
   - `error`: エラーが発生した場合のみ
   - `warn`: 警告や注意が必要な場合
   - `info`: 一般的な情報
   - `debug`: デバッグ情報

2. **構造化されたログ**
   - メタデータを追加してコンテキストを提供
   - オブジェクト形式でログを記録

3. **機密情報の除外**
   - パスワードやAPIキーなどの機密情報はログに記録しない

4. **パフォーマンスへの影響**
   - 大量のログ出力はパフォーマンスに影響する可能性がある
   - プロダクション環境では適切なログレベルを設定

## トラブルシューティング

### ログファイルが作成されない

`logs/`ディレクトリの書き込み権限を確認してください。

### ログが出力されない

`LOG_LEVEL`環境変数を確認してください。ログレベルが高すぎると、低いレベルのログは出力されません。

### ログファイルが大きくなりすぎる

ログローテーション設定を確認してください。最大ファイルサイズと保持ファイル数を調整できます。

