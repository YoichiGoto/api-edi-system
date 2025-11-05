/**
 * Mapper ユニットテスト
 */
import { mapper } from '../../../src/services/mapper';
import { MessageType } from '../../../src/models/Message';
import { FieldMapping } from '../../../src/models/MappingConfig';

describe('Mapper', () => {
  const mockMappingConfig = {
    id: 'test-id',
    appId: 'test-app-id',
    appName: 'Test App',
    messageType: 'order',
    formatType: 'json' as const,
    fieldMappings: [
      {
        appField: 'orderNumber',
        ediField: 'header.orderNumber',
        required: true,
        dataType: 'string' as const,
      },
      {
        appField: 'orderDate',
        ediField: 'header.orderDate',
        required: true,
        dataType: 'date' as const,
      },
      {
        appField: 'totalAmount',
        ediField: 'header.totalAmount',
        required: true,
        dataType: 'number' as const,
      },
      {
        appField: 'currency',
        ediField: 'header.currency',
        required: true,
        defaultValue: 'JPY',
        dataType: 'string' as const,
      },
    ] as FieldMapping[],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('mapToEDIStandard', () => {
    it('マッピング設定を使用して変換できる', () => {
      const appData = {
        orderNumber: 'ORD-001',
        orderDate: '2024-01-01',
        totalAmount: '10000',
      };

      const result = mapper.mapToEDIStandard(appData, MessageType.ORDER, mockMappingConfig);

      expect(result.header.orderNumber).toBe('ORD-001');
      expect(result.header.orderDate).toBe('2024-01-01');
      expect(result.header.totalAmount).toBe(10000);
      expect(result.header.currency).toBe('JPY'); // デフォルト値
    });

    it('条件付きマッピングを適用できる', () => {
      const mappingWithCondition = {
        ...mockMappingConfig,
        fieldMappings: [
          ...mockMappingConfig.fieldMappings,
          {
            appField: 'discountAmount',
            ediField: 'header.discount',
            required: false,
            dataType: 'number' as const,
            condition: "hasDiscount === 'true'",
          },
        ] as FieldMapping[],
      };

      const appData = {
        orderNumber: 'ORD-001',
        orderDate: '2024-01-01',
        totalAmount: '10000',
        hasDiscount: 'true',
        discountAmount: '1000',
      };

      const result = mapper.mapToEDIStandard(appData, MessageType.ORDER, mappingWithCondition);
      expect(result.header.discount).toBe(1000);
    });

    it('変換関数を適用できる', () => {
      const mappingWithTransformation = {
        ...mockMappingConfig,
        fieldMappings: [
          {
            appField: 'orderNumber',
            ediField: 'header.orderNumber',
            required: true,
            transformation: 'uppercase',
          },
        ] as FieldMapping[],
      };

      const appData = {
        orderNumber: 'ord-001',
      };

      const result = mapper.mapToEDIStandard(appData, MessageType.ORDER, mappingWithTransformation);
      expect(result.header.orderNumber).toBe('ORD-001');
    });
  });

  describe('mapFromEDIStandard', () => {
    it('逆マッピングで変換できる', () => {
      const ediData = {
        header: {
          orderNumber: 'ORD-001',
          orderDate: '2024-01-01',
          totalAmount: 10000,
          currency: 'JPY',
        },
      };

      const result = mapper.mapFromEDIStandard(ediData, MessageType.ORDER, mockMappingConfig);

      expect(result.orderNumber).toBe('ORD-001');
      expect(result.orderDate).toBe('2024-01-01');
      expect(result.totalAmount).toBe(10000);
      expect(result.currency).toBe('JPY');
    });
  });
});

