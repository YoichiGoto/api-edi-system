import { db } from '../utils/database';
import { Application } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * アプリケーションリポジトリ
 */
class ApplicationRepository {
  /**
   * APIキーをハッシュ化
   */
  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * アプリケーションを作成
   */
  async create(
    userId: string,
    name: string,
    description?: string
  ): Promise<{ application: Application; apiKey: string }> {
    // APIキーを生成
    const apiKey = `sk_${uuidv4().replace(/-/g, '')}`;
    const apiKeyHash = this.hashApiKey(apiKey);

    const application: Application = {
      id: uuidv4(),
      userId,
      name,
      description,
      apiKey,
      apiKeyHash,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const query = `
      INSERT INTO applications (id, user_id, name, description, api_key_hash, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, user_id, name, description, api_key_hash, is_active, created_at, updated_at, last_used_at
    `;

    const values = [
      application.id,
      application.userId,
      application.name,
      application.description || null,
      application.apiKeyHash,
      application.isActive,
      application.createdAt,
      application.updatedAt,
    ];

    try {
      const result = await db.query(query, values);
      const dbApp = result.rows[0];

      return {
        application: {
          id: dbApp.id,
          userId: dbApp.user_id,
          name: dbApp.name,
          description: dbApp.description,
          apiKey: apiKey, // この時点でのみ返す
          apiKeyHash: dbApp.api_key_hash,
          isActive: dbApp.is_active,
          createdAt: dbApp.created_at,
          updatedAt: dbApp.updated_at,
          lastUsedAt: dbApp.last_used_at,
        },
        apiKey,
      };
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  /**
   * APIキーでアプリケーションを検証
   */
  async findByApiKey(apiKey: string): Promise<Application | null> {
    const apiKeyHash = this.hashApiKey(apiKey);

    const query = `
      SELECT * FROM applications
      WHERE api_key_hash = $1 AND is_active = true
    `;
    const result = await db.query(query, [apiKeyHash]);

    if (result.rows.length === 0) {
      return null;
    }

    const app = this.mapRowToApplication(result.rows[0]);
    
    // 最終使用日時を更新
    await this.updateLastUsed(app.id);

    return app;
  }

  /**
   * アプリケーションを取得
   */
  async findById(id: string): Promise<Application | null> {
    const query = 'SELECT * FROM applications WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToApplication(result.rows[0]);
  }

  /**
   * ユーザーIDでアプリケーション一覧を取得
   */
  async findByUserId(userId: string): Promise<Application[]> {
    const query = `
      SELECT * FROM applications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);

    return result.rows.map((row: any) => this.mapRowToApplication(row));
  }

  /**
   * 最終使用日時を更新
   */
  async updateLastUsed(id: string): Promise<void> {
    const query = `
      UPDATE applications
      SET last_used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await db.query(query, [id]);
  }

  /**
   * アプリケーションを無効化
   */
  async deactivate(id: string): Promise<void> {
    const query = `
      UPDATE applications
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await db.query(query, [id]);
  }

  /**
   * データベース行をApplicationオブジェクトにマッピング
   */
  private mapRowToApplication(row: {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    api_key_hash: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    last_used_at?: Date;
  }): Application {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description,
      apiKey: '', // セキュリティのため返さない
      apiKeyHash: row.api_key_hash,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastUsedAt: row.last_used_at,
    };
  }
}

// シングルトンインスタンス
export const applicationRepository = new ApplicationRepository();

