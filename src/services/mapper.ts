import { dataLoader } from '../utils/dataLoader';
import { FieldMapping, MappingConfig } from '../models/MappingConfig';
import { MessageType } from '../models/Message';
import { TypeConverter } from '../utils/typeConverter';

/**
 * マッピングサービス
 */
class Mapper {
  /**
   * 業務アプリ固有フォーマットを共通EDI標準フォーマットに変換
   */
  mapToEDIStandard(
    appData: any,
    messageType: MessageType,
    mappingConfig?: MappingConfig
  ): any {
    // マッピング設定が指定されている場合はそれを使用
    if (mappingConfig) {
      return this.applyMapping(appData, mappingConfig.fieldMappings);
    }

    // デフォルトのマッピングテーブルを使用（mappingタイプを優先）
    const mappingTable = dataLoader.getMapping(messageType, 'mapping');
    if (!mappingTable) {
      // mappingタイプが見つからない場合は、最初のテーブルを試す
      const firstTable = dataLoader.getMapping(messageType);
      if (!firstTable) {
        console.warn(`No mapping table found for message type: ${messageType}`);
        return appData;
      }
      
      // マッピングテーブルからフィールドマッピングを生成
      const fieldMappings: FieldMapping[] = firstTable.fields.map(field => ({
        appField: field.appField,
        ediField: field.ediField,
        ediId: field.ediId,
        required: field.required,
      }));
      
      return this.applyMapping(appData, fieldMappings);
    }

    // マッピングテーブルからフィールドマッピングを生成
    const fieldMappings: FieldMapping[] = mappingTable.fields.map(field => ({
      appField: field.appField,
      ediField: field.ediField,
      ediId: field.ediId,
      required: field.required,
    }));

    return this.applyMapping(appData, fieldMappings);
  }

  /**
   * 共通EDI標準フォーマットを業務アプリ固有フォーマットに変換
   */
  mapFromEDIStandard(
    ediData: any,
    messageType: MessageType,
    mappingConfig?: MappingConfig
  ): any {
    // マッピング設定が指定されている場合はそれを使用（逆マッピング）
    if (mappingConfig) {
      return this.applyReverseMapping(ediData, mappingConfig.fieldMappings);
    }

    // デフォルトのマッピングテーブルを使用（逆マッピング、mappingタイプを優先）
    const mappingTable = dataLoader.getMapping(messageType, 'mapping');
    if (!mappingTable) {
      // mappingタイプが見つからない場合は、最初のテーブルを試す
      const firstTable = dataLoader.getMapping(messageType);
      if (!firstTable) {
        console.warn(`No mapping table found for message type: ${messageType}`);
        return ediData;
      }
      
      const fieldMappings: FieldMapping[] = firstTable.fields.map(field => ({
        appField: field.appField,
        ediField: field.ediField,
        ediId: field.ediId,
        required: field.required,
      }));
      
      return this.applyReverseMapping(ediData, fieldMappings);
    }

    const fieldMappings: FieldMapping[] = mappingTable.fields.map(field => ({
      appField: field.appField,
      ediField: field.ediField,
      ediId: field.ediId,
      required: field.required,
    }));

    return this.applyReverseMapping(ediData, fieldMappings);
  }

  /**
   * マッピングを適用（データ型変換、条件付きマッピング対応）
   */
  private applyMapping(data: any, mappings: FieldMapping[]): any {
    const result: any = {};

    for (const mapping of mappings) {
      // 条件付きマッピング: 条件が満たされない場合はスキップ
      if (mapping.condition) {
        const conditionMet = TypeConverter.evaluateCondition(mapping.condition, data);
        if (!conditionMet) {
          continue;
        }
      }

      let sourceValue = this.getNestedValue(data, mapping.appField);
      
      // 値が存在する場合
      if (sourceValue !== undefined && sourceValue !== null) {
        // データ型変換
        if (mapping.dataType) {
          try {
            sourceValue = TypeConverter.convert(sourceValue, mapping.dataType, mapping.format);
          } catch (error: any) {
            console.warn(`Type conversion failed for ${mapping.appField}:`, error.message);
            // 変換失敗時は元の値を使用
          }
        }

        // 変換関数の適用
        if (mapping.transformation) {
          try {
            sourceValue = TypeConverter.applyTransformation(sourceValue, mapping.transformation, data);
          } catch (error: any) {
            console.warn(`Transformation failed for ${mapping.appField}:`, error.message);
          }
        }

        this.setNestedValue(result, mapping.ediField, sourceValue);
      } else if (mapping.required) {
        // 必須フィールドでデフォルト値がある場合
        if (mapping.defaultValue !== undefined) {
          let defaultValue = mapping.defaultValue;
          
          // デフォルト値もデータ型変換を適用
          if (mapping.dataType) {
            try {
              defaultValue = TypeConverter.convert(defaultValue, mapping.dataType, mapping.format);
            } catch (error) {
              // デフォルト値の変換失敗は無視
            }
          }
          
          this.setNestedValue(result, mapping.ediField, defaultValue);
        } else {
          // 必須フィールドが見つからない場合
          console.warn(`Required field not found: ${mapping.appField}`);
        }
      }
    }

    return result;
  }

  /**
   * 逆マッピングを適用（データ型変換対応）
   */
  private applyReverseMapping(data: any, mappings: FieldMapping[]): any {
    const result: any = {};

    for (const mapping of mappings) {
      // 条件付きマッピング: 条件が満たされない場合はスキップ
      if (mapping.condition) {
        const conditionMet = TypeConverter.evaluateCondition(mapping.condition, data);
        if (!conditionMet) {
          continue;
        }
      }

      let sourceValue = this.getNestedValue(data, mapping.ediField);
      
      // 値が存在する場合
      if (sourceValue !== undefined && sourceValue !== null) {
        // データ型変換（逆変換の場合は、EDI標準から業務アプリ形式へ）
        // 必要に応じて逆変換ロジックを実装
        if (mapping.transformation) {
          try {
            sourceValue = TypeConverter.applyTransformation(sourceValue, mapping.transformation, data);
          } catch (error: any) {
            console.warn(`Transformation failed for ${mapping.ediField}:`, error.message);
          }
        }

        this.setNestedValue(result, mapping.appField, sourceValue);
      } else if (mapping.required && mapping.defaultValue !== undefined) {
        // デフォルト値の適用
        let defaultValue = mapping.defaultValue;
        if (mapping.dataType) {
          try {
            defaultValue = TypeConverter.convert(defaultValue, mapping.dataType, mapping.format);
          } catch (error) {
            // デフォルト値の変換失敗は無視
          }
        }
        this.setNestedValue(result, mapping.appField, defaultValue);
      }
    }

    return result;
  }

  /**
   * ネストされたオブジェクトから値を取得（ドット記法対応）
   */
  private getNestedValue(obj: any, path: string): any {
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
   * ネストされたオブジェクトに値を設定（ドット記法対応）
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}

// シングルトンインスタンス
export const mapper = new Mapper();

