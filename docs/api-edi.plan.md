<!-- 8130717a-a172-47f7-981f-55b794f20fcb fff29bae-398c-482f-93b8-5176f9a3d244 -->
# APIベースEDIシステム実装プラン

## システム概要

中小企業共通EDI標準（ver.4.2）に準拠した共通EDIプロバイダとして機能するAPIベースのEDIシステムを構築する。OrderfulのようなREST APIを通じて、JSONとXML（UN/CEFACT標準）間の変換、バリデーション、マッピング機能を提供する。

## アーキテクチャ

### 1. システム構成

- **API Gateway**: REST APIエンドポイント（JSON受信）
- **変換エンジン**: JSON ↔ XML変換、XMLスキーマバリデーション
- **マッピングエンジン**: 業務アプリ固有フォーマット ↔ 共通EDI標準フォーマット変換
- **メッセージルーター**: 送信先振り分け、共通EDIプロバイダ間連携
- **データベース**: メッセージ履歴、マッピング設定、ユーザー情報

### 2. 技術スタック（デフォルト）

- **バックエンド**: Node.js + TypeScript + Express
- **データベース**: PostgreSQL（メッセージ履歴、設定管理）
- **XML処理**: xml2js / fast-xml-parser
- **バリデーション**: ajv（JSON）、libxmljs（XMLスキーマ）
- **認証**: JWT + API Key
- **AI処理**: Google Gemini API（テーブル検出のフォールバック用）

## 実装フェーズ

### フェーズ0: Excel前処理の改善（2-3週間）

#### 0.1 複数テーブル検出機能の実装

- **問題**: 1つのExcelシート内に複数のテーブルが存在する場合、現在の実装では適切に処理できない
- **解決策**: ハイブリッドアプローチ（ルールベース + AIフォールバック）

**実装内容**:
1. **ルールベース検出（優先）**
   - データ密度マトリックスの分析（空行・空列の検出）
   - 複数ヘッダー行の自動検出
   - テーブル範囲の推定（開始行・終了行・開始列・終了列）
   - 信頼度スコアリング（0.0-1.0）

2. **AIフォールバック（最小限）**
   - 信頼度が0.6未満の場合のみGemini APIを使用
   - 低信頼度領域のみを部分的に確認
   - APIコストを最小限に抑制

**新規ファイル**:
- `scripts/preprocess/table-detector.ts`: ルールベースのテーブル検出ロジック
- `scripts/preprocess/ai-table-detector.ts`: Gemini APIフォールバック処理

**修正ファイル**:
- `scripts/preprocess/mapping-converter.ts`: 複数テーブル対応版に更新
- `scripts/preprocess/code-def-converter.ts`: 複数テーブル対応版に更新
- `scripts/preprocess/excel-to-json.ts`: 新しい検出機能を統合

**環境変数**:
- `GEMINI_API_KEY`: Gemini APIキー（オプション - AIフォールバック用）

#### 0.2 テーブル検出機能の詳細仕様

**検出対象テーブルタイプ**:
- 相互連携性情報項目表（information-items）
- 国連CEFACTメッセージ辞書・BIE表（cefact-bie）
- データ型補足情報（data-type-supplement）
- マッピング表（mapping）
- コード定義表（code-definition）

**信頼度スコアリング基準**:
- ヘッダー行のキーワードマッチ: 0.0-0.7
- テーブルサイズ（行数・列数）: +0.2（5行3列以上）
- テーブルタイプの特定: +0.1
- AIフォールバック閾値: 0.6未満

### フェーズ1: 基盤構築（4-6週間）

#### 1.1 プロジェクトセットアップ

- Node.js + TypeScriptプロジェクト初期化
- Express.jsアプリケーション構造
- データベーススキーマ設計
- 環境変数設定

#### 1.2 XMLスキーマの取得と統合

- 中小企業共通EDI標準のXMLスキーマを取得
  - 入手先: https://tsunagu-cons.jp/technicalinformation/smeedixml_sample/
  - 初期実装: SMEOrder.xsd（注文メッセージ）
- XMLスキーマをプロジェクトに配置
- XMLスキーマバリデーション機能の実装

#### 1.3 JSONスキーマの生成

- XMLスキーマからJSONスキーマを自動生成するツール作成
- または手動でJSONスキーマ定義を作成
- JSONバリデーション機能の実装

### フェーズ2: コア機能実装（6-8週間）

#### 2.1 APIエンドポイント設計・実装

