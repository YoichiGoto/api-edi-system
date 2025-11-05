import { Router, Request, Response } from 'express';
import { MessageType, MessageStatus, MessageCreateInput } from '../../models/Message';
import { xmlConverter } from '../../services/xmlConverter';
import { jsonConverter } from '../../services/jsonConverter';
import { mapper } from '../../services/mapper';
import { xmlValidator } from '../../services/validator';
import { messageRouter } from '../../services/router';
import { messageRepository } from '../../repositories/MessageRepository';
import { validateMessageType, validateRequestBody } from '../middleware/validation';
import { apiKeyAuth } from '../middleware/auth';
import { sendErrorResponse, logError } from '../../utils/errorHandler';

const router = Router();

/**
 * 請求送信（JSON受信）
 * POST /api/v1/invoices
 */
router.post(
  '/',
  apiKeyAuth,
  validateRequestBody,
  validateMessageType,
  async (req: Request, res: Response) => {
    try {
      const messageType = req.body.invoiceType === 'consolidated' 
        ? MessageType.CONSOLIDATED_INVOICE 
        : MessageType.INVOICE;

      const input: MessageCreateInput = {
        messageType,
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
        messageType
      );

      // マッピング適用
      const ediData = mapper.mapToEDIStandard(
        normalizedData,
        messageType
      );

      // XMLに変換
      const xmlData = xmlConverter.jsonToXML(ediData, messageType);

      // XMLバリデーション
      const xmlValidation = xmlValidator.validateXML(
        xmlData,
        messageType === MessageType.CONSOLIDATED_INVOICE ? 'SMEConsolidatedInvoice' : 'SMEInvoice'
      );
      
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
        await messageRepository.updateStatus(message.id, MessageStatus.SENT);
      } else {
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
      console.error('Error creating invoice:', error);
      logError(error, { endpoint: '/api/v1/invoices', method: 'POST' });
      sendErrorResponse(res, error);
    }
  }
);

/**
 * 請求取得
 * GET /api/v1/invoices/:id
 */
router.get('/:id', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id;
    const applicationId = (req as any).applicationId;

    const message = await messageRepository.findById(messageId);

    if (!message) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Invoice not found',
      });
      return;
    }

    // 送信者のみアクセス可能
    if (message.senderId !== applicationId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this invoice',
      });
      return;
    }

    res.json(message);
  } catch (error: any) {
    console.error('Error getting invoice:', error);
    logError(error, { endpoint: '/api/v1/invoices/:id', method: 'GET', id: req.params.id });
    sendErrorResponse(res, error);
  }
});

export default router;

