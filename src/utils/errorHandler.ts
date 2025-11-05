/**
 * エラーハンドリングユーティリティ
 */
import { Response } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * エラークラス
 */
export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * 認可エラー
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * リソース未検出エラー
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * エラーレスポンスを送信
 */
export function sendErrorResponse(res: Response, error: ApiError | Error): void {
  if (error instanceof AppError) {
    res.status(error.statusCode || 500).json({
      error: error.code || 'INTERNAL_ERROR',
      message: error.message,
      details: error.details,
    });
  } else {
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    });
  }
}

/**
 * エラーログを記録
 */
export function logError(error: Error | ApiError, context?: any): void {
  // Winstonロガーを使用（利用可能な場合）
  try {
    const logger = require('./logger').default;
    if (logger) {
      const errorInfo: any = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };

      if (error instanceof AppError) {
        errorInfo.statusCode = error.statusCode;
        errorInfo.code = error.code;
        errorInfo.details = error.details;
      }

      if (context) {
        errorInfo.context = context;
      }

      logger.error('Error occurred', errorInfo);
      return;
    }
  } catch (e) {
    // ロガーが利用できない場合は従来の方法を使用
  }

  // フォールバック: 従来のconsole.error
  const errorInfo: any = {
    message: error.message,
    name: error.name,
    stack: error.stack,
  };

  if (error instanceof AppError) {
    errorInfo.statusCode = error.statusCode;
    errorInfo.code = error.code;
    errorInfo.details = error.details;
  }

  if (context) {
    errorInfo.context = context;
  }

  console.error('Error occurred:', JSON.stringify(errorInfo, null, 2));
}

