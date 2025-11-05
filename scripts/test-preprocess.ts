#!/usr/bin/env ts-node

import * as path from 'path';
import * as fs from 'fs';

/**
 * 前処理スクリプトのテスト用スクリプト
 * Excelファイルの存在確認と、基本的な構造チェック
 */
function testPreprocessSetup(): void {
  console.log('=== Preprocess Setup Test ===\n');

  const baseDir = path.join(__dirname, '../');
  const excelDir = path.join(__dirname, '../../中小企業共通EDI標準ver.4.2_r0_20231001a');

  // Excelファイルの存在確認
  const excelFiles = [
    {
      name: '付表１',
      path: path.join(excelDir, '03_中小企業共通EDI標準仕様書＜付表１＞相互連携性情報項目表ver.4.2_r0_20231001.xlsx'),
    },
    {
      name: '付表３',
      path: path.join(excelDir, '05_中小企業共通EDI標準仕様書＜付表３＞マッピング表ver.4.2_r0_20231001a.xlsx'),
    },
    {
      name: '付表４',
      path: path.join(excelDir, '06_中小企業共通EDI標準仕様書＜付表４＞識別コード定義表ver.4.2_r0_20231001.xlsx'),
    },
  ];

  console.log('Checking Excel files...');
  let allFilesExist = true;
  for (const file of excelFiles) {
    if (fs.existsSync(file.path)) {
      console.log(`✓ ${file.name}: Found`);
    } else {
      console.log(`✗ ${file.name}: Not found (${file.path})`);
      allFilesExist = false;
    }
  }

  // 出力ディレクトリの確認
  console.log('\nChecking output directories...');
  const outputDirs = [
    path.join(baseDir, 'src/data/information-items'),
    path.join(baseDir, 'src/data/mappings'),
    path.join(baseDir, 'src/data/code-definitions'),
  ];

  for (const dir of outputDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
      console.log(`✓ ${path.basename(dir)}: ${files.length} JSON file(s)`);
    } else {
      console.log(`✗ ${path.basename(dir)}: Not found (will be created)`);
    }
  }

  // 環境変数の確認
  console.log('\nChecking environment variables...');
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    console.log('✓ GEMINI_API_KEY: Set (AI fallback enabled)');
  } else {
    console.log('⚠ GEMINI_API_KEY: Not set (AI fallback disabled)');
  }

  // まとめ
  console.log('\n=== Test Summary ===');
  if (allFilesExist) {
    console.log('✓ All Excel files found. Ready to run preprocessing.');
    console.log('\nTo run preprocessing:');
    console.log('  npm run preprocess');
  } else {
    console.log('✗ Some Excel files are missing.');
    console.log('Please ensure the Excel files are in the correct location.');
  }
}

if (require.main === module) {
  testPreprocessSetup();
}

