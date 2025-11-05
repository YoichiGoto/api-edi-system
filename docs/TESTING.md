# テストガイド

## テスト構成

### テスト種類

1. **ユニットテスト** (`tests/unit/`)
   - 個別の関数やクラスのテスト
   - TypeConverter、DateFormatter、Mapperなどのテスト

2. **統合テスト** (`tests/integration/`)
   - APIエンドポイントのテスト
   - データベースとの統合テスト

3. **E2Eテスト** (将来実装)
   - エンドツーエンドのフローテスト

## テストの実行

### すべてのテストを実行

```bash
npm test
```

### カバレッジ付きで実行

```bash
npm test -- --coverage
```

### 特定のテストファイルを実行

```bash
npm test -- typeConverter.test.ts
```

### Watchモードで実行

```bash
npm test -- --watch
```

## テスト構成

### Jest設定

`jest.config.js`でJestの設定を定義しています：

- TypeScriptサポート（ts-jest）
- カバレッジレポート
- テストタイムアウト: 10秒

### テストセットアップ

`tests/setup.ts`でテスト環境の初期設定を行います：

- 環境変数の読み込み（`.env.test`）
- ログレベルの設定

## テストファイル例

### ユニットテスト例

```typescript
import { TypeConverter } from '../../../src/utils/typeConverter';

describe('TypeConverter', () => {
  describe('convert', () => {
    it('文字列に変換できる', () => {
      expect(TypeConverter.convert(123, 'string')).toBe('123');
    });
  });
});
```

### 統合テスト例

```typescript
import request from 'supertest';
import app from '../../../src/index';

describe('Orders API', () => {
  it('有効なリクエストで注文を作成できる', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('zag-api-key', 'test-api-key')
      .send({ messageType: 'order', data: {} });

    expect(response.status).toBe(201);
  });
});
```

## テストデータの管理

### テスト用データベース

統合テストでは、テスト用のデータベースを使用することを推奨します：

```env
# .env.test
DATABASE_URL=postgresql://postgres:password@localhost:5432/edi_system_test
```

### テストデータのクリーンアップ

各テストの`afterAll`や`afterEach`でテストデータをクリーンアップします。

## モック

### データベースのモック

必要に応じて、データベース接続をモック化できます：

```typescript
jest.mock('../../../src/utils/database', () => ({
  db: {
    query: jest.fn(),
  },
}));
```

## カバレッジ

### カバレッジレポートの確認

```bash
npm test -- --coverage
```

カバレッジレポートは`coverage/`ディレクトリに生成されます。

### カバレッジ目標

- ステートメント: 80%以上
- ブランチ: 75%以上
- 関数: 80%以上
- 行: 80%以上

## CI/CDでのテスト

### GitHub Actions例

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

## トラブルシューティング

### テストがタイムアウトする

`jest.config.js`の`testTimeout`を増やしてください。

### データベース接続エラー

テスト用のデータベースが起動しているか確認してください。

### モックが機能しない

モックの順序を確認してください。`jest.mock()`は`import`の前に配置する必要があります。

