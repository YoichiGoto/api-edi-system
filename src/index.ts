import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { dataLoader } from './utils/dataLoader';
import { db } from './utils/database';
import logger, { loggerExtensions } from './utils/logger';
import ordersRouter from './api/routes/orders';
import invoicesRouter from './api/routes/invoices';
import messagesRouter from './api/routes/messages';
import informationItemsRouter from './api/routes/information-items';
import applicationsRouter from './api/routes/applications';
import mappingConfigsRouter from './api/routes/mapping-configs';

// 環境変数を読み込む
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// リクエストログミドルウェア
app.use((req, res, next) => {
  const start = Date.now();
  loggerExtensions.logRequest(req);

  // レスポンス完了時にログを記録
  res.on('finish', () => {
    const duration = Date.now() - start;
    loggerExtensions.logResponse(req, res, duration);
  });

  next();
});

// データローダーを初期化
dataLoader.loadAll();

// データベース初期化
db.initialize();
logger.info('Database connection initialized');

// ヘルスチェックエンドポイント
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API情報エンドポイント
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    name: 'SME Common EDI API System',
    version: '1.0.0',
    description: 'API-based EDI system compliant with SME Common EDI Standard ver.4.2',
    endpoints: {
      health: '/health',
      orders: '/api/v1/orders',
      invoices: '/api/v1/invoices',
      messages: '/api/v1/messages',
      informationItems: '/api/v1/information-items',
      applications: '/api/v1/applications',
      mappingConfigs: '/api/v1/mapping-configs',
    },
  });
});

// APIルート
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/invoices', invoicesRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/information-items', informationItemsRouter);
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v1/mapping-configs', mappingConfigsRouter);

// エラーハンドリング
app.use((err: Error, _req: Request, res: Response, _next: Function) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// 404ハンドラー
app.use((req: Request, res: Response) => { // reqは使用する
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// サーバー起動
app.listen(PORT, () => {
  logger.info('Server is running', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    apiUrl: `http://localhost:${PORT}/api/v1`,
  });
});

export default app;
