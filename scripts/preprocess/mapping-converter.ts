import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { detectTableRegions, extractTableData } from './table-detector';
import { detectTableRegionsWithAI } from './ai-table-detector';

interface MappingField {
  appField: string;
  ediField: string;
  ediId?: string;
  required: boolean;
  dataType?: string;
  description?: string;
}

interface MappingTable {
  sheetName: string;
  messageType: string;
  tableType?: string;
  region?: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  };
  fields: MappingField[];
}

/**
 * 付表３（マッピング表）をJSONに変換（複数テーブル対応版）
 */
async function convertMappingTable(excelPath: string, outputDir: string): Promise<void> {
  console.log(`Reading Excel file: ${excelPath}`);
  
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found: ${excelPath}`);
  }

  const workbook = XLSX.readFile(excelPath);
  const outputData: MappingTable[] = [];

  // 各シートを処理
  for (const sheetName of workbook.SheetNames) {
    console.log(`\nProcessing sheet: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    
    // ルールベースでテーブル領域を検出
    console.log(`  [DEBUG] Starting table detection for sheet: ${sheetName}`);
    const detectionResult = detectTableRegions(worksheet, sheetName, [
      '業務アプリ', '共通EDI', 'マッピング', '情報項目'
    ]);
    
    console.log(`  [DEBUG] Detection result: ${detectionResult.regions.length} table(s), confidence: ${detectionResult.confidence.toFixed(2)}, needsAI: ${detectionResult.needsAI}`);
    
    let regions = detectionResult.regions;
    
    // regionsが空の場合は警告を出してスキップ
    if (regions.length === 0) {
      console.warn(`  [WARN] No tables detected in sheet: ${sheetName}. Skipping...`);
      continue;
    }
    
    // AIフォールバック（信頼度が低い場合のみ）
    if (detectionResult.needsAI) {
      console.log('Low confidence detection. Attempting AI fallback...');
      
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
            console.log(`AI detected ${aiRegions.length} additional table(s)`);
            // AI結果をマージ（信頼度の高い方を優先）
            // 簡易的には、既存のregionsを優先し、AI結果は補完として使用
            // 本実装では、AI結果を直接使用する代わりに、既存のregionsを改善する方法を検討
          }
        } catch (err) {
          console.warn('AI detection failed, using rule-based results:', err);
        }
      }
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
      
      // メッセージタイプを推測
      let messageType = sheetName.toLowerCase();
      if (region.tableType === 'mapping') {
        if (sheetName.includes('注文') || sheetName.includes('Order')) {
          messageType = 'order';
        } else if (sheetName.includes('請求') || sheetName.includes('Invoice')) {
          messageType = 'invoice';
        } else if (sheetName.includes('見積') || sheetName.includes('Quotation')) {
          messageType = 'quotation';
        }
      }
      
      const fields: MappingField[] = [];
      
      // データ行を処理
      for (let i = headerRowIndex + 1; i < tableData.length; i++) {
        const row = tableData[i] as string[];
        
        if (row.every(cell => !cell || cell.toString().trim() === '')) {
          continue;
        }
        
        // マッピング情報を抽出
        const appField = row[0]?.toString().trim() || '';
        const ediField = row[1]?.toString().trim() || '';
        const ediId = row[2]?.toString().trim() || '';
        const required = row.some(cell => 
          cell?.toString().includes('必須') || 
          cell?.toString().includes('○') ||
          cell?.toString().includes('●')
        );
        const dataType = row.find(cell => 
          cell?.toString().match(/(String|Number|Date|Code|Identifier)/)
        )?.toString().trim();
        const description = row.find(cell => 
          cell && cell.toString().length > 10 && !cell.toString().includes('○')
        )?.toString().trim();
        
        if (appField && ediField) {
          fields.push({
            appField,
            ediField,
            ediId: ediId || undefined,
            required,
            dataType: dataType || undefined,
            description: description || undefined,
          });
        }
      }
      
      if (fields.length > 0) {
        const tableName = `${messageType}-${region.tableType}-mapping`;
        const mappingTable: MappingTable = {
          sheetName: `${sheetName} (${region.tableType})`,
          messageType,
          tableType: region.tableType,
          region: {
            startRow: region.startRow,
            endRow: region.endRow,
            startCol: region.startCol,
            endCol: region.endCol
          },
          fields,
        };
        
        outputData.push(mappingTable);
        
        const outputFile = path.join(outputDir, `${tableName}.json`);
        fs.writeFileSync(
          outputFile,
          JSON.stringify(mappingTable, null, 2),
          'utf-8'
        );
        console.log(`    Created: ${outputFile} (${fields.length} fields)`);
      }
    }
  }

  // 統合JSONファイルとしても出力
  const outputFile = path.join(outputDir, 'mappings.json');
  fs.writeFileSync(
    outputFile,
    JSON.stringify(outputData, null, 2),
    'utf-8'
  );
  console.log(`\nTotal mappings created: ${outputData.length}`);
  console.log(`Output file: ${outputFile}`);
}

export { convertMappingTable, MappingField, MappingTable };

// メイン処理
if (require.main === module) {
  const excelPath = process.env.EXCEL_PATH_MAPPING || 
    path.join(__dirname, '../../data/excel/05_中小企業共通EDI標準仕様書＜付表３＞マッピング表ver.4.2_r0_20231001a.xlsx');
  
  const outputDir = path.join(__dirname, '../../src/data/mappings');
  
  // 出力ディレクトリを作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    convertMappingTable(excelPath, outputDir)
      .then(() => {
        console.log('Mapping table conversion completed successfully!');
      })
      .catch((error) => {
        console.error('Error converting mapping table:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('Error converting mapping table:', error);
    process.exit(1);
  }
}
