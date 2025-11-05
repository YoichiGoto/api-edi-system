# API ドキュメント

## 認証

すべてのAPIエンドポイントは認証が必要です。

### API Key認証

リクエストヘッダーにAPI Keyを設定：

```
zag-api-key: your-api-key
```

### JWT認証

リクエストヘッダーにJWTトークンを設定：

```
Authorization: Bearer your-jwt-token
```

## エンドポイント

### ヘルスチェック

#### GET /health

サーバー状態を確認

**レスポンス:**
```json
{
  "status": "ok",
  "timestamp": "2023-10-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

### 注文送信

#### POST /api/v1/orders

注文メッセージを送信（JSON形式）

**リクエストボディ:**
```json
{
  "messageType": "order",
  "receiverId": "receiver@provider",
  "data": {
    "orderNumber": "ORD-2023-001",
    "orderDate": "2023-10-01",
    "buyer": {
      "name": "株式会社ABC",
      "id": "BUYER001",
      "address": "東京都..."
    },
    "seller": {
      "name": "株式会社XYZ",
      "id": "SELLER001",
      "address": "大阪府..."
    },
    "items": [
      {
        "productName": "商品A",
        "productId": "PROD001",
        "quantity": 10,
        "unit": "個",
        "unitPrice": 1000,
        "amount": 10000
      }
    ]
  }
}
```

**レスポンス:**
```json
{
  "id": "uuid",
  "messageType": "order",
  "status": "pending",
  "createdAt": "2023-10-01T12:00:00.000Z"
}
```

### 注文取得

#### GET /api/v1/orders/:id

注文メッセージを取得

**レスポンス:**
```json
{
  "id": "uuid",
  "messageType": "order",
  "senderId": "sender@provider",
  "receiverId": "receiver@provider",
  "status": "delivered",
  "data": { ... },
  "createdAt": "2023-10-01T12:00:00.000Z",
  "updatedAt": "2023-10-01T12:00:00.000Z"
}
```

### 請求送信

#### POST /api/v1/invoices

請求メッセージを送信（JSON形式）

**リクエストボディ:**
```json
{
  "messageType": "invoice",
  "invoiceType": "single",
  "receiverId": "receiver@provider",
  "data": {
    "invoiceNumber": "INV-2023-001",
    "invoiceDate": "2023-10-01",
    "seller": {
      "name": "株式会社XYZ",
      "registrationNumber": "T1234567890123",
      "address": "大阪府..."
    },
    "buyer": {
      "name": "株式会社ABC",
      "address": "東京都..."
    },
    "items": [
      {
        "productName": "商品A",
        "quantity": 10,
        "unit": "個",
        "unitPrice": 1000,
        "taxRate": 0.1,
        "taxAmount": 1000,
        "amount": 11000
      }
    ],
    "totalAmount": 10000,
    "totalTaxAmount": 1000,
    "totalAmountWithTax": 11000
  }
}
```

### メッセージ一覧

#### GET /api/v1/messages

メッセージ一覧を取得

**クエリパラメータ:**
- `limit` (optional): 取得件数（デフォルト: 50）
- `offset` (optional): オフセット（デフォルト: 0）
- `messageType` (optional): メッセージタイプでフィルタ
- `status` (optional): ステータスでフィルタ

**レスポンス:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "messageType": "order",
      "status": "delivered",
      "createdAt": "2023-10-01T12:00:00.000Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### 送達状況確認

#### GET /api/v1/messages/:id/status

メッセージの送達状況を確認

**レスポンス:**
```json
{
  "id": "uuid",
  "status": "delivered",
  "createdAt": "2023-10-01T12:00:00.000Z",
  "updatedAt": "2023-10-01T12:00:00.000Z",
  "deliveredAt": "2023-10-01T12:05:00.000Z"
}
```

## エラーレスポンス

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": ["Field 'receiverId' is required"]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "API key is required"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Message not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Error message"
}
```

