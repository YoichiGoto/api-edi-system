import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { detectTableRegions, extractTableData } from './table-detector';
import { detectTableRegionsWithAI } from './ai-table-detector';

interface CodeValue {
  code: string;
  codeName: string;
  codeNameEn?: string;
  description?: string;
  internationalCode?: string;
  internationalCodeName?: string;
  category?: string;
}

interface CodeDefinition {
  codeType: string;
  sheetName: string;
  tableType?: string;
  region?: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  };
  codes: CodeValue[];
}

/**
 * 付表４（識別コード定義表）をJSONに変換（複数テーブル対応版）
 */
async function convertCodeDefinitionTable(excelPath: string, outputDir: string): Promise<void> {
  console.log(`Reading Excel file: ${excelPath}`);
  
  if (!fs.existsSync(excelPath)) {
    throw new Error(`Excel file not found: ${excelPath}`);
  }

  const workbook = XLSX.readFile(excelPath);
  const outputData: CodeDefinition[] = [];

  // 各シートを処理（識別コードごとにシートが分かれている）
  for (const sheetName of workbook.SheetNames) {
    console.log(`\nProcessing sheet: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    
    // ルールベースでテーブル領域を検出
    const detectionResult = detectTableRegions(worksheet, sheetName, [
      'コード', 'Code', '名称', 'Name', '値', '説明'
    ]);
    
    console.log(`Detected ${detectionResult.regions.length} table(s) with confidence: ${detectionResult.confidence.toFixed(2)}`);
    
    let regions = detectionResult.regions;
    
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
          }
        } catch (err) {
          console.warn('AI detection failed, using rule-based results:', err);
        }
      }
    }
    
    // 各テーブル領域を処理
    let tableIndex = 0;
    for (const region of regions) {
      console.log(`  Processing ${region.tableType} table (confidence: ${region.confidence.toFixed(2)})`);
      console.log(`    Range: R${region.startRow + 1}C${region.startCol + 1}:R${region.endRow + 1}C${region.endCol + 1}`);
      
      // テーブルデータを抽出
      const tableData = extractTableData(worksheet, region);
      
      if (tableData.length === 0) {
        console.warn(`    Skipping empty table`);
        tableIndex++;
        continue;
      }
      
      // ヘッダー行を検出（テーブル領域内での相対位置）
      const headerRowIndex = region.headerRow - region.startRow;
      if (headerRowIndex < 0 || headerRowIndex >= tableData.length) {
        console.warn(`    Invalid header row index: ${headerRowIndex}`);
        tableIndex++;
        continue;
      }
      
      const headerRow = tableData[headerRowIndex] as string[];
      
      // シート名からコードタイプを推測（元のシート名を使用）
      // まず、シート名をクリーンアップ
      let cleanSheetName = sheetName.trim();
      
      // ファイルシステムで安全なファイル名を生成
      // 日本語を含む場合は、シート名をそのまま使用（macOS/Linuxでは問題なし）
      // ただし、特殊文字は削除または置換
      let codeType = cleanSheetName
        .replace(/[<>:"/\\|?*]/g, '') // Windowsで無効な文字を削除
        .replace(/\s+/g, '-') // スペースをハイフンに
        .replace(/[-]+/g, '-') // 連続するハイフンを1つに
        .replace(/^-|-$/g, ''); // 先頭・末尾のハイフンを削除
      
      // 複数のテーブルがある場合は、tableTypeとインデックスを追加
      if (regions.length > 1) {
        codeType = `${codeType}-${region.tableType}-${tableIndex}`;
      } else if (codeType && codeType !== '-') {
        // 単一テーブルの場合でも、tableTypeを追加して一意性を確保
        codeType = `${codeType}-${region.tableType}`;
      }
      
      // codeTypeが空またはハイフンのみの場合は、tableTypeとインデックスを使用
      if (!codeType || codeType === '-' || codeType.match(/^-+$/)) {
        codeType = `${region.tableType}-table-${tableIndex}`;
      }
      
      // 列インデックスのマッピングを推測
      const codeIndex = headerRow.findIndex(h => 
        h?.toString().includes('コード') || h?.toString().includes('Code')
      );
      const nameIndex = headerRow.findIndex(h => 
        h?.toString().includes('名称') || h?.toString().includes('Name') || 
        h?.toString().includes('コード名')
      );
      const nameEnIndex = headerRow.findIndex(h => 
        h?.toString().includes('English') || h?.toString().includes('英語')
      );
      const descIndex = headerRow.findIndex(h => 
        h?.toString().includes('説明') || h?.toString().includes('Description')
      );
      const intlCodeIndex = headerRow.findIndex(h => 
        h?.toString().includes('国際') || h?.toString().includes('International')
      );
      const categoryIndex = headerRow.findIndex(h => 
        h?.toString().includes('分類') || h?.toString().includes('Category')
      );
      
      const codes: CodeValue[] = [];
      
      // データ行を処理
      for (let i = headerRowIndex + 1; i < tableData.length; i++) {
        const row = tableData[i] as string[];
        
        // 空行をスキップ
        if (row.every(cell => !cell || cell.toString().trim() === '')) {
          continue;
        }
        
        const code = codeIndex >= 0 ? row[codeIndex]?.toString().trim() : row[0]?.toString().trim();
        const codeName = nameIndex >= 0 ? row[nameIndex]?.toString().trim() : row[1]?.toString().trim();
        
        if (!code || !codeName) {
          continue;
        }
        
        codes.push({
          code,
          codeName,
          codeNameEn: nameEnIndex >= 0 ? row[nameEnIndex]?.toString().trim() : undefined,
          description: descIndex >= 0 ? row[descIndex]?.toString().trim() : undefined,
          internationalCode: intlCodeIndex >= 0 ? row[intlCodeIndex]?.toString().trim() : undefined,
          internationalCodeName: intlCodeIndex >= 0 && row[intlCodeIndex + 1] ? 
            row[intlCodeIndex + 1].toString().trim() : undefined,
          category: categoryIndex >= 0 ? row[categoryIndex]?.toString().trim() : undefined,
        });
      }
      
      if (codes.length > 0) {
        const codeDefinition: CodeDefinition = {
          codeType,
          sheetName: `${sheetName} (${region.tableType})`,
          tableType: region.tableType,
          region: {
            startRow: region.startRow,
            endRow: region.endRow,
            startCol: region.startCol,
            endCol: region.endCol
          },
          codes,
        };
        
        outputData.push(codeDefinition);
        
        // 個別のJSONファイルとして出力
        // codeTypeは既にファイルシステムで安全な形式になっているので、そのまま使用
        const outputFile = path.join(outputDir, `${codeType}.json`);
        fs.writeFileSync(
          outputFile,
          JSON.stringify(codeDefinition, null, 2),
          'utf-8'
        );
        console.log(`    Created: ${outputFile} (${codes.length} codes)`);
      }
      
      tableIndex++;
    }
  }

  // 統合JSONファイルとしても出力
  const outputFile = path.join(outputDir, 'code-definitions.json');
  fs.writeFileSync(
    outputFile,
    JSON.stringify(outputData, null, 2),
    'utf-8'
  );
  console.log(`\nTotal code definitions created: ${outputData.length}`);
  console.log(`Output file: ${outputFile}`);
}

export { convertCodeDefinitionTable, CodeValue, CodeDefinition };

// メイン処理
if (require.main === module) {
  const excelPath = process.env.EXCEL_PATH_CODE_DEF || 
    path.join(__dirname, '../../data/excel/06_中小企業共通EDI標準仕様書＜付表４＞識別コード定義表ver.4.2_r0_20231001.xlsx');
  
  const outputDir = path.join(__dirname, '../../src/data/code-definitions');
  
  // 出力ディレクトリを作成
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    convertCodeDefinitionTable(excelPath, outputDir)
      .then(() => {
        console.log('Code definition table conversion completed successfully!');
      })
      .catch((error) => {
        console.error('Error converting code definition table:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('Error converting code definition table:', error);
    process.exit(1);
  }
}
