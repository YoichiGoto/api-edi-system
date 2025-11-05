import { db } from '../utils/database';
import { Message, MessageType, MessageStatus, MessageCreateInput } from '../models/Message';
import { v4 as uuidv4 } from 'uuid';

/**
 * メッセージリポジトリ
 */
class MessageRepository {
  /**
   * メッセージを作成
   */
  async create(input: MessageCreateInput, xmlData?: string): Promise<Message> {
    const message: Message = {
      id: uuidv4(),
      messageType: input.messageType,
      senderId: input.senderId,
      receiverId: input.receiverId,
      status: MessageStatus.PENDING,
      data: input.data,
      xmlData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const query = `
      INSERT INTO messages (id, message_type, sender_id, receiver_id, status, data, xml_data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      message.id,
      message.messageType,
      message.senderId,
      message.receiverId,
      message.status,
      JSON.stringify(message.data),
      message.xmlData || null,
      message.createdAt,
      message.updatedAt,
    ];

    try {
      const result = await db.query(query, values);
      return this.mapRowToMessage(result.rows[0]);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * メッセージを取得
   */
  async findById(id: string): Promise<Message | null> {
    const query = 'SELECT * FROM messages WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToMessage(result.rows[0]);
  }

  /**
   * 送信者IDでメッセージ一覧を取得
   */
  async findBySender(
    senderId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: Message[]; total: number }> {
    const countQuery = 'SELECT COUNT(*) FROM messages WHERE sender_id = $1';
    const countResult = await db.query(countQuery, [senderId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const query = `
      SELECT * FROM messages
      WHERE sender_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [senderId, limit, offset]);

    const messages = result.rows.map((row: any) => this.mapRowToMessage(row));

    return { messages, total };
  }

  /**
   * 受信者IDでメッセージ一覧を取得
   */
  async findByReceiver(
    receiverId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ messages: Message[]; total: number }> {
    const countQuery = 'SELECT COUNT(*) FROM messages WHERE receiver_id = $1';
    const countResult = await db.query(countQuery, [receiverId]);
    const total = parseInt(countResult.rows[0].count, 10);

    const query = `
      SELECT * FROM messages
      WHERE receiver_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await db.query(query, [receiverId, limit, offset]);

    const messages = result.rows.map((row: any) => this.mapRowToMessage(row));

    return { messages, total };
  }

  /**
   * メッセージを検索
   */
  async find(params: {
    senderId?: string;
    receiverId?: string;
    messageType?: MessageType;
    status?: MessageStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ messages: Message[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.senderId) {
      conditions.push(`sender_id = $${paramIndex++}`);
      values.push(params.senderId);
    }
    if (params.receiverId) {
      conditions.push(`receiver_id = $${paramIndex++}`);
      values.push(params.receiverId);
    }
    if (params.messageType) {
      conditions.push(`message_type = $${paramIndex++}`);
      values.push(params.messageType);
    }
    if (params.status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(params.status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 総数を取得
    const countQuery = `SELECT COUNT(*) FROM messages ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // データを取得
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    values.push(limit, offset);

    const query = `
      SELECT * FROM messages
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const result = await db.query(query, values);

    const messages = result.rows.map((row: any) => this.mapRowToMessage(row));

    return { messages, total };
  }

  /**
   * メッセージステータスを更新
   */
  async updateStatus(
    id: string,
    status: MessageStatus,
    errorMessage?: string,
    deliveredAt?: Date
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    updates.push(`status = $${paramIndex++}`);
    values.push(status);

    if (errorMessage) {
      updates.push(`error_message = $${paramIndex++}`);
      values.push(errorMessage);
    }

    if (deliveredAt) {
      updates.push(`delivered_at = $${paramIndex++}`);
      values.push(deliveredAt);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE messages
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await db.query(query, values);
  }

  /**
   * データベース行をMessageオブジェクトにマッピング
   */
  private mapRowToMessage(row: {
    id: string;
    message_type: string;
    sender_id: string;
    receiver_id?: string;
    status: string;
    data: string | any;
    xml_data?: string;
    error_message?: string;
    created_at: Date;
    updated_at: Date;
    delivered_at?: Date;
  }): Message {
    return {
      id: row.id,
      messageType: row.message_type as MessageType,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      status: row.status as MessageStatus,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
      xmlData: row.xml_data,
      errorMessage: row.error_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deliveredAt: row.delivered_at,
    };
  }
}

// シングルトンインスタンス
export const messageRepository = new MessageRepository();

