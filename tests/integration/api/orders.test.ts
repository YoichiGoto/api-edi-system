/**
 * Orders API 統合テスト
 */
import request from 'supertest';
import express from 'express';
import { db } from '../../../src/utils/database';
import ordersRouter from '../../../src/api/routes/orders';
import { applicationRepository } from '../../../src/repositories/ApplicationRepository';
import crypto from 'crypto';

// テスト用のExpressアプリを作成
const app = express();
app.use(express.json());
app.use('/api/v1/orders', ordersRouter);

// テスト用のAPIキーとアプリケーション
let testApiKey: string;
let testApplicationId: string;
let testUserId: string;

beforeAll(async () => {
  // データベース接続
  db.initialize();

  // テスト用ユーザーとアプリケーションを作成
  testUserId = 'test-user-id';
  const { application, apiKey } = await applicationRepository.create(
    testUserId,
    'Test Application',
    'Test application for integration tests'
  );
  testApiKey = apiKey;
  testApplicationId = application.id;
});

afterAll(async () => {
  // テスト用データのクリーンアップ
  if (testApplicationId) {
    await applicationRepository.deactivate(testApplicationId);
  }
  await db.close();
});

describe('Orders API', () => {
  describe('POST /api/v1/orders', () => {
    it('有効なリクエストで注文を作成できる', async () => {
      const orderData = {
        messageType: 'order',
        receiverId: 'receiver@provider',
        data: {
          orderNumber: 'TEST-ORD-001',
          orderDate: '2024-01-01',
          totalAmount: 10000,
        },
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('zag-api-key', testApiKey)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.messageType).toBe('order');
      expect(response.body.status).toBe('sent');
    });

    it('APIキーなしで401エラーを返す', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .send({ messageType: 'order', data: {} });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('無効なAPIキーで401エラーを返す', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('zag-api-key', 'invalid-api-key')
        .send({ messageType: 'order', data: {} });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('必須フィールドが欠けている場合に400エラーを返す', async () => {
      const response = await request(app)
        .post('/api/v1/orders')
        .set('zag-api-key', testApiKey)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    let createdOrderId: string;

    beforeAll(async () => {
      // テスト用の注文を作成
      const orderData = {
        messageType: 'order',
        receiverId: 'receiver@provider',
        data: {
          orderNumber: 'TEST-ORD-002',
          orderDate: '2024-01-01',
        },
      };

      const response = await request(app)
        .post('/api/v1/orders')
        .set('zag-api-key', testApiKey)
        .send(orderData);

      createdOrderId = response.body.id;
    });

    it('作成した注文を取得できる', async () => {
      const response = await request(app)
        .get(`/api/v1/orders/${createdOrderId}`)
        .set('zag-api-key', testApiKey);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdOrderId);
      expect(response.body.messageType).toBe('order');
    });

    it('存在しない注文IDで404エラーを返す', async () => {
      const response = await request(app)
        .get('/api/v1/orders/non-existent-id')
        .set('zag-api-key', testApiKey);

      expect(response.status).toBe(404);
    });

    it('他のアプリケーションの注文にアクセスできない', async () => {
      // 別のアプリケーションを作成
      const { application: otherApp, apiKey: otherApiKey } = await applicationRepository.create(
        'other-user-id',
        'Other App',
        'Other application'
      );

      const response = await request(app)
        .get(`/api/v1/orders/${createdOrderId}`)
        .set('zag-api-key', otherApiKey);

      expect(response.status).toBe(404); // または403

      // クリーンアップ
      await applicationRepository.deactivate(otherApp.id);
    });
  });
});

