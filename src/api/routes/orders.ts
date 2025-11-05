import { Router, Request, Response } from 'express';
import { MessageType, MessageStatus, MessageCreateInput } from '../../models/Message';
import { xmlConverter } from '../../services/xmlConverter';
import { jsonConverter } from '../../services/jsonConverter';
import { mapper } from '../../services/mapper';
import { xmlValidator } from '../../services/validator';
import { messageRouter } from '../../services/router';
import { messageRepository } from '../../repositories/MessageRepository';
import { validateRequestBody } from '../middleware/validation';
import { apiKeyAuth } from '../middleware/auth';
import { sendErrorResponse, logError } from '../../utils/errorHandler';

const router = Router();

/**
 * 注文送信（JSON受信）
 * POST /api/v1/orders
 */
router.post(
  '/',
  apiKeyAuth,
  validateRequestBody,
  async (req: Request, res: Response) => {
    try {
      const input: MessageCreateInput = {
        messageType: MessageType.ORDER,
        senderId: (req as any).applicationId || 'unknown',
        receiverId: req.body.receiverId || req.body.receiver_id,
        data: req.body.data || req.body,
      };

      if (!input.receiverId) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'receiverId is required',
        });
        return;
      }

      // JSONデータを正規化
      const normalizedData = jsonConverter.normalizeToEDIStandard(
        input.data,
        MessageType.ORDER
      );

      // マッピング適用（業務アプリ固有 → 共通EDI標準）
      const ediData = mapper.mapToEDIStandard(
        normalizedData,
        MessageType.ORDER
      );

      // JSONバリデーション（簡易版）
      // TODO: JSONスキーマによる詳細なバリデーション

      // XMLに変換
      const xmlData = xmlConverter.jsonToXML(ediData, MessageType.ORDER);

      // XMLバリデーション
      const xmlValidation = xmlValidator.validateXML(xmlData, 'SMEOrder');
      if (!xmlValidation.valid) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'XML validation failed',
          errors: xmlValidation.errors,
        });
        return;
      }

      // メッセージをデータベースに保存
      const message = await messageRepository.create(input, xmlData);

      // 送信先振り分けと送信処理
      const routeResult = await messageRouter.routeMessage(message);
      
      if (routeResult.success) {
        // 送信成功時はステータスをSENTに更新
        await messageRepository.updateStatus(message.id, MessageStatus.SENT);
      } else {
        // 送信失敗時はエラーステータスに更新
        await messageRepository.updateStatus(
          message.id,
          MessageStatus.ERROR,
          routeResult.error
        );
      }

      res.status(201).json({
        id: message.id,
        messageType: message.messageType,
        status: message.status,
        createdAt: message.createdAt,
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      logError(error, { endpoint: '/api/v1/orders', method: 'POST' });
      sendErrorResponse(res, error);
    }
  }
);

/**
 * 注文取得
 * GET /api/v1/orders/:id
 */
router.get('/:id', apiKeyAuth, async (req: Request, res: Response) => {
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

    res.json(message);
  } catch (error: any) {
    console.error('Error getting order:', error);
    logError(error, { endpoint: '/api/v1/orders/:id', method: 'GET', id: req.params.id });
    sendErrorResponse(res, error);
  }
});

/**
 * 注文一覧取得
 * GET /api/v1/orders
 */
router.get('/', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const senderId = (req as any).applicationId;

    const result = await messageRepository.findBySender(senderId, limit, offset);

    res.json({
      messages: result.messages,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('Error listing orders:', error);
    logError(error, { endpoint: '/api/v1/orders', method: 'GET' });
    sendErrorResponse(res, error);
  }
});

export default router;