```
POST /api/v1/orders              # 注文送信（JSON受信）
GET  /api/v1/orders/:id         # 注文取得
POST /api/v1/invoices            # 請求送信（JSON受信）
GET  /api/v1/invoices/:id        # 請求取得
GET  /api/v1/messages            # メッセージ一覧
GET  /api/v1/messages/:id/status # 送達状況確認
```

#### 2.2 JSON ↔ XML変換エンジン

- JSON to XML変換機能
  - JSONデータをXMLスキーマに準拠したXML形式に変換
  - 名前空間の適切な付与
  - データ属性の変換（文字コードUTF-8、日付形式ISO8601）
- XML to JSON変換機能
  - 受信XMLをJSON形式に変換
  - バリデーション後の変換

#### 2.3 バリデーション機能

- XMLスキーマバリデーション
  - 受信XMLがXMLスキーマに準拠しているかチェック
  - エラーメッセージの詳細な返却
- JSONバリデーション
  - JSONスキーマによるバリデーション
  - 必須項目チェック

#### 2.4 データベース設計・実装

- メッセージテーブル（message_history）
  - id, message_type, sender_id, receiver_id, status, created_at
- マッピング設定テーブル（mapping_configs）
  - id, app_id, field_mappings, format_type
- ユーザー/アプリケーション管理テーブル
  - users, applications, api_keys

### フェーズ3: マッピング機能（4-6週間）

#### 3.1 マッピングエンジン実装

- 業務アプリ固有フォーマット → 共通EDI標準フォーマット変換
  - フィールドマッピング設定の管理
  - 動的マッピングルールの適用
- 共通EDI標準フォーマット → 業務アプリ固有フォーマット変換
  - 受信側のフォーマットに合わせた変換

#### 3.2 マッピング設定UI/API

- マッピング設定の作成・更新API
- マッピング設定のテスト機能

### フェーズ4: 共通EDIプロバイダ機能（4-6週間）

#### 4.1 送信先振り分け機能

- 受信者IDに基づく送信先の特定
- 共通EDIプロバイダ間連携のためのルーティング
- ESP間連携プロトコルの実装（または合意プロトコル）

#### 4.2 送達確認機能

- 送達確認情報の生成・送信
- 送達エラー情報の処理
- ステータス管理（送信済み、受信済み、エラー）

#### 4.3 共通EDIプロバイダ間連携

- 他の共通EDIプロバイダとのEDIデータ交換
- ESP間連携プロトコルの実装
- 送信先認証機能

### フェーズ5: 認証・認可・セキュリティ（2-3週間）

#### 5.1 認証機能

- API Key認証
- JWT認証
- ユーザー管理機能

#### 5.2 認可機能

- ロールベースアクセス制御
- リソース単位のアクセス制御

#### 5.3 セキュリティ

- HTTPS必須
- 入力値サニタイゼーション
- レート制限

### フェーズ6: 追加機能（オプション）

#### 6.1 他のメッセージタイプ対応

- 見積依頼/回答
- 出荷案内/回答
- 仕入明細/回答
- 支払通知
- 需要予測/納入指示（カンバン取引）

#### 6.2 CSV連携機能

- CSVフォーマット対応
- 連携共通I/Fの実装

#### 6.3 監視・ログ機能

- メッセージ送受信ログ
- エラーログ
- パフォーマンス監視

## 主要ファイル構成（予定）

