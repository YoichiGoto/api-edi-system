import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { applicationRepository } from '../../repositories/ApplicationRepository';

/**
 * API Key認証ミドルウェア
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = process.env.API_KEY_HEADER || 'zag-api-key';
  const apiKey = req.headers[apiKeyHeader.toLowerCase()] as string;

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required',
    });
    return;
  }

  try {
    // データベースからAPIキーを検証
    const application = await applicationRepository.findByApiKey(apiKey);

    if (!application) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
      });
      return;
    }

    if (!application.isActive) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Application is inactive',
      });
      return;
    }

    // リクエストにアプリケーション情報を追加
    (req as any).apiKey = apiKey;
    (req as any).applicationId = application.id;
    (req as any).userId = application.userId;
    (req as any).application = application;

    next();
  } catch (error: any) {
    console.error('Error in API key authentication:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * JWT認証ミドルウェア
 */
export function jwtAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'JWT token is required',
    });
    return;
  }

  const token = authHeader.substring(7);
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'JWT secret is not configured',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;
    (req as any).userId = decoded.userId;
    (req as any).userRole = decoded.role;
    next();
  } catch (error: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * オプショナル認証（API KeyまたはJWT）
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const apiKeyHeader = process.env.API_KEY_HEADER || 'zag-api-key';
  const apiKey = req.headers[apiKeyHeader.toLowerCase()] as string;
  const authHeader = req.headers.authorization;

  if (apiKey) {
    // API Key認証を試行
    try {
      const application = await applicationRepository.findByApiKey(apiKey);
      if (application && application.isActive) {
        (req as any).apiKey = apiKey;
        (req as any).applicationId = application.id;
        (req as any).userId = application.userId;
        next();
        return;
      }
    } catch (error) {
      // 認証失敗は無視
    }
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // JWT認証を試行
    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (jwtSecret) {
      try {
        const decoded = jwt.verify(token, jwtSecret) as any;
        (req as any).userId = decoded.userId;
        (req as any).userRole = decoded.role;
        next();
        return;
      } catch {
        // JWT認証失敗は無視
      }
    }
  }

  // 認証情報がない場合は匿名として処理
  next();
}
