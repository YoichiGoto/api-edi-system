/**
 * マッピング設定のモデル
 */
export interface MappingConfig {
  id: string;
  appId: string;
  appName: string;
  messageType: string;
  fieldMappings: FieldMapping[];
  formatType: 'json' | 'xml' | 'csv';
  createdAt: Date;
  updatedAt: Date;
}

export interface FieldMapping {
  appField: string;
  ediField: string;
  ediId?: string;
  required: boolean;
  defaultValue?: any;
  dataType?: 'string' | 'number' | 'date' | 'datetime' | 'boolean' | 'code'; // データ型
  transformation?: string; // 変換ルール（関数名、条件式など）
  condition?: string; // 条件付きマッピング（JSONPath式など）
  format?: string; // フォーマット指定（日付フォーマットなど）
}

export interface MappingConfigCreateInput {
  appId: string;
  appName: string;
  messageType: string;
  fieldMappings: FieldMapping[];
  formatType?: 'json' | 'xml' | 'csv';
}

