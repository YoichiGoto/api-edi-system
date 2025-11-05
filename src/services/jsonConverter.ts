import { MessageType } from '../models/Message';

/**
 * JSON変換サービス（データ構造の正規化など）
 */
class JSONConverter {
  /**
   * 業務アプリのJSONを共通EDI標準JSONに変換
   */
  normalizeToEDIStandard(jsonData: any, messageType: MessageType): any {
    // メッセージタイプに応じた正規化処理
    switch (messageType) {
      case MessageType.ORDER:
        return this.normalizeOrder(jsonData);
      case MessageType.INVOICE:
        return this.normalizeInvoice(jsonData);
      default:
        return jsonData;
    }
  }

  /**
   * 共通EDI標準JSONを業務アプリのJSONに変換
   */
  denormalizeFromEDIStandard(jsonData: any, _messageType: MessageType, targetFormat?: any): any {
    // ターゲットフォーマットが指定されている場合、その形式に変換
    if (targetFormat) {
      return this.convertToTargetFormat(jsonData, targetFormat);
    }
    return jsonData;
  }

  /**
   * 注文データの正規化
   */
  private normalizeOrder(data: any): any {
    return {
      // 共通EDI標準の注文メッセージ構造に変換
      // 実際の実装では、付表３のマッピング表を使用
      ...data,
    };
  }

  /**
   * 請求データの正規化
   */
  private normalizeInvoice(data: any): any {
    return {
      // 共通EDI標準の請求メッセージ構造に変換
      // 実際の実装では、付表３のマッピング表を使用
      ...data,
    };
  }

  /**
   * ターゲットフォーマットに変換
   */
  private convertToTargetFormat(data: any, _targetFormat: any): any {
    // ターゲットフォーマットの定義に基づいて変換
    // 実際の実装では、マッピング設定を使用
    return data;
  }

  /**
   * 日付形式をISO8601に変換
   */
  normalizeDate(date: any): string | null {
    if (!date) return null;
    
    if (date instanceof Date) {
      return date.toISOString();
    }
    
    if (typeof date === 'string') {
      // 様々な日付形式をISO8601に変換
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    
    return null;
  }

  /**
   * 数値を正規化
   */
  normalizeNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? null : num;
  }
}

// シングルトンインスタンス
export const jsonConverter = new JSONConverter();

