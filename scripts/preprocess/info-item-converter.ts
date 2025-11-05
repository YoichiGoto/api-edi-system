import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { detectTableRegions, extractTableData } from './table-detector';
import { detectTableRegionsWithAI } from './ai-table-detector';

interface InformationItem {
  rowNumber?: string;
  headerDetail?: string;
  clId?: string;
  itemName: string;
  itemDefinition?: string;
  repetition?: string;
  establishedRevised?: string;
  commonEdiMapping?: {
    commonCore?: string;
    manufacturing?: string;
    construction?: string;
    distribution?: string;
  };
  reference?: {
    invoiceCompatible?: string;
  };
}

interface InformationItemTable {
  sheetName: string;
  messageType: string;
  tableType?: string;
  region?: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  };
  items: InformationItem[];
}

/**
 * 付表１（相互連携性情報項目表）をJSONに変換（複数テーブル対応版）
 */
async function convertInformationItemTable(excelPath: string, outputDir: string): Promise<void> {
  console.log(`Reading Excel file: ${excelPath}`);
  
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found: ${excelPath}`);
  }

  const workbook = XLSX.readFile(excelPath);
  const outputData: InformationItemTable[] = [];

  // 各シートを処理
  for (const sheetName of workbook.SheetNames) {
    console.log(`\nProcessing sheet: ${sheetName}`);
    
    // 表紙や改定履歴などの非データシートをスキップ
    if (sheetName.includes('表紙') || sheetName.includes('改定履歴') || sheetName.includes('使い方')) {
      console.log(`  Skipping non-data sheet: ${sheetName}`);
      continue;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // ルールベースでテーブル領域を検出
    console.log(`  [DEBUG] Starting table detection for sheet: ${sheetName}`);
    const detectionResult = detectTableRegions(worksheet, sheetName, [
      '行番号', 'ヘッダ', '明細行', 'CL/ID', '項目名', '項目定義',
      '繰返し', '制定', '改定', '共通EDI', 'マッピング',
      '国連CEFACT', 'CEFACT', 'BIE', 'メッセージ辞書',
      'データ型', 'コード表', '補足情報'
    ]);
    
    console.log(`  [DEBUG] Detection result: ${detectionResult.regions.length} table(s), confidence: ${detectionResult.confidence.toFixed(2)}, needsAI: ${detectionResult.needsAI}`);
    
    let regions = detectionResult.regions;
    
    // AIフォールバック（信頼度が低い場合のみ）
    if (detectionResult.needsAI) {
      console.log('  Low confidence detection. Attempting AI fallback...');
      
      const lowConfidenceRegions = regions
        .filter(r => r.confidence < 0.6)
        .map(r => ({
          startRow: r.startRow,
          endRow: r.endRow,
          startCol: r.startCol,
          endCol: r.endCol
        }));
      
      if (lowConfidenceRegions.length > 0) {
        try {
          const aiRegions = await detectTableRegionsWithAI(excelPath, sheetName, lowConfidenceRegions);
          if (aiRegions.length > 0) {
            console.log(`  AI detected ${aiRegions.length} additional table(s)`);
          }
        } catch (err) {
          console.warn('  AI detection failed, using rule-based results:', err);
        }
      }
    }
    
    // regionsが空の場合は警告を出してスキップ
    if (regions.length === 0) {
      console.warn(`  [WARN] No tables detected in sheet: ${sheetName}. Skipping...`);
      continue;
    }
    
    // 各テーブル領域を処理
    for (const region of regions) {
      console.log(`  Processing ${region.tableType} table (confidence: ${region.confidence.toFixed(2)})`);
      console.log(`    Range: R${region.startRow + 1}C${region.startCol + 1}:R${region.endRow + 1}C${region.endCol + 1}`);
      
      // テーブルデータを抽出
      const tableData = extractTableData(worksheet, region);
      
      if (tableData.length === 0) {
        console.warn(`    Skipping empty table`);
        continue;
      }
      
      // ヘッダー行を検出（テーブル領域内での相対位置）
      const headerRowIndex = region.headerRow - region.startRow;
      if (headerRowIndex < 0 || headerRowIndex >= tableData.length) {
        console.warn(`    Invalid header row index: ${headerRowIndex}`);
        continue;
      }
      
      const headerRow = tableData[headerRowIndex] as string[];
      
      // メッセージタイプを推測
      let messageType = sheetName.toLowerCase();
      if (sheetName.includes('注文') || sheetName.includes('Order')) {
        messageType = 'order';
      } else if (sheetName.includes('請求') || sheetName.includes('Invoice')) {
        messageType = 'invoice';
      } else if (sheetName.includes('見積') || sheetName.includes('Quotation')) {
        messageType = 'quotation';
      } else if (sheetName.includes('出荷') || sheetName.includes('Shipment')) {
        messageType = 'shipment';
      } else if (sheetName.includes('仕入') || sheetName.includes('Purchase')) {
        messageType = 'purchase';
      }
      
      // 列インデックスのマッピングを推測
      const rowNumberIndex = headerRow.findIndex(h => 
        h?.toString().includes('行番号') || h?.toString().includes('Row')
      );
      const headerDetailIndex = headerRow.findIndex(h => 
        h?.toString().includes('ヘッダ') || h?.toString().includes('明細') ||
        h?.toString().includes('Header') || h?.toString().includes('Detail')
      );
      const clIdIndex = headerRow.findIndex(h => 
        h?.toString().includes('CL/ID') || h?.toString().includes('CLID') ||
        h?.toString().includes('ID')
      );
      const itemNameIndex = headerRow.findIndex(h => 
        h?.toString().includes('項目名') || h?.toString().includes('Item Name') ||
        h?.toString().includes('Name')
      );
      const itemDefinitionIndex = headerRow.findIndex(h => 
        h?.toString().includes('項目定義') || h?.toString().includes('Definition') ||
        h?.toString().includes('定義')
      );
      const repetitionIndex = headerRow.findIndex(h => 
        h?.toString().includes('繰返し') || h?.toString().includes('Repetition') ||
        h?.toString().includes('繰り返し')
      );
      const establishedRevisedIndex = headerRow.findIndex(h => 
        h?.toString().includes('制定') || h?.toString().includes('改定') ||
        h?.toString().includes('Established') || h?.toString().includes('Revised')
      );
      const commonCoreIndex = headerRow.findIndex(h => 
        h?.toString().includes('中小共通コア') || h?.toString().includes('Common Core')
      );
      const manufacturingIndex = headerRow.findIndex(h => 
        h?.toString().includes('中小製造業') || h?.toString().includes('Manufacturing')
      );
      const constructionIndex = headerRow.findIndex(h => 
        h?.toString().includes('中小建設業') || h?.toString().includes('Construction')
      );
      const distributionIndex = headerRow.findIndex(h => 
        h?.toString().includes('中小流通業') || h?.toString().includes('Distribution')
      );
      const invoiceCompatibleIndex = headerRow.findIndex(h => 
        h?.toString().includes('インボイス対応') || h?.toString().includes('Invoice Compatible')
      );
      
      const items: InformationItem[] = [];
      
      // データ行を処理
      for (let i = headerRowIndex + 1; i < tableData.length; i++) {
        const row = tableData[i] as string[];
        
        if (row.every(cell => !cell || cell.toString().trim() === '')) {
          continue;
        }
        
        // 項目名が必須
        const itemName = itemNameIndex >= 0 ? row[itemNameIndex]?.toString().trim() : row[3]?.toString().trim();
        if (!itemName || itemName === '') {
          continue;
        }
        
        const item: InformationItem = {
          itemName,
        };
        
        // オプション項目の設定
        if (rowNumberIndex >= 0) {
          item.rowNumber = row[rowNumberIndex]?.toString().trim();
        }
        if (headerDetailIndex >= 0) {
          item.headerDetail = row[headerDetailIndex]?.toString().trim();
        }
        if (clIdIndex >= 0) {
          item.clId = row[clIdIndex]?.toString().trim();
        }
        if (itemDefinitionIndex >= 0) {
          item.itemDefinition = row[itemDefinitionIndex]?.toString().trim();
        }
        if (repetitionIndex >= 0) {
          item.repetition = row[repetitionIndex]?.toString().trim();
        }
        if (establishedRevisedIndex >= 0) {
          item.establishedRevised = row[establishedRevisedIndex]?.toString().trim();
        }
        
        // 共通EDIマッピング情報
        if (commonCoreIndex >= 0 || manufacturingIndex >= 0 || constructionIndex >= 0 || distributionIndex >= 0) {
          item.commonEdiMapping = {};
          if (commonCoreIndex >= 0) {
            item.commonEdiMapping.commonCore = row[commonCoreIndex]?.toString().trim();
          }
          if (manufacturingIndex >= 0) {
            item.commonEdiMapping.manufacturing = row[manufacturingIndex]?.toString().trim();
          }
          if (constructionIndex >= 0) {
            item.commonEdiMapping.construction = row[constructionIndex]?.toString().trim();
          }
          if (distributionIndex >= 0) {
            item.commonEdiMapping.distribution = row[distributionIndex]?.toString().trim();
          }
        }
        
        // 参考情報
        if (invoiceCompatibleIndex >= 0) {
          item.reference = {
            invoiceCompatible: row[invoiceCompatibleIndex]?.toString().trim()
          };
        }
        
        items.push(item);
      }
      
      if (items.length > 0) {
        const tableName = `${messageType}-${region.tableType}-info-items`;
        const infoItemTable: InformationItemTable = {
          sheetName: `${sheetName} (${region.tableType})`,
          messageType,
          tableType: region.tableType,
          region: {
            startRow: region.startRow,
            endRow: region.endRow,
            startCol: region.startCol,
            endCol: region.endCol
          },
          items,
        };
        
        outputData.push(infoItemTable);
        
        // 個別のJSONファイルとして出力
        const outputFile = path.join(outputDir, `${tableName}.json`);
        fs.writeFileSync(
          outputFile,
          JSON.stringify(infoItemTable, null, 2),
          'utf-8'
        );
        console.log(`    Created: ${outputFile} (${items.length} items)`);
      }
    }
  }

  // 統合JSONファイルとしても出力
  const outputFile = path.join(outputDir, 'information-items.json');
  fs.writeFileSync(
    outputFile,
    JSON.stringify(outputData, null, 2),
    'utf-8'
  );
  console.log(`\nTotal information item tables created: ${outputData.length}`);
  console.log(`Output file: ${outputFile}`);
}

export { convertInformationItemTable, InformationItem, InformationItemTable };

// メイン処理
if (require.main === module) {
  const excelPath = process.env.EXCEL_PATH_INFO_ITEMS || 
    path.join(__dirname, '../../data/excel/03_中小企業共通EDI標準仕様書＜付表１＞相互連携性情報項目表ver.4.2_r0_20231001.xlsx');
  
  const outputDir = path.join(__dirname, '../../src/data/information-items');
  
  // 出力ディレクトリを作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    convertInformationItemTable(excelPath, outputDir)
      .then(() => {
        console.log('Information item table conversion completed successfully!');
      })
      .catch((error) => {
        console.error('Error converting information item table:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('Error converting information item table:', error);
    process.exit(1);
  }
}

