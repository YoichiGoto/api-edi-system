import * as fs from 'fs';
import * as path from 'path';

// 型定義（scripts/preprocessからインポートしない）
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
 * JSONデータを読み込むユーティリティ
 */
class DataLoader {
  private mappings: Map<string, MappingTable[]> = new Map(); // 複数テーブル対応
  private codeDefinitions: Map<string, CodeDefinition[]> = new Map(); // 複数テーブル対応
  private informationItems: Map<string, InformationItemTable[]> = new Map(); // 複数テーブル対応
  private loaded = false;

  /**
   * すべてのデータを読み込む
   */
  loadAll(): void {
    if (this.loaded) {
      return;
    }

    this.loadMappings();
    this.loadCodeDefinitions();
    this.loadInformationItems();
    this.loaded = true;
  }

  /**
   * マッピングデータを読み込む
   */
  private loadMappings(): void {
    const mappingsDir = path.join(__dirname, '../data/mappings');
    
    if (!fs.existsSync(mappingsDir)) {
      console.warn('Mappings directory not found. Run preprocessing first.');
      return;
    }

    const files = fs.readdirSync(mappingsDir).filter(f => f.endsWith('.json') && f !== 'mappings.json');
    
    for (const file of files) {
      try {
        const filePath = path.join(mappingsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data: MappingTable = JSON.parse(content);
        
        // 複数テーブル対応：同じmessageTypeのテーブルを配列で管理
        if (!this.mappings.has(data.messageType)) {
          this.mappings.set(data.messageType, []);
        }
        this.mappings.get(data.messageType)!.push(data);
        
        const tableInfo = data.tableType ? ` (${data.tableType})` : '';
        console.log(`Loaded mapping: ${data.messageType}${tableInfo} (${data.fields.length} fields)`);
      } catch (error) {
        console.error(`Error loading mapping file ${file}:`, error);
      }
    }
  }

  /**
   * コード定義データを読み込む
   */
  private loadCodeDefinitions(): void {
    const codeDefDir = path.join(__dirname, '../data/code-definitions');
    
    if (!fs.existsSync(codeDefDir)) {
      console.warn('Code definitions directory not found. Run preprocessing first.');
      return;
    }

    const files = fs.readdirSync(codeDefDir).filter(f => f.endsWith('.json') && f !== 'code-definitions.json');
    
    for (const file of files) {
      try {
        const filePath = path.join(codeDefDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data: CodeDefinition = JSON.parse(content);
        
        // 複数テーブル対応：同じcodeTypeのテーブルを配列で管理
        if (!this.codeDefinitions.has(data.codeType)) {
          this.codeDefinitions.set(data.codeType, []);
        }
        this.codeDefinitions.get(data.codeType)!.push(data);
        
        const tableInfo = data.tableType ? ` (${data.tableType})` : '';
        console.log(`Loaded code definition: ${data.codeType}${tableInfo} (${data.codes.length} codes)`);
      } catch (error) {
        console.error(`Error loading code definition file ${file}:`, error);
      }
    }
  }

  /**
   * 情報項目データを読み込む
   */
  private loadInformationItems(): void {
    const infoItemsDir = path.join(__dirname, '../data/information-items');
    
    if (!fs.existsSync(infoItemsDir)) {
      console.warn('Information items directory not found. Run preprocessing first.');
      return;
    }

    const files = fs.readdirSync(infoItemsDir).filter(f => f.endsWith('.json') && f !== 'information-items.json');
    
    for (const file of files) {
      try {
        const filePath = path.join(infoItemsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data: InformationItemTable = JSON.parse(content);
        
        // 複数テーブル対応：同じmessageTypeのテーブルを配列で管理
        if (!this.informationItems.has(data.messageType)) {
          this.informationItems.set(data.messageType, []);
        }
        this.informationItems.get(data.messageType)!.push(data);
        
        const tableInfo = data.tableType ? ` (${data.tableType})` : '';
        console.log(`Loaded information items: ${data.messageType}${tableInfo} (${data.items.length} items)`);
      } catch (error) {
        console.error(`Error loading information items file ${file}:`, error);
      }
    }
  }

  /**
   * マッピングテーブルを取得（複数テーブル対応）
   */
  getMapping(messageType: string, tableType?: string): MappingTable | undefined {
    if (!this.loaded) {
      this.loadAll();
    }
    const tables = this.mappings.get(messageType);
    if (!tables || tables.length === 0) {
      return undefined;
    }
    
    // tableTypeが指定されている場合は、該当するテーブルを返す
    if (tableType) {
      return tables.find(t => t.tableType === tableType);
    }
    
    // デフォルトは最初のテーブルを返す（mappingタイプを優先）
    const mappingTable = tables.find(t => t.tableType === 'mapping');
    return mappingTable || tables[0];
  }

  /**
   * すべてのマッピングテーブルを取得
   */
  getAllMappings(): MappingTable[] {
    if (!this.loaded) {
      this.loadAll();
    }
    return Array.from(this.mappings.values()).flat();
  }

  /**
   * 指定されたメッセージタイプのすべてのマッピングテーブルを取得
   */
  getMappingsByMessageType(messageType: string): MappingTable[] {
    if (!this.loaded) {
      this.loadAll();
    }
    return this.mappings.get(messageType) || [];
  }

  /**
   * コード定義を取得（複数テーブル対応）
   */
  getCodeDefinition(codeType: string, tableType?: string): CodeDefinition | undefined {
    if (!this.loaded) {
      this.loadAll();
    }
    const tables = this.codeDefinitions.get(codeType);
    if (!tables || tables.length === 0) {
      return undefined;
    }
    
    // tableTypeが指定されている場合は、該当するテーブルを返す
    if (tableType) {
      return tables.find(t => t.tableType === tableType);
    }
    
    // デフォルトは最初のテーブルを返す
    return tables[0];
  }

  /**
   * すべてのコード定義を取得
   */
  getAllCodeDefinitions(): CodeDefinition[] {
    if (!this.loaded) {
      this.loadAll();
    }
    return Array.from(this.codeDefinitions.values()).flat();
  }

  /**
   * コード値でコード定義を検索
   */
  findCodeByValue(codeType: string, code: string, tableType?: string): any | undefined {
    const codeDef = this.getCodeDefinition(codeType, tableType);
    if (!codeDef) {
      return undefined;
    }
    return codeDef.codes.find(c => c.code === code);
  }

  /**
   * 情報項目テーブルを取得（複数テーブル対応）
   */
  getInformationItems(messageType: string, tableType?: string): InformationItemTable | undefined {
    if (!this.loaded) {
      this.loadAll();
    }
    const tables = this.informationItems.get(messageType);
    if (!tables || tables.length === 0) {
      return undefined;
    }
    
    // tableTypeが指定されている場合は、該当するテーブルを返す
    if (tableType) {
      return tables.find(t => t.tableType === tableType);
    }
    
    // デフォルトは最初のテーブルを返す
    return tables[0];
  }

  /**
   * すべての情報項目テーブルを取得
   */
  getAllInformationItems(): InformationItemTable[] {
    if (!this.loaded) {
      this.loadAll();
    }
    return Array.from(this.informationItems.values()).flat();
  }

  /**
   * 指定されたメッセージタイプのすべての情報項目テーブルを取得
   */
  getInformationItemsByMessageType(messageType: string): InformationItemTable[] {
    if (!this.loaded) {
      this.loadAll();
    }
    return this.informationItems.get(messageType) || [];
  }
}

// シングルトンインスタンス
export const dataLoader = new DataLoader();

