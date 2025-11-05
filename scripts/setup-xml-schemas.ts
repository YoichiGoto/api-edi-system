#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

/**
 * XMLスキーマファイルのセットアップ確認スクリプト
 */
function checkXMLSchemas(): void {
  console.log('=== XML Schema Setup Check ===\n');

  const schemasDir = path.join(__dirname, '../src/schemas/xml');
  
  // 必要なスキーマファイルのリスト
  const requiredSchemas: { [key: string]: string } = {
    'SMEOrder.xsd': '注文メッセージ',
    'SMEOrderResponse.xsd': '注文回答メッセージ',
    'SMEQuotation.xsd': '見積依頼メッセージ',
    'SMEQuotationResponse.xsd': '見積回答メッセージ',
    'SMEDespatchAdvice.xsd': '出荷案内メッセージ',
    'SMEReceivingAdvice.xsd': '出荷回答メッセージ',
    'SMEConsolidatedInvoice.xsd': '統合請求メッセージ',
    'SMEInvoice.xsd': '単一請求メッセージ',
    'SMEConsolidatedSelfInvoice.xsd': '統合仕入明細メッセージ',
    'SMEConsolidatedSelfInvoiceResponse.xsd': '統合仕入明細回答メッセージ',
    'SMESelfInvoice.xsd': '単一仕入明細メッセージ',
    'SMESelfInvoiceResponse.xsd': '単一仕入明細回答メッセージ',
    'SMERemittanceAdvaice.xsd': '支払通知メッセージ',
    'SMESchedulingDemandForcast.xsd': '需要予測メッセージ',
    'SMESchedulingSupplyInstruction.xsd': '納入指示メッセージ',
  };

  console.log('Checking XML schema files...\n');

  if (!fs.existsSync(schemasDir)) {
    console.error(`❌ XML schemas directory not found: ${schemasDir}`);
    console.log('\nCreating directory...');
    fs.mkdirSync(schemasDir, { recursive: true });
    console.log('✓ Directory created');
  }

  let foundCount = 0;
  let missingCount = 0;

  for (const [fileName, description] of Object.entries(requiredSchemas)) {
    const filePath = path.join(schemasDir, fileName);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✓ ${fileName} (${description}) - ${(stats.size / 1024).toFixed(2)} KB`);
      foundCount++;
    } else {
      console.log(`✗ ${fileName} (${description}) - NOT FOUND`);
      missingCount++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Found: ${foundCount}/${Object.keys(requiredSchemas).length} schemas`);
  console.log(`Missing: ${missingCount} schemas`);

  if (missingCount > 0) {
    console.log('\n📥 To download XML schemas:');
    console.log('   1. Visit: https://tsunagu-cons.jp/technicalinformation/smeedixml_sample/');
    console.log('   2. Download the XSD files');
    console.log(`   3. Place them in: ${schemasDir}`);
    console.log('\n📖 See docs/XML_SCHEMA_SETUP.md for detailed instructions');
  } else {
    console.log('\n✅ All XML schemas are present!');
  }
}

if (require.main === module) {
  checkXMLSchemas();
}

