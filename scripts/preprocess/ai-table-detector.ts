// import * as fs from 'fs';
// import * as path from 'path';

export interface AITableRegion {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  tableType: string;
  description?: string;
}

/**
 * Gemini APIを使用してテーブル領域を検出（フォールバック用）
 * 最小限の使用：信頼度が低い領域のみを確認
 */
export async function detectTableRegionsWithAI(
  _excelPath: string,
  sheetName: string,
  lowConfidenceRegions: Array<{ startRow: number; endRow: number; startCol: number; endCol: number }>,
  apiKey?: string
): Promise<AITableRegion[]> {
  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY not set. Skipping AI detection.');
    return [];
  }

  if (lowConfidenceRegions.length === 0) {
    return [];
  }

  try {
    // 低信頼度領域のみを部分的に確認
    // 実際の実装では、Excelシートの該当領域を画像化して送信
    // ここでは簡易的な実装例を示す
    
    const prompt = `以下のExcelシートの特定領域について、テーブル構造を分析してください。

シート名: ${sheetName}
確認領域:
${lowConfidenceRegions.map((region, idx) => 
  `領域${idx + 1}: 行${region.startRow + 1}-${region.endRow + 1}, 列${region.startCol + 1}-${region.endCol + 1}`
).join('\n')}

各領域について、以下の情報をJSON形式で返してください：
- startRow: テーブルの開始行（1始まり）
- endRow: テーブルの終了行（1始まり）
- startCol: テーブルの開始列（1始まり、A列=1）
- endCol: テーブルの終了列（1始まり）
- tableType: テーブルの種類（information-items, cefact-bie, data-type-supplement, mapping, code-definition, unknown）
- description: テーブルの説明

JSON配列形式で返答してください。例:
[
  {
    "startRow": 15,
    "endRow": 39,
    "startCol": 1,
    "endCol": 11,
    "tableType": "information-items",
    "description": "相互連携性情報項目表"
  }
]`;

    // Gemini API呼び出し
    const response = await callGeminiAPI(geminiApiKey, prompt);
    
    // パースして返す
    return parseAIResponse(response);
    
  } catch (error) {
    console.error('Error in AI table detection:', error);
    return [];
  }
}

/**
 * Gemini API呼び出し
 */
async function callGeminiAPI(
  apiKey: string,
  prompt: string
): Promise<string> {
  try {
    // @google/generative-ai パッケージを使用
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // テキストのみの分析の場合は gemini-pro を使用
    // 画像分析が必要な場合は gemini-pro-vision を使用
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    throw error;
  }
}

/**
 * AI応答をパースしてAITableRegionに変換
 */
function parseAIResponse(response: string): AITableRegion[] {
  try {
    // JSON部分を抽出（マークダウンコードブロックからJSONを抽出）
    let jsonText = response.trim();
    
    // コードブロックを除去
    if (jsonText.startsWith('```')) {
      const lines = jsonText.split('\n');
      lines.shift(); // 最初の```を削除
      if (lines[lines.length - 1].trim() === '```') {
        lines.pop(); // 最後の```を削除
      }
      jsonText = lines.join('\n');
    }
    
    // JSONパース
    const jsonData = JSON.parse(jsonText);
    
    if (!Array.isArray(jsonData)) {
      return [];
    }
    
    return jsonData.map((item: any) => ({
      startRow: item.startRow || 0,
      endRow: item.endRow || 0,
      startCol: item.startCol || 0,
      endCol: item.endCol || 0,
      tableType: item.tableType || 'unknown',
      description: item.description
    }));
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Response text:', response);
    return [];
  }
}

