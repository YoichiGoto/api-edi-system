import { Request, Response, NextFunction } from 'express';
import { jsonValidator } from '../../services/validator';
import { MessageType } from '../../models/Message';

/**
 * JSONバリデーションミドルウェア
 */
export function validateJSON(schemaName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validation = jsonValidator.validateJSON(req.body, schemaName);

    if (!validation.valid) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Request body validation failed',
        errors: validation.errors,
      });
      return;
    }

    next();
  };
}

/**
 * メッセージタイプバリデーションミドルウェア
 */
export function validateMessageType(req: Request, res: Response, next: NextFunction): void {
  const messageType = req.body.messageType || req.params.messageType;

  if (!messageType) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'messageType is required',
    });
    return;
  }

  // MessageType enumに存在するかチェック
  if (!Object.values(MessageType).includes(messageType as MessageType)) {
    res.status(400).json({
      error: 'Bad Request',
      message: `Invalid messageType: ${messageType}`,
      validTypes: Object.values(MessageType),
    });
    return;
  }

  next();
}

/**
 * リクエストボディの基本チェック
 */
export function validateRequestBody(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Request body is required and must be a JSON object',
    });
    return;
  }

  next();
}

