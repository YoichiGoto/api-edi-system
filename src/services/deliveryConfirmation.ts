import { Message, MessageStatus } from '../models/Message';

/**
 * 送達確認サービス
 */
class DeliveryConfirmationService {
  /**
   * 送達確認情報を生成
   */
  generateDeliveryConfirmation(message: Message): {
    messageId: string;
    status: MessageStatus;
    deliveredAt: Date;
    timestamp: Date;
  } {
    return {
      messageId: message.id,
      status: MessageStatus.DELIVERED,
      deliveredAt: new Date(),
      timestamp: new Date(),
    };
  }

  /**
   * 送達エラー情報を生成
   */
  generateDeliveryError(message: Message, error: string): {
    messageId: string;
    status: MessageStatus;
    error: string;
    timestamp: Date;
  } {
    return {
      messageId: message.id,
      status: MessageStatus.ERROR,
      error,
      timestamp: new Date(),
    };
  }

  /**
   * メッセージステータスを更新
   */
  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    errorMessage?: string
  ): Promise<void> {
    // データベースでステータスを更新
    const { messageRepository } = await import('../repositories/MessageRepository');
    await messageRepository.updateStatus(
      messageId,
      status,
      errorMessage,
      status === MessageStatus.DELIVERED ? new Date() : undefined
    );
  }

  /**
   * 送達確認情報を送信者に通知
   */
  async notifySender(
    senderId: string,
    confirmation: {
      messageId: string;
      status: MessageStatus;
      deliveredAt?: Date;
      error?: string;
      timestamp: Date;
    }
  ): Promise<void> {
    // TODO: 送信者に通知（メール、APIコールバック、UI更新など）
    console.log(`Notifying sender ${senderId} about message ${confirmation.messageId}`);
  }
}

// シングルトンインスタンス
export const deliveryConfirmation = new DeliveryConfirmationService();

