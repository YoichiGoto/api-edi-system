#!/usr/bin/env ts-node

import { db } from '../src/utils/database';
import dotenv from 'dotenv';

dotenv.config();

/**
 * データベース接続テストスクリプト
 */
async function testDatabaseConnection(): Promise<void> {
  console.log('=== Database Connection Test ===\n');

  // 環境変数の確認
  console.log('Checking environment variables...');
  const hasConnectionString = !!process.env.DATABASE_URL;
  const hasIndividualParams = !!(process.env.DB_HOST && process.env.DB_USER);

  if (!hasConnectionString && !hasIndividualParams) {
    console.error('❌ Database connection information not found in .env file');
    console.error('\nPlease set either:');
    console.error('  - DATABASE_URL (connection string)');
    console.error('  - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
    process.exit(1);
  }

  if (hasConnectionString) {
    console.log('✓ DATABASE_URL is set');
  } else {
    console.log('✓ Database connection parameters are set');
    console.log(`  Host: ${process.env.DB_HOST}`);
    console.log(`  Port: ${process.env.DB_PORT}`);
    console.log(`  Database: ${process.env.DB_NAME}`);
    console.log(`  User: ${process.env.DB_USER}`);
  }

  console.log('\nTesting database connection...');

  try {
    // データベース接続を初期化
    db.initialize();

    // 接続テスト
    const isConnected = await db.testConnection();

    if (isConnected) {
      console.log('✓ Database connection successful!\n');

      // テーブル一覧を取得
      console.log('Checking tables...');
      const tablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      const tablesResult = await db.query(tablesQuery);

      if (tablesResult.rows.length > 0) {
        console.log(`✓ Found ${tablesResult.rows.length} table(s):`);
        tablesResult.rows.forEach((row: any) => {
          console.log(`  - ${row.table_name}`);
        });
      } else {
        console.log('⚠ No tables found');
      }

      // 各テーブルの行数を確認
      console.log('\nTable row counts:');
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        try {
          const countResult = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = countResult.rows[0].count;
          console.log(`  ${tableName}: ${count} row(s)`);
        } catch (error) {
          console.log(`  ${tableName}: Error counting rows`);
        }
      }

      console.log('\n✅ Database is ready to use!');
    } else {
      console.error('❌ Database connection test failed');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Database connection error:');
    console.error('  ', error.message);

    if (error.message.includes('password')) {
      console.error('\n💡 Hint: Check your database password in .env file');
      console.error('   You can reset it from Supabase Dashboard > Settings > Database');
    } else if (error.message.includes('SSL')) {
      console.error('\n💡 Hint: Supabase requires SSL connection (already configured)');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Hint: Check your database host and port in .env file');
    }

    process.exit(1);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  testDatabaseConnection()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

