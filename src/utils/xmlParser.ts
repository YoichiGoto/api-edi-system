import { XMLParser, XMLBuilder } from 'fast-xml-parser';

/**
 * XMLパーサーユーティリティ
 */
export class XMLParserUtil {
  private parser: XMLParser;
  private builder: XMLBuilder;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      format: true,
      indentBy: ' ',
      suppressEmptyNode: false,
    });
  }

  /**
   * XML文字列をパース
   */
  parse(xmlString: string): any {
    try {
      return this.parser.parse(xmlString);
    } catch (error: any) {
      throw new Error(`XML parsing error: ${error.message}`);
    }
  }

  /**
   * オブジェクトをXML文字列に変換
   */
  build(obj: any): string {
    try {
      return this.builder.build(obj);
    } catch (error: any) {
      throw new Error(`XML building error: ${error.message}`);
    }
  }

  /**
   * XMLが有効かチェック
   */
  isValid(xmlString: string): boolean {
    try {
      this.parser.parse(xmlString);
      return true;
    } catch {
      return false;
    }
  }
}

// シングルトンインスタンス
export const xmlParser = new XMLParserUtil();

