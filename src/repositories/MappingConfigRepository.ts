import { db } from '../utils/database';
import { MappingConfig, MappingConfigCreateInput } from '../models/MappingConfig';
import { v4 as uuidv4 } from 'uuid';

/**
 * マッピング設定リポジトリ
 */
class MappingConfigRepository {
  /**
   * マッピング設定を作成
   */
  async create(input: MappingConfigCreateInput): Promise<MappingConfig> {
    const config: MappingConfig = {
      id: uuidv4(),
      appId: input.appId,
      appName: input.appName,
      messageType: input.messageType,
      fieldMappings: input.fieldMappings,
      formatType: input.formatType || 'json',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const query = `
      INSERT INTO mapping_configs (id, app_id, app_name, message_type, field_mappings, format_type, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      config.id,
      config.appId,
      config.appName,
      config.messageType,
      JSON.stringify(config.fieldMappings),
      config.formatType,
      config.createdAt,
      config.updatedAt,
    ];

    try {
      const result = await db.query(query, values);
      return this.mapRowToConfig(result.rows[0]);
    } catch (error) {
      console.error('Error creating mapping config:', error);
      throw error;
    }
  }

  /**
   * マッピング設定を取得
   */
  async findById(id: string): Promise<MappingConfig | null> {
    const query = 'SELECT * FROM mapping_configs WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConfig(result.rows[0]);
  }

  /**
   * アプリケーションIDとメッセージタイプで取得
   */
  async findByAppAndMessageType(
    appId: string,
    messageType: string
  ): Promise<MappingConfig | null> {
    const query = `
      SELECT * FROM mapping_configs
      WHERE app_id = $1 AND message_type = $2
    `;
    const result = await db.query(query, [appId, messageType]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToConfig(result.rows[0]);
  }

  /**
   * アプリケーションIDで全マッピング設定を取得
   */
  async findByAppId(appId: string): Promise<MappingConfig[]> {
    const query = 'SELECT * FROM mapping_configs WHERE app_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [appId]);

    return result.rows.map((row: any) => this.mapRowToConfig(row));
  }

  /**
   * マッピング設定を更新
   */
  async update(id: string, updates: Partial<MappingConfigCreateInput>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.appName) {
      updateFields.push(`app_name = $${paramIndex++}`);
      values.push(updates.appName);
    }
    if (updates.fieldMappings) {
      updateFields.push(`field_mappings = $${paramIndex++}`);
      values.push(JSON.stringify(updates.fieldMappings));
    }
    if (updates.formatType) {
      updateFields.push(`format_type = $${paramIndex++}`);
      values.push(updates.formatType);
    }

    if (updateFields.length === 0) {
      return;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE mapping_configs
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await db.query(query, values);
  }

  /**
   * マッピング設定を削除
   */
  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM mapping_configs WHERE id = $1';
    await db.query(query, [id]);
  }

  /**
   * データベース行をMappingConfigオブジェクトにマッピング
   */
  private mapRowToConfig(row: {
    id: string;
    app_id: string;
    app_name: string;
    message_type: string;
    field_mappings: string | any;
    format_type: string;
    created_at: Date;
    updated_at: Date;
  }): MappingConfig {
    return {
      id: row.id,
      appId: row.app_id,
      appName: row.app_name,
      messageType: row.message_type,
      fieldMappings: typeof row.field_mappings === 'string'
        ? JSON.parse(row.field_mappings)
        : row.field_mappings,
      formatType: row.format_type as 'json' | 'xml' | 'csv',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// シングルトンインスタンス
export const mappingConfigRepository = new MappingConfigRepository();

