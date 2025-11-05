import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * データベース接続プール
 */
class Database {
  private pool: Pool | null = null;

  /**
   * 接続プールを初期化
   */
  initialize(): void {
    if (this.pool) {
      return;
    }

    // Supabase接続対応
    // 接続文字列が指定されている場合はそれを使用
    const connectionString = process.env.DATABASE_URL;
    
    if (connectionString) {
      this.pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: process.env.DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
      });
    } else {
      // 個別パラメータで接続
      this.pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'edi_system',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        // SupabaseはSSL接続が必要
        ssl: process.env.DB_HOST?.includes('supabase.co')
          ? { rejectUnauthorized: false }
          : false,
      });
    }

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * クライアントを取得
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      this.initialize();
    }
    return this.pool!.connect();
  }

  /**
   * クエリを実行
   */
  async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      this.initialize();
    }
    return this.pool!.query(text, params);
  }

  /**
   * 接続を閉じる
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * 接続テスト
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

// シングルトンインスタンス
export const db = new Database();