```
project/
├── scripts/
│   ├── preprocess/
│   │   ├── excel-to-json.ts      # Excel→JSON変換スクリプト
│   │   ├── mapping-converter.ts  # 付表３変換スクリプト（複数テーブル対応）
│   │   ├── code-def-converter.ts # 付表４変換スクリプト（複数テーブル対応）
│   │   ├── table-detector.ts     # ルールベースのテーブル検出
│   │   ├── ai-table-detector.ts  # Gemini APIフォールバック
│   │   └── info-item-converter.ts # 付表１変換スクリプト（オプション）
│   └── validate-json.ts          # JSON検証スクリプト
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── orders.ts
│   │   │   ├── invoices.ts
│   │   │   └── messages.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       └── validation.ts
│   ├── services/
│   │   ├── xmlConverter.ts      # XML変換サービス
│   │   ├── jsonConverter.ts     # JSON変換サービス
│   │   ├── validator.ts          # バリデーションサービス
│   │   ├── mapper.ts             # マッピングサービス（付表３データを使用）
│   │   ├── codeConverter.ts      # コード変換サービス（付表４データを使用）
│   │   └── router.ts             # メッセージルーター
│   ├── data/
│   │   ├── mappings/             # 付表３のJSONデータ
│   │   │   ├── order-mapping.json
│   │   │   └── invoice-mapping.json
│   │   ├── code-definitions/     # 付表４のJSONデータ
│   │   │   ├── quantity-unit-codes.json
│   │   │   ├── tax-classification-codes.json
│   │   │   └── ...
│   │   └── information-items/     # 付表１のJSONデータ（オプション）
│   │       └── information-items.json
│   ├── models/
│   │   ├── Message.ts
│   │   ├── MappingConfig.ts
│   │   ├── CodeDefinition.ts
│   │   └── User.ts
│   ├── schemas/
│   │   ├── xml/                  # XMLスキーマファイル
│   │   │   ├── SMEOrder.xsd
│   │   │   └── SMEInvoice.xsd
│   │   └── json/                 # JSONスキーマファイル
│   │       ├── order.schema.json
│   │       └── invoice.schema.json
│   └── utils/
│       ├── xmlParser.ts
│       ├── dateFormatter.ts
│       └── dataLoader.ts         # JSONデータ読み込みユーティリティ
├── data/
│   └── excel/                    # 元のExcelファイル（参照用）
│       ├── 付表１.xlsx
│       ├── 付表２.xlsx
│       ├── 付表３.xlsx
│       └── 付表４.xlsx
├── tests/
│   ├── unit/
│   ├── integration/
│   └── preprocess/               # 前処理スクリプトのテスト
└── docs/
    ├── api.md
    ├── api-edi.plan.md           # このファイル
    └── preprocess.md             # 前処理手順のドキュメント
```

## 実装上の重要な考慮事項

### 1. XMLスキーマ準拠

- UN/CEFACT標準に準拠したXMLフォーマット
- 名前空間の正確な設定
- 必須情報項目の実装

### 2. データ属性変換

- 文字コード: UTF-8必須
- 日付形式: ISO8601（YYYY-MM-DD, YYYY-MM-DDThh:mm:ss）
- 数量単位コード: UNECE Rec20標準

### 3. マッピング機能

- 業務アプリ固有情報項目 → 共通EDI情報項目へのマッピング
- マッピング表（付表３）の活用
- デフォルト値の補完機能

### 4. Excel前処理の改善

- 1シート内の複数テーブルを個別に検出・処理
- ルールベース検出を優先し、AIは最小限に使用
- 信頼度スコアリングによる品質管理

### 5. エラーハンドリング

- バリデーションエラーの詳細な返却
- 変換エラーの処理
- 送達エラー情報の生成
- テーブル検出失敗時の適切なフォールバック

## 参考資料

- 中小企業共通EDI標準仕様書 ver.4.2
- XML実装ガイドライン
- XMLスキーマ: https://tsunagu-cons.jp/technicalinformation/smeedixml_sample/
- ESP間連携プロトコル: https://tsunagu-cons.jp/about-edi/
- Google Gemini API: https://ai.google.dev/docs

## 次のステップ

1. フェーズ0: Excel前処理の改善実装
2. ユーザーからの技術スタック・実装範囲の確認
3. プロジェクトセットアップ
4. XMLスキーマの取得と統合
5. フェーズ1の実装開始

### To-dos

- [x] プロジェクト初期化：Node.js + TypeScript + Express、データベーススキーマ設計、環境設定
- [x] XMLスキーマの取得と統合：SMEOrder.xsd等のXMLスキーマを取得しプロジェクトに配置
- [x] XMLスキーマバリデーション機能の実装
- [x] JSONスキーマの生成：XMLスキーマからJSONスキーマを生成または手動作成
- [x] REST APIエンドポイントの実装：POST /api/v1/orders, GET /api/v1/orders/:id など
- [x] JSON ↔ XML変換エンジンの実装：JSON to XML、XML to JSON変換機能
- [x] バリデーション機能の実装：XMLスキーマバリデーション、JSONバリデーション
- [x] データベースの実装：メッセージ履歴、マッピング設定、ユーザー管理テーブル
- [x] マッピングエンジンの実装：業務アプリ固有フォーマット ↔ 共通EDI標準フォーマット変換
- [x] 送信先振り分け機能の実装：受信者IDに基づくルーティング、共通EDIプロバイダ間連携
- [x] 送達確認機能の実装：送達確認情報の生成・送信、ステータス管理
- [x] 認証・認可機能の実装：API Key認証、JWT認証、ユーザー管理
- [ ] フェーズ0: 複数テーブル検出機能の実装（ルールベース + Gemini API）
  - [ ] table-detector.tsの作成
  - [ ] ai-table-detector.tsの作成
  - [ ] mapping-converter.tsの修正
  - [ ] code-def-converter.tsの修正
  - [ ] 環境変数設定（GEMINI_API_KEY）

