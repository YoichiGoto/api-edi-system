/**
 * データ型変換ユーティリティ
 */
import { formatDate, formatDateTime, parseISO8601 } from './dateFormatter';

/**
 * データ型変換関数
 */
export class TypeConverter {
  /**
   * 値を指定されたデータ型に変換
   */
  static convert(value: any, dataType?: string, format?: string): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (dataType) {
      case 'string':
        return this.convertToString(value);
      case 'number':
        return this.convertToNumber(value);
      case 'date':
        return this.convertToDate(value, format);
      case 'datetime':
        return this.convertToDateTime(value, format);
      case 'boolean':
        return this.convertToBoolean(value);
      case 'code':
        return this.convertToCode(value);
      default:
        return value;
    }
  }

  /**
   * 文字列に変換
   */
  private static convertToString(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    return String(value);
  }

  /**
   * 数値に変換
   */
  private static convertToNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      // カンマ区切りの数値を処理
      const cleaned = value.replace(/,/g, '').trim();
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        return num;
      }
    }
    throw new Error(`Cannot convert to number: ${value}`);
  }

  /**
   * 日付に変換（ISO8601形式: YYYY-MM-DD）
   */
  private static convertToDate(value: any, _format?: string): string {
    try {
      if (value instanceof Date) {
        return formatDate(value);
      }
      if (typeof value === 'string') {
        // 既にISO8601形式の場合
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        // 日時形式から日付部分を抽出
        if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
          return value.split('T')[0];
        }
        // パースしてフォーマット
        const date = parseISO8601(value);
        return formatDate(date);
      }
      throw new Error(`Invalid date value: ${value}`);
    } catch (error) {
      throw new Error(`Date conversion failed: ${error}`);
    }
  }

  /**
   * 日時に変換（ISO8601形式: YYYY-MM-DDThh:mm:ss）
   */
  private static convertToDateTime(value: any, _format?: string): string {
    try {
      if (value instanceof Date) {
        return formatDateTime(value);
      }
      if (typeof value === 'string') {
        // 既にISO8601形式の場合
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return value;
        }
        // パースしてフォーマット
        const date = parseISO8601(value);
        return formatDateTime(date);
      }
      throw new Error(`Invalid datetime value: ${value}`);
    } catch (error) {
      throw new Error(`Datetime conversion failed: ${error}`);
    }
  }

  /**
   * ブール値に変換
   */
  private static convertToBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      return lower === 'true' || lower === '1' || lower === 'yes' || lower === '○';
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    return Boolean(value);
  }

  /**
   * コード値に変換（コード定義表を参照）
   */
  private static convertToCode(value: any): string {
    // コード値は文字列として扱う
    const code = this.convertToString(value);
    
    // コード定義表での検証は、必要に応じて実装
    // 現時点では文字列として返す
    
    return code;
  }

  /**
   * 条件式を評価
   * 簡易的な条件評価（将来的にJSONPathなどを使用可能）
   */
  static evaluateCondition(condition: string, data: any): boolean {
    try {
      // 簡易的な条件評価
      // 例: "field1 === 'value1'" または "field1 > 100"
      
      // フィールド参照を値に置換（簡易実装）
      const fieldMatch = condition.match(/(\w+)\s*(===|!==|==|!=|>|<|>=|<=)\s*(.+)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const operator = fieldMatch[2];
        const expectedValue = fieldMatch[3].replace(/['"]/g, '');
        
        const actualValue = this.getFieldValue(data, fieldName);
        
        switch (operator) {
          case '===':
          case '==':
            return String(actualValue) === String(expectedValue);
          case '!==':
          case '!=':
            return String(actualValue) !== String(expectedValue);
          case '>':
            return Number(actualValue) > Number(expectedValue);
          case '<':
            return Number(actualValue) < Number(expectedValue);
          case '>=':
            return Number(actualValue) >= Number(expectedValue);
          case '<=':
            return Number(actualValue) <= Number(expectedValue);
          default:
            return false;
        }
      }
      
      return false;
    } catch (error) {
      console.warn(`Condition evaluation failed: ${condition}`, error);
      return false;
    }
  }

  /**
   * フィールド値を取得（ネスト対応）
   */
  private static getFieldValue(obj: any, path: string): any {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }

  /**
   * 変換関数を適用
   */
  static applyTransformation(value: any, transformation: string, data?: any): any {
    if (!transformation) {
      return value;
    }

    // 組み込み変換関数
    const transformations: { [key: string]: (val: any, ctx?: any) => any } = {
      'uppercase': (val: any) => String(val).toUpperCase(),
      'lowercase': (val: any) => String(val).toLowerCase(),
      'trim': (val: any) => String(val).trim(),
      'abs': (val: any) => Math.abs(Number(val)),
      'round': (val: any) => Math.round(Number(val)),
      'floor': (val: any) => Math.floor(Number(val)),
      'ceil': (val: any) => Math.ceil(Number(val)),
      'toISO8601Date': (val: any) => this.convertToDate(val),
      'toISO8601DateTime': (val: any) => this.convertToDateTime(val),
    };

    // 変換関数を実行
    if (transformations[transformation]) {
      return transformations[transformation](value, data);
    }

    // カスタム変換関数（将来的に拡張可能）
    console.warn(`Unknown transformation: ${transformation}`);
    return value;
  }
}

