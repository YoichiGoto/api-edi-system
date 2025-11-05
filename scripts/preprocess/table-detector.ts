import * as XLSX from 'xlsx';

export interface TableRegion {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  headerRow: number;
  tableType: string;
  confidence: number; // 0.0 - 1.0 の信頼度スコア
  description?: string;
}

export interface DetectionResult {
  regions: TableRegion[];
  needsAI: boolean; // AIが必要かどうか
  confidence: number; // 全体の信頼度
}

/**
 * データ密度を分析して、テーブル境界を検出
 */
function analyzeDataDensity(
  jsonData: any[][],
  minDataCells: number = 3
): { rowDensity: boolean[]; colDensity: boolean[] } {
  const rowDensity: boolean[] = [];
  const colDensity: boolean[] = [];

  // 最大列数を取得
  const maxCols = jsonData.length > 0 
    ? Math.max(...jsonData.map(row => row ? row.length : 0))
    : 0;

  // 各行のデータ密度をチェック
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i] || [];
    const dataCount = row.filter(cell => 
      cell !== null && 
      cell !== undefined && 
      cell !== '' && 
      cell.toString().trim() !== ''
    ).length;
    rowDensity.push(dataCount >= minDataCells);
  }

  // 各列のデータ密度をチェック
  for (let col = 0; col < maxCols; col++) {
    let dataCount = 0;
    for (let row = 0; row < jsonData.length; row++) {
      const cell = jsonData[row]?.[col];
      if (cell !== null && cell !== undefined && cell !== '' && 
          cell.toString().trim() !== '') {
        dataCount++;
      }
    }
    colDensity.push(dataCount >= minDataCells);
  }

  return { rowDensity, colDensity };
}

/**
 * ヘッダー行候補を複数検出
 */
function findHeaderCandidates(
  jsonData: any[][],
  keywords: string[] = []
): Array<{ rowIndex: number; confidence: number; matchedKeywords: string[] }> {
  const candidates: Array<{ rowIndex: number; confidence: number; matchedKeywords: string[] }> = [];
  
  // デフォルトのキーワード
  const defaultKeywords = [
    '業務アプリ', '共通EDI', 'マッピング', '情報項目',
    'コード', 'Code', '名称', 'Name', '値',
    '国連CEFACT', 'CEFACT', 'BIE', 'メッセージ辞書',
    'データ型', 'コード表', '入力値', '行番号', 'ヘッダ',
    '項目名', '項目定義', '繰返し', '制定', '改定'
  ];
  
  const allKeywords = [...defaultKeywords, ...keywords];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i] as string[];
    if (!row || row.length === 0) continue;
    
    const matchedKeywords: string[] = [];
    
    // キーワードマッチング
    for (const keyword of allKeywords) {
      if (row.some(cell => 
        typeof cell === 'string' && cell.includes(keyword)
      )) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      // ヘッダー行の特徴をチェック
      const nonEmptyCells = row.filter(cell => 
        cell !== null && cell !== undefined && cell !== ''
      ).length;
      
      // キーワードマッチ数と非空セル数から信頼度を計算
      const confidence = Math.min(
        (matchedKeywords.length / allKeywords.length) * 0.7 +
        (nonEmptyCells >= 3 ? 0.3 : 0),
        1.0
      );
      
      candidates.push({
        rowIndex: i,
        confidence,
        matchedKeywords
      });
    }
  }

  // 信頼度順にソート
  return candidates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * テーブル範囲を推定
 */
function estimateTableRegion(
  headerCandidate: { rowIndex: number; confidence: number; matchedKeywords: string[] },
  jsonData: any[][],
  dataDensity: { rowDensity: boolean[]; colDensity: boolean[] },
  _tableTypeKeywords: string[] = []
): TableRegion | null {
  const headerRow = headerCandidate.rowIndex;
  const row = jsonData[headerRow] as string[];
  
  if (!row || row.length === 0) return null;
  
  // 列範囲の検出
  let startCol = 0;
  let endCol = row.length - 1;
  
  // ヘッダー行の有効列範囲を検出
  for (let i = 0; i < row.length; i++) {
    if (row[i] !== null && row[i] !== undefined && row[i] !== '') {
      if (startCol === 0 && row[i]) startCol = i;
      endCol = i;
    }
  }
  
  // データ密度から列範囲を調整
  for (let i = startCol; i <= endCol && i < dataDensity.colDensity.length; i++) {
    if (!dataDensity.colDensity[i]) {
      // 空列があれば、それより前を終了列とする
      if (i > startCol + 2) {
        endCol = i - 1;
        break;
      }
    }
  }

  // 行範囲の検出
  let startRow = headerRow;
  let endRow = jsonData.length - 1;
  
  // ヘッダー行の前の空行を検出
  for (let i = headerRow - 1; i >= 0; i--) {
    if (i < dataDensity.rowDensity.length && dataDensity.rowDensity[i]) {
      startRow = i + 1;
      break;
    }
  }
  
  // ヘッダー行の後のデータ行を検出
  let consecutiveEmptyRows = 0;
  for (let i = headerRow + 1; i < jsonData.length; i++) {
    if (i < dataDensity.rowDensity.length && dataDensity.rowDensity[i]) {
      consecutiveEmptyRows = 0;
      endRow = i;
    } else {
      consecutiveEmptyRows++;
      // 連続する空行が3行以上なら、テーブル終了と判断
      if (consecutiveEmptyRows >= 3 && endRow > headerRow) {
        break;
      }
    }
  }

  // テーブルタイプの判定
  let tableType = 'unknown';
  const headerText = row.join(' ').toLowerCase();
  
  if (headerText.includes('相互連携性情報項目') || 
      headerText.includes('情報項目表') ||
      headerText.includes('相互連携')) {
    tableType = 'information-items';
  } else if (headerText.includes('国連cefact') || 
             headerText.includes('bie') || 
             headerText.includes('メッセージ辞書') ||
             headerText.includes('cefact')) {
    tableType = 'cefact-bie';
  } else if (headerText.includes('データ型') || 
             headerText.includes('コード表') ||
             headerText.includes('補足情報')) {
    tableType = 'data-type-supplement';
  } else if (headerText.includes('マッピング')) {
    tableType = 'mapping';
  } else if (headerText.includes('コード') || headerText.includes('code')) {
    tableType = 'code-definition';
  }

  // 最小サイズチェック（3行2列以上）
  if (endRow - startRow < 2 || endCol - startCol < 1) {
    return null;
  }

  // 信頼度の計算
  let confidence = headerCandidate.confidence;
  
  // テーブルサイズによる信頼度調整
  const rowCount = endRow - startRow + 1;
  const colCount = endCol - startCol + 1;
  if (rowCount >= 5 && colCount >= 3) {
    confidence = Math.min(confidence + 0.2, 1.0);
  }
  
  // テーブルタイプが特定できた場合
  if (tableType !== 'unknown') {
    confidence = Math.min(confidence + 0.1, 1.0);
  }

  return {
    startRow,
    endRow,
    startCol,
    endCol,
    headerRow,
    tableType,
    confidence,
    description: `Detected ${tableType} table`
  };
}

