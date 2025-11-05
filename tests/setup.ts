/**
 * Jest設定ファイル
 */
import dotenv from 'dotenv';

// テスト環境変数の読み込み
dotenv.config({ path: '.env.test' });

// グローバル設定
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // テスト中はログを抑制

// タイムアウト設定
jest.setTimeout(10000);

