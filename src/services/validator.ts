import { XMLParser } from 'fast-xml-parser';
import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * XMLスキーマバリデーションサービス
 */
class XMLValidator {
  private parser: XMLParser;
  private schemas: Map<string, string> = new Map(); // XMLスキーマの内容を保存

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
    });
    
    // 起動時にXMLスキーマを自動読み込み
    this.loadAllSchemas();
  }

  /**
   * すべてのXMLスキーマを読み込む
   */
  private loadAllSchemas(): void {
    const schemasDir = path.join(__dirname, '../schemas/xml');
    
    if (!fs.existsSync(schemasDir)) {
      console.warn(`XML schemas directory not found: ${schemasDir}`);
      console.warn('XML schema validation will be limited. Please download schemas from:');
      console.warn('  https://tsunagu-cons.jp/technicalinformation/smeedixml_sample/');
      return;
    }

    // スキーマファイルのマッピング
    const schemaMapping: { [key: string]: string } = {
      'order': 'SMEOrder.xsd',
      'order_response': 'SMEOrderResponse.xsd',
      'quotation': 'SMEQuotation.xsd',
      'quotation_response': 'SMEQuotationResponse.xsd',
      'despatch_advice': 'SMEDespatchAdvice.xsd',
      'receiving_advice': 'SMEReceivingAdvice.xsd',
      'invoice': 'SMEInvoice.xsd',
      'consolidated_invoice': 'SMEConsolidatedInvoice.xsd',
      'self_invoice': 'SMESelfInvoice.xsd',
      'consolidated_self_invoice': 'SMEConsolidatedSelfInvoice.xsd',
      'self_invoice_response': 'SMESelfInvoiceResponse.xsd',
      'consolidated_self_invoice_response': 'SMEConsolidatedSelfInvoiceResponse.xsd',
      'remittance_advice': 'SMERemittanceAdvaice.xsd',
      'demand_forecast': 'SMESchedulingDemandForcast.xsd',
      'supply_instruction': 'SMESchedulingSupplyInstruction.xsd',
    };

    // 各スキーマファイルを読み込む
    for (const [messageType, fileName] of Object.entries(schemaMapping)) {
      const schemaPath = path.join(schemasDir, fileName);
      this.loadSchema(messageType, schemaPath);
    }
  }

  /**
   * XMLスキーマを読み込む
   */
  loadSchema(schemaName: string, schemaPath: string): void {
    try {
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        this.schemas.set(schemaName, schemaContent);
        console.log(`Loaded XML schema: ${schemaName} (${path.basename(schemaPath)})`);
      } else {
        console.warn(`XML schema file not found: ${schemaPath}`);
      }
    } catch (error) {
      console.error(`Error loading XML schema ${schemaName}:`, error);
    }
  }

  /**
   * XMLをパースしてバリデーション
   */
  validateXML(xmlString: string, schemaName?: string): { valid: boolean; errors: string[]; data?: any } {
    const errors: string[] = [];

    try {
      // XMLパース
      const data = this.parser.parse(xmlString);

      // 基本的な構造チェック
      if (!data || typeof data !== 'object') {
        errors.push('Invalid XML structure');
        return { valid: false, errors };
      }

      // スキーマ名が指定されている場合、スキーマチェック
      if (schemaName && this.schemas.has(schemaName)) {
        // スキーマが存在する場合は、基本的な構造チェックを強化
        // 本格的なXSD検証は、将来的にlibxmljsなどのライブラリで実装可能
        const schema = this.schemas.get(schemaName);
        
        // 簡易的な検証：名前空間の確認
        if (schema && !xmlString.includes('urn:un:unece:uncefact')) {
          errors.push('XML namespace may not match SME Common EDI standard');
        }
      } else if (schemaName) {
        // スキーマが指定されているが見つからない場合
        errors.push(`XML schema not loaded: ${schemaName}`);
        console.warn(`Schema ${schemaName} not found. XML validation may be incomplete.`);
      }

      return { valid: errors.length === 0, errors, data };
    } catch (error: any) {
      errors.push(`XML parsing error: ${error.message}`);
      return { valid: false, errors };
    }
  }

  /**
   * XMLが有効な構造かチェック
   */
  isValidXML(xmlString: string): boolean {
    try {
      this.parser.parse(xmlString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 読み込まれたスキーマの一覧を取得
   */
  getLoadedSchemas(): string[] {
    return Array.from(this.schemas.keys());
  }
}

/**
 * JSONスキーマバリデーションサービス
 */
class JSONValidator {
  private ajv: Ajv;
  private schemas: Map<string, any> = new Map();

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    
    // 起動時にJSONスキーマを自動読み込み
    this.loadAllSchemas();
  }

  /**
   * すべてのJSONスキーマを読み込む
   */
  private loadAllSchemas(): void {
    const schemasDir = path.join(__dirname, '../schemas/json');
    
    if (!fs.existsSync(schemasDir)) {
      console.warn(`JSON schemas directory not found: ${schemasDir}`);
      return;
    }

    // スキーマファイルのマッピング
    const schemaMapping: { [key: string]: string } = {
      'order': 'order.schema.json',
      'invoice': 'invoice.schema.json',
    };

    // 各スキーマファイルを読み込む
    for (const [schemaName, fileName] of Object.entries(schemaMapping)) {
      const schemaPath = path.join(schemasDir, fileName);
      this.loadSchema(schemaName, schemaPath);
    }
  }

  /**
   * JSONスキーマを読み込む
   */
  loadSchema(schemaName: string, schemaPath: string): void {
    try {
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
        const schema = JSON.parse(schemaContent);
        this.ajv.addSchema(schema, schemaName);
        this.schemas.set(schemaName, schema);
        console.log(`Loaded JSON schema: ${schemaName}`);
      } else {
        console.warn(`JSON schema file not found: ${schemaPath}`);
      }
    } catch (error) {
      console.error(`Error loading JSON schema ${schemaName}:`, error);
    }
  }

  /**
   * JSONデータをバリデーション
   */
  validateJSON(data: any, schemaName: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.schemas.has(schemaName)) {
      errors.push(`Schema not found: ${schemaName}`);
      return { valid: false, errors };
    }

    const validate = this.ajv.getSchema(schemaName);
    if (!validate) {
      errors.push(`Schema validation function not found: ${schemaName}`);
      return { valid: false, errors };
    }

    // validate関数は同期または非同期の可能性があるため、型チェック
    const result = validate(data);
    const isValid = typeof result === 'boolean' ? result : false;
    
    if (!isValid && validate.errors) {
      errors.push(...validate.errors.map(err => `${err.instancePath}: ${err.message}`));
    }

    return { valid: isValid, errors };
  }
}

// シングルトンインスタンス
export const xmlValidator = new XMLValidator();
export const jsonValidator = new JSONValidator();
