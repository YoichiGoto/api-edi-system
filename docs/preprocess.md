# Excel前処理手順

## 概要

中小企業共通EDI標準の付表（Excelファイル）をJSON形式に変換する前処理スクリプトです。

## 対象ファイル

- **付表１**: 相互連携性情報項目表（`03_中小企業共通EDI標準仕様書＜付表１＞相互連携性情報項目表ver.4.2_r0_20231001.xlsx`）
- **付表３**: マッピング表（`05_中小企業共通EDI標準仕様書＜付表３＞マッピング表ver.4.2_r0_20231001a.xlsx`）
- **付表４**: 識別コード定義表（`06_中小企業共通EDI標準仕様書＜付表４＞識別コード定義表ver.4.2_r0_20231001.xlsx`）

## 実行方法

### 一括変換

```bash
npm run preprocess
```

または

```bash
ts-node scripts/preprocess/excel-to-json.ts
```

### 個別変換

#### マッピング表の変換

```bash
ts-node scripts/preprocess/mapping-converter.ts
```

#### コード定義表の変換

```bash
ts-node scripts/preprocess/code-def-converter.ts
```

### JSON検証

```bash
ts-node scripts/preprocess/validate-json.ts
```

## 出力ファイル

### 相互連携性情報項目表（付表１）

- `src/data/information-items/order-cefact-bie-info-items.json`
- `src/data/information-items/invoice-cefact-bie-info-items.json`
- `src/data/information-items/quotation-cefact-bie-info-items.json`
- `src/data/information-items/shipment-cefact-bie-info-items.json`
- `src/data/information-items/purchase-cefact-bie-info-items.json`
- `src/data/information-items/information-items.json`（統合ファイル）

### マッピング表（付表３）

- `src/data/mappings/order-mapping.json`
- `src/data/mappings/invoice-mapping.json`
- `src/data/mappings/mappings.json`（統合ファイル）

### コード定義表（付表４）

- `src/data/code-definitions/数量単位コード-code-definition-0.json`
- `src/data/code-definitions/企業役割コード-code-definition.json`
- `src/data/code-definitions/code-definitions.json`（統合ファイル）

## データ構造

### 相互連携性情報項目表のJSON構造

```json
{
  "sheetName": "注文 (cefact-bie)",
  "messageType": "order",
  "tableType": "cefact-bie",
  "region": {
    "startRow": 16,
    "endRow": 294,
    "startCol": 1,
    "endCol": 20
  },
  "items": [
    {
      "itemName": "注文回答書",
      "rowNumber": "1",
      "headerDetail": "ヘッダ",
      "clId": "",
      "itemDefinition": "受注者が発注者に交付する注文回答文書（メッセージ）。",
      "repetition": "－",
      "establishedRevised": "v1/v4.2",
      "commonEdiMapping": {
        "commonCore": "○",
        "manufacturing": "○",
        "construction": "○",
        "distribution": "○"
      },
      "reference": {
        "invoiceCompatible": "○"
      }
    }
  ]
}
```

### マッピング表のJSON構造

```json
{
  "sheetName": "注文・中小共通コア",
  "messageType": "order",
  "fields": [
    {
      "appField": "注文番号",
      "ediField": "OrderID",
      "ediId": "UN01006532",
      "required": true,
      "dataType": "String",
      "description": "注文を識別するID"
    }
  ]
}
```

### コード定義表のJSON構造

```json
{
  "codeType": "quantity-unit-codes",
  "sheetName": "数量単位コード",
  "codes": [
    {
      "code": "H87",
      "codeName": "個",
      "codeNameEn": "piece",
      "description": "個数単位",
      "internationalCode": "H87",
      "internationalCodeName": "piece",
      "category": "定貫品目"
    }
  ]
}
```

## 複数テーブル検出機能

### 概要

1つのExcelシート内に複数のテーブルが存在する場合でも、自動的に検出して個別に処理できます。

### 検出方法

**ルールベース検出（優先）**:
- データ密度マトリックスの分析（空行・空列の検出）
- 複数ヘッダー行の自動検出
- テーブル範囲の推定（開始行・終了行・開始列・終了列）
- 信頼度スコアリング（0.0-1.0）

**AIフォールバック（最小限）**:
- 信頼度が0.6未満の場合のみGemini APIを使用
- 低信頼度領域のみを部分的に確認
- APIコストを最小限に抑制

### 検出対象テーブルタイプ

- `information-items`: 相互連携性情報項目表
- `cefact-bie`: 国連CEFACTメッセージ辞書・BIE表
- `data-type-supplement`: データ型補足情報
- `mapping`: マッピング表
- `code-definition`: コード定義表

### 環境変数設定

`.env`ファイルに以下を追加（オプション）:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Gemini APIキーが設定されていない場合、AIフォールバックはスキップされ、ルールベース検出のみが使用されます。

### 出力形式

各テーブルは以下の情報を含むJSONファイルとして出力されます:

```json
{
  "sheetName": "注文 (mapping)",
  "messageType": "order",
  "tableType": "mapping",
  "region": {
    "startRow": 15,
    "endRow": 39,
    "startCol": 0,
    "endCol": 10
  },
  "fields": [...]
}
```

## 注意事項

- Excelファイルは複数シートを含む場合があります
- 1つのシート内に複数のテーブルが存在する場合、自動的に検出されます
- 各テーブルは個別のJSONファイルとして出力されます
- 統合JSONファイルも生成されます
- 変換後は`validate-json.ts`で検証することを推奨します
- 信頼度が低いテーブルは、Gemini APIキーが設定されている場合にAIフォールバックが試行されます

