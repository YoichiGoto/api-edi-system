import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { MessageType } from '../models/Message';

/**
 * XML変換サービス
 */
class XMLConverter {
  private parser: XMLParser;
  private builder: XMLBuilder;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
      alwaysCreateTextNode: false,
      isArray: (name) => {
        // 配列として扱う要素名のリスト
        const arrayElements = [
          'IncludedCIOLSupplyChainTradeLineItem',
          'SpecifiedTradeProduct',
          'ApplicableTradeTax',
        ];
        return arrayElements.includes(name);
      },
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
   * JSONをXMLに変換
   */
  jsonToXML(jsonData: any, messageType: MessageType): string {
    try {
      // メッセージタイプに応じた名前空間とルート要素を設定
      // const rootElement = this.getRootElement(messageType);
      // const namespace = this.getNamespace(messageType);

      // JSONデータをXML構造に変換
      const xmlObject = this.transformJSONToXMLStructure(jsonData, messageType);

      // XMLを生成
      const xml = this.builder.build(xmlObject);

      // 名前空間とXML宣言を追加
      return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
    } catch (error: any) {
      throw new Error(`JSON to XML conversion error: ${error.message}`);
    }
  }

  /**
   * XMLをJSONに変換
   */
  xmlToJSON(xmlString: string): any {
    try {
      const jsonData = this.parser.parse(xmlString);
      return this.transformXMLToJSONStructure(jsonData);
    } catch (error: any) {
      throw new Error(`XML to JSON conversion error: ${error.message}`);
    }
  }

  // メッセージタイプからルート要素名を取得（将来使用）
  // private getRootElement(messageType: MessageType): string {
  //   const rootElements: Record<MessageType, string> = {
  //     [MessageType.ORDER]: 'SMEOrder',
  //     [MessageType.ORDER_RESPONSE]: 'SMEOrderResponse',
  //     [MessageType.INVOICE]: 'SMEInvoice',
  //     [MessageType.CONSOLIDATED_INVOICE]: 'SMEConsolidatedInvoice',
  //     [MessageType.QUOTATION]: 'SMEQuotation',
  //     [MessageType.QUOTATION_RESPONSE]: 'SMEQuotationResponse',
  //     [MessageType.DESPATCH_ADVICE]: 'SMEDespatchAdvice',
  //     [MessageType.RECEIVING_ADVICE]: 'SMEReceivingAdvice',
  //     [MessageType.SELF_INVOICE]: 'SMESelfInvoice',
  //     [MessageType.CONSOLIDATED_SELF_INVOICE]: 'SMEConsolidatedSelfInvoice',
  //     [MessageType.SELF_INVOICE_RESPONSE]: 'SMESelfInvoiceResponse',
  //     [MessageType.CONSOLIDATED_SELF_INVOICE_RESPONSE]: 'SMEConsolidatedSelfInvoiceResponse',
  //     [MessageType.REMITTANCE_ADVICE]: 'SMERemittanceAdvaice',
  //     [MessageType.DEMAND_FORECAST]: 'SMESchedulingDemandForcast',
  //     [MessageType.SUPPLY_INSTRUCTION]: 'SMESchedulingSupplyInstruction',
  //   };
  //   return rootElements[messageType] || 'CrossIndustryInvoice';
  // }

  /**
   * メッセージタイプから名前空間を取得
   */
  private getNamespace(_messageType: MessageType): string {
    return 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100';
  }

  /**
   * JSONデータをXML構造に変換
   */
  private transformJSONToXMLStructure(jsonData: any, messageType: MessageType): any {
    // 基本的な変換ロジック
    // 実際の実装では、中小企業共通EDI標準のXML構造に合わせて詳細な変換を行う
    return {
      '@_xmlns': this.getNamespace(messageType),
      '@_xmlns:qdt': 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100',
      '@_xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
      ...jsonData,
    };
  }

  /**
   * XML構造をJSONデータに変換
   */
  private transformXMLToJSONStructure(xmlData: any): any {
    // 属性（@_で始まる）を処理
    const result: any = {};
    
    for (const [key, value] of Object.entries(xmlData)) {
      if (key.startsWith('@_')) {
        // 属性は無視または特別な処理
        continue;
      } else if (key === '#text') {
        // テキストノード
        return value;
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }
}

// シングルトンインスタンス
export const xmlConverter = new XMLConverter();

