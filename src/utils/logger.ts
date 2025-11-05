/**
 * Winstonロガー設定
 */
import winston from 'winston';
import path from 'path';
import fs from 'fs';

// ログディレクトリの作成
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ログレベル設定
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// カスタムフォーマット
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// コンソール用フォーマット（開発環境向け）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// ロガー設定
const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { service: 'api-edi-system' },
  transports: [
    // エラーログファイル
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // すべてのログファイル
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // アクセスログファイル
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 開発環境ではコンソールにも出力
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// プロダクション環境でもコンソール出力が必要な場合
if (process.env.ENABLE_CONSOLE_LOG === 'true') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

/**
 * ロガー拡張機能
 */
export const loggerExtensions = {
  /**
   * パフォーマンス計測
   */
  measurePerformance: (label: string) => {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      logger.debug(`Performance: ${label} took ${duration}ms`);
      return duration;
    };
  },

  /**
   * APIリクエストログ
   */
  logRequest: (req: any) => {
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      applicationId: req.applicationId,
    });
  },

  /**
   * APIレスポンスログ
   */
  logResponse: (req: any, res: any, duration: number) => {
    logger.info('API Response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      applicationId: req.applicationId,
    });
  },

  /**
   * データベースクエリログ
   */
  logQuery: (query: string, params?: any[], duration?: number) => {
    logger.debug('Database Query', {
      query,
      params,
      duration: duration ? `${duration}ms` : undefined,
    });
  },
};

export default logger;

