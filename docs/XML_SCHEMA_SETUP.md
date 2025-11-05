# XMLスキーマファイルのセットアップガイド

## 概要

中小企業共通EDI標準のXMLスキーマファイルを取得して配置する手順です。

## XMLスキーマファイルの取得

### 1. ダウンロード先

中小企業共通EDI標準のXMLスキーマファイルは以下のサイトからダウンロードできます：

**URL**: https://tsunagu-cons.jp/technicalinformation/smeedixml_sample/

### 2. 必要なスキーマファイル

以下のXMLスキーマファイルをダウンロードして `src/schemas/xml/` ディレクトリに配置してください：

| メッセージタイプ | ファイル名 |
|----------------|-----------|
| 見積依頼 | `SMEQuotation.xsd` |
| 見積回答 | `SMEQuotationResponse.xsd` |
| 注文 | `SMEOrder.xsd` |
| 注文回答 | `SMEOrderResponse.xsd` |
| 出荷案内 | `SMEDespatchAdvice.xsd` |
| 出荷回答 | `SMEReceivingAdvice.xsd` |
| 統合請求 | `SMEConsolidatedInvoice.xsd` |
| 単一請求 | `SMEInvoice.xsd` |
| 統合仕入明細 | `SMEConsolidatedSelfInvoice.xsd` |
| 統合仕入明細回答 | `SMEConsolidatedSelfInvoiceResponse.xsd` |
| 単一仕入明細 | `SMESelfInvoice.xsd` |
| 単一仕入明細回答 | `SMESelfInvoiceResponse.xsd` |
| 支払通知 | `SMERemittanceAdvaice.xsd` |
| 需要予測 | `SMESchedulingDemandForcast.xsd` |
| 納入指示 | `SMESchedulingSupplyInstruction.xsd` |

### 3. 配置手順

```bash
# スキーマディレクトリに移動
cd api-edi-system/src/schemas/xml

# ダウンロードしたXSDファイルを配置
# 例：SMEOrder.xsd, SMEInvoice.xsd などを配置
```

### 4. ディレクトリ構造

配置後のディレクトリ構造：

```
api-edi-system/
└── src/
    └── schemas/
        └── xml/
            ├── SMEOrder.xsd
            ├── SMEOrderResponse.xsd
            ├── SMEInvoice.xsd
            ├── SMESelfInvoice.xsd
            └── ... (その他のXSDファイル)
```

## 自動読み込み

XMLスキーマファイルは、アプリケーション起動時に自動的に読み込まれます。

`src/services/validator.ts` の `XMLValidator` クラスが以下の処理を行います：

1. `src/schemas/xml/` ディレクトリを確認
2. メッセージタイプに応じたスキーマファイルを自動読み込み
3. 読み込み状況をコンソールに出力

## 検証方法

### スキーマ読み込み確認

アプリケーション起動時に、以下のようなログが表示されます：

```
Loaded XML schema: order (SMEOrder.xsd)
Loaded XML schema: invoice (SMEInvoice.xsd)
...
```

### スキーマ未読み込み時の警告

スキーマファイルが見つからない場合、以下の警告が表示されます：

```
XML schema file not found: /path/to/SMEOrder.xsd
XML schema validation will be limited. Please download schemas from:
  https://tsunagu-cons.jp/technicalinformation/smeedixml_sample/
```

## XMLバリデーションの動作

### 現在の実装

現在の実装では、以下の検証を行います：

1. **XML構造の検証**: XMLが正しくパースできるか確認
2. **名前空間の確認**: SME Common EDI標準の名前空間が含まれているか確認
3. **スキーマ存在確認**: 指定されたスキーマが読み込まれているか確認

### 今後の改善

本格的なXSD検証を実装する場合は、以下のライブラリの使用を検討してください：

- `libxmljs2` - Node.js用のXML/XSD検証ライブラリ
- `xsd-schema-validator` - XSDスキーマ検証ライブラリ

## トラブルシューティング

### スキーマファイルが見つからない

1. `src/schemas/xml/` ディレクトリが存在するか確認
2. ファイル名が正しいか確認（大文字小文字を区別）
3. ファイルのパーミッションを確認

### スキーマが読み込まれない

1. アプリケーションのログを確認
2. ファイルパスが正しいか確認
3. XMLスキーマファイルが破損していないか確認

## 参考資料

- [中小企業共通EDI標準仕様書（本文）ver.4.2](https://tsunagu-cons.jp/)
- [XML実装ガイドラインver.4.2](https://tsunagu-cons.jp/)
- [UN/CEFACT XML Naming and Design Rules](https://www.unece.org/cefact/)