/**
 * 重複するテーブル領域をマージ
 */
function mergeOverlappingRegions(regions: TableRegion[]): TableRegion[] {
  if (regions.length === 0) return [];
  
  const merged: TableRegion[] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < regions.length; i++) {
    if (processed.has(i)) continue;
    
    let current = regions[i];
    processed.add(i);
    
    // 重複する領域を探す
    for (let j = i + 1; j < regions.length; j++) {
      if (processed.has(j)) continue;
      
      const other = regions[j];
      
      // 重複チェック（行範囲が50%以上重複し、列範囲も重複）
      const rowOverlap = Math.min(current.endRow, other.endRow) - 
                         Math.max(current.startRow, other.startRow) + 1;
      const currentRowSpan = current.endRow - current.startRow + 1;
      const otherRowSpan = other.endRow - other.startRow + 1;
      const minRowSpan = Math.min(currentRowSpan, otherRowSpan);
      
      const colOverlap = Math.min(current.endCol, other.endCol) - 
                         Math.max(current.startCol, other.startCol) + 1;
      
      if (rowOverlap > 0 && minRowSpan > 0 && rowOverlap / minRowSpan > 0.5 && colOverlap > 0) {
        // マージ：より信頼度の高い方を優先
        if (other.confidence > current.confidence) {
          current = other;
        }
        processed.add(j);
      }
    }
    
    merged.push(current);
  }
  
  return merged;
}

/**
 * メインのテーブル検出関数（ルールベース）
 */
export function detectTableRegions(
  worksheet: XLSX.WorkSheet,
  _sheetName: string,
  customKeywords: string[] = []
): DetectionResult {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
  
  if (!jsonData || jsonData.length === 0) {
    return {
      regions: [],
      needsAI: true,
      confidence: 0.0
    };
  }
  
  // データ密度を分析
  const dataDensity = analyzeDataDensity(jsonData);
  
  // ヘッダー候補を検出
  const headerCandidates = findHeaderCandidates(jsonData, customKeywords);
  
  if (headerCandidates.length === 0) {
    return {
      regions: [],
      needsAI: true, // ヘッダーが見つからない場合はAIが必要
      confidence: 0.0
    };
  }

  // 各ヘッダー候補からテーブル範囲を推定
  const regions: TableRegion[] = [];
  for (const candidate of headerCandidates) {
    const region = estimateTableRegion(candidate, jsonData, dataDensity, customKeywords);
    if (region) {
      regions.push(region);
    }
  }

  // 重複するテーブル領域をマージ（同じ領域が重複検出された場合）
  const mergedRegions = mergeOverlappingRegions(regions);
  
  // 全体の信頼度を計算
  const avgConfidence = mergedRegions.length > 0
    ? mergedRegions.reduce((sum, r) => sum + r.confidence, 0) / mergedRegions.length
    : 0.0;
  
  // 信頼度が0.6未満、またはテーブルが検出されない場合はAIが必要
  const needsAI = avgConfidence < 0.6 || mergedRegions.length === 0;

  return {
    regions: mergedRegions,
    needsAI,
    confidence: avgConfidence
  };
}

/**
 * テーブル領域からデータを抽出
 */
export function extractTableData(
  worksheet: XLSX.WorkSheet,
  region: TableRegion
): any[][] {
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
  
  const extracted: any[][] = [];
  
  for (let row = region.startRow; row <= region.endRow && row < jsonData.length; row++) {
    const rowData = jsonData[row] || [];
    const extractedRow: any[] = [];
    
    for (let col = region.startCol; col <= region.endCol && col < rowData.length; col++) {
      extractedRow.push(rowData[col] || '');
    }
    
    extracted.push(extractedRow);
  }
  
  return extracted;
}

