#!/usr/bin/env ts-node

import * as path from 'path';
import * as fs from 'fs';
import { convertMappingTable } from './mapping-converter';
import { convertCodeDefinitionTable } from './code-def-converter';
import { convertInformationItemTable } from './info-item-converter';

/**
 * すべてのExcelファイルをJSONに変換するメインスクリプト
 */
async function main() {
  console.log('=== Excel to JSON Conversion Script ===\n');

  const baseDir = path.join(__dirname, '../../');
  const excelDir = path.join(__dirname, '../../../中小企業共通EDI標準ver.4.2_r0_20231001a');

  // 付表１（相互連携性情報項目表）の変換
  console.log('\n[1/3] Converting 付表１ (Information Items Table)...');
  const infoItemExcelPath = path.join(
    excelDir,
    '03_中小企業共通EDI標準仕様書＜付表１＞相互連携性情報項目表ver.4.2_r0_20231001.xlsx'
  );
  
  if (fs.existsSync(infoItemExcelPath)) {
    const infoItemOutputDir = path.join(baseDir, 'src/data/information-items');
    if (!fs.existsSync(infoItemOutputDir)) {
      fs.mkdirSync(infoItemOutputDir, { recursive: true });
    }
    await convertInformationItemTable(infoItemExcelPath, infoItemOutputDir);
  } else {
    console.warn(`Information items table Excel file not found: ${infoItemExcelPath}`);
  }

  // 付表３（マッピング表）の変換
  console.log('\n[2/3] Converting 付表３ (Mapping Table)...');
  const mappingExcelPath = path.join(
    excelDir,
    '05_中小企業共通EDI標準仕様書＜付表３＞マッピング表ver.4.2_r0_20231001a.xlsx'
  );
  
  if (fs.existsSync(mappingExcelPath)) {
    const mappingOutputDir = path.join(baseDir, 'src/data/mappings');
    if (!fs.existsSync(mappingOutputDir)) {
      fs.mkdirSync(mappingOutputDir, { recursive: true });
    }
    await convertMappingTable(mappingExcelPath, mappingOutputDir);
  } else {
    console.warn(`Mapping table Excel file not found: ${mappingExcelPath}`);
  }

  // 付表４（識別コード定義表）の変換
  console.log('\n[3/3] Converting 付表４ (Code Definition Table)...');
  const codeDefExcelPath = path.join(
    excelDir,
    '06_中小企業共通EDI標準仕様書＜付表４＞識別コード定義表ver.4.2_r0_20231001.xlsx'
  );
  
  if (fs.existsSync(codeDefExcelPath)) {
    const codeDefOutputDir = path.join(baseDir, 'src/data/code-definitions');
    if (!fs.existsSync(codeDefOutputDir)) {
      fs.mkdirSync(codeDefOutputDir, { recursive: true });
    }
    await convertCodeDefinitionTable(codeDefExcelPath, codeDefOutputDir);
  } else {
    console.warn(`Code definition table Excel file not found: ${codeDefExcelPath}`);
  }

  console.log('\n=== Conversion Completed ===');
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('All conversions completed successfully!');
    })
    .catch((error) => {
      console.error('Error in main process:', error);
      process.exit(1);
    });
}

