/**
 * コード定義のモデル
 */
export interface CodeDefinitionModel {
  id: string;
  codeType: string;
  code: string;
  codeName: string;
  codeNameEn?: string;
  description?: string;
  internationalCode?: string;
  internationalCodeName?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CodeDefinitionQuery {
  codeType?: string;
  code?: string;
  category?: string;
}

