import { Router, Request, Response } from 'express';
import { MessageStatus, MessageType } from '../../models/Message';
import { messageRepository } from '../../repositories/MessageRepository';
import { apiKeyAuth } from '../middleware/auth';
import { sendErrorResponse, logError } from '../../utils/errorHandler';

const router = Router();

/**
 * メッセージ一覧取得
 * GET /api/v1/messages
 */
router.get('/', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const messageType = req.query.messageType as MessageType | undefined;
    const status = req.query.status as MessageStatus | undefined;
    const senderId = (req as any).applicationId;

    const result = await messageRepository.find({
      senderId,
      messageType,
      status,
      limit,
      offset,
    });

    res.json({
      messages: result.messages,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error listing messages:', error);
    logError(error, { endpoint: '/api/v1/messages', method: 'GET' });
    sendErrorResponse(res, error);
  }
});

/**
 * メッセージ送達状況確認
 * GET /api/v1/messages/:id/status
 */
router.get('/:id/status', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id;
    const applicationId = (req as any).applicationId;

    const message = await messageRepository.findById(messageId);

    if (!message) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Message not found',
      });
      return;
    }

    // 送信者のみアクセス可能
    if (message.senderId !== applicationId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this message',
      });
      return;
    }

    res.json({
      id: message.id,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      deliveredAt: message.deliveredAt,
      errorMessage: message.errorMessage,
    });
  } catch (error: any) {
    console.error('Error getting message status:', error);
    logError(error, { endpoint: '/api/v1/messages/:id/status', method: 'GET', id: req.params.id });
    sendErrorResponse(res, error);
  }
});

/**
 * メッセージ取得
 * GET /api/v1/messages/:id
 */
router.get('/:id', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id;
    const format = req.query.format as string || 'json';
    const applicationId = (req as any).applicationId;

    const message = await messageRepository.findById(messageId);

    if (!message) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Message not found',
      });
      return;
    }

    // 送信者または受信者のみアクセス可能
    if (message.senderId !== applicationId && message.receiverId !== applicationId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this message',
      });
      return;
    }

    // フォーマットに応じて返すデータを変更
    if (format === 'xml' && message.xmlData) {
      res.setHeader('Content-Type', 'application/xml');
      res.send(message.xmlData);
    } else {
      res.json(message);
    }
  } catch (error: any) {
    console.error('Error getting message:', error);
    logError(error, { endpoint: '/api/v1/messages/:id', method: 'GET', id: req.params.id, format: req.query.format });
    sendErrorResponse(res, error);
  }
});

export default router;

