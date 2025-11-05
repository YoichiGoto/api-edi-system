# マッピング機能詳細ガイド

## 概要

マッピング機能は、業務アプリケーション固有のフォーマットと共通EDI標準フォーマット間の変換を行います。

## 機能一覧

### 1. データ型変換

以下のデータ型変換がサポートされています：

- **string**: 文字列への変換（トリム処理を含む）
- **number**: 数値への変換（カンマ区切り対応）
- **date**: 日付への変換（ISO8601形式: YYYY-MM-DD）
- **datetime**: 日時への変換（ISO8601形式: YYYY-MM-DDThh:mm:ss）
- **boolean**: ブール値への変換（'true', '1', 'yes', '○' など）
- **code**: コード値への変換（文字列として扱う）

#### 使用例

```typescript
{
  appField: "orderDate",
  ediField: "header.orderDate",
  dataType: "date",
  required: true
}
```

### 2. デフォルト値の補完

必須フィールドで値が存在しない場合、デフォルト値を自動的に補完します。

#### 使用例

```typescript
{
  appField: "currency",
  ediField: "header.currency",
  required: true,
  defaultValue: "JPY",
  dataType: "string"
}
```

### 3. 条件付きマッピング

条件式を評価して、条件が満たされた場合のみマッピングを適用します。

#### サポートされている演算子

- `===`, `==`: 等価
- `!==`, `!=`: 非等価
- `>`, `<`: 大小比較
- `>=`, `<=`: 以上・以下

#### 使用例

```typescript
{
  appField: "discountAmount",
  ediField: "header.discount",
  condition: "hasDiscount === 'true'",
  dataType: "number"
}
```

### 4. カスタム変換関数

組み込みの変換関数を使用して、値の変換やフォーマットを行います。

#### 利用可能な変換関数

- **uppercase**: 大文字に変換
- **lowercase**: 小文字に変換
- **trim**: 前後の空白を削除
- **abs**: 絶対値
- **round**: 四捨五入
- **floor**: 切り捨て
- **ceil**: 切り上げ
- **toISO8601Date**: ISO8601日付形式に変換
- **toISO8601DateTime**: ISO8601日時形式に変換

#### 使用例

```typescript
{
  appField: "orderNumber",
  ediField: "header.orderNumber",
  transformation: "uppercase",
  required: true
}
```

### 5. 複合変換

複数の機能を組み合わせて使用できます。

#### 使用例

```typescript
{
  appField: "totalAmount",
  ediField: "header.totalAmount",
  dataType: "number",
  transformation: "round",
  required: true,
  defaultValue: 0
}
```

## FieldMappingインターフェース

```typescript
interface FieldMapping {
  appField: string;              // 業務アプリ側のフィールド名
  ediField: string;              // EDI標準側のフィールド名
  ediId?: string;                // EDI ID
  required: boolean;              // 必須フラグ
  defaultValue?: any;            // デフォルト値
  dataType?: 'string' | 'number' | 'date' | 'datetime' | 'boolean' | 'code';
  transformation?: string;       // 変換関数名
  condition?: string;            // 条件式
  format?: string;               // フォーマット指定（将来拡張用）
}
```

## マッピング設定の作成

### API経由での作成

```bash
POST /api/v1/mapping-configs
Content-Type: application/json
zag-api-key: your-api-key

{
  "messageType": "order",
  "fieldMappings": [
    {
      "appField": "orderDate",
      "ediField": "header.orderDate",
      "required": true,
      "dataType": "date"
    },
    {
      "appField": "totalAmount",
      "ediField": "header.totalAmount",
      "required": true,
      "dataType": "number",
      "transformation": "round"
    },
    {
      "appField": "currency",
      "ediField": "header.currency",
      "required": true,
      "defaultValue": "JPY",
      "dataType": "string"
    }
  ]
}
```

### マッピングテーブルからの自動生成

マッピングテーブル（付表３）から読み込まれたマッピングは、基本的なフィールドマッピングとして自動的に使用されます。

データ型や変換関数を追加する場合は、マッピング設定APIでカスタマイズできます。

## エラーハンドリング

### データ型変換エラー

データ型変換に失敗した場合：
- エラーログを出力
- 元の値をそのまま使用
- 処理は継続

### 条件評価エラー

条件式の評価に失敗した場合：
- 警告ログを出力
- 条件を満たさないものとして扱う
- マッピングをスキップ

### 変換関数エラー

変換関数の実行に失敗した場合：
- 警告ログを出力
- 元の値をそのまま使用
- 処理は継続

## パフォーマンス考慮事項

- マッピング設定は起動時に読み込まれ、メモリにキャッシュされます
- データ型変換は軽量な処理ですが、大量のデータ処理時はパフォーマンスに注意してください
- 条件評価は簡易実装のため、複雑な条件式は非効率になる可能性があります

## 今後の拡張

- JSONPath式のサポート（条件評価の強化）
- カスタム変換関数の登録機能
- 変換ルールのバージョン管理
- マッピング設定のテンプレート機能

