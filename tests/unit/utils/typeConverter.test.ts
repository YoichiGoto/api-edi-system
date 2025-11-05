/**
 * TypeConverter ユニットテスト
 */
import { TypeConverter } from '../../../src/utils/typeConverter';

describe('TypeConverter', () => {
  describe('convert', () => {
    it('文字列に変換できる', () => {
      expect(TypeConverter.convert(123, 'string')).toBe('123');
      expect(TypeConverter.convert('  test  ', 'string')).toBe('test');
      expect(TypeConverter.convert(null, 'string')).toBe(null);
    });

    it('数値に変換できる', () => {
      expect(TypeConverter.convert('123', 'number')).toBe(123);
      expect(TypeConverter.convert('1,234', 'number')).toBe(1234);
      expect(TypeConverter.convert(123, 'number')).toBe(123);
    });

    it('日付に変換できる', () => {
      const dateStr = TypeConverter.convert('2024-01-01', 'date');
      expect(dateStr).toBe('2024-01-01');
      
      const dateObj = new Date('2024-01-01');
      const converted = TypeConverter.convert(dateObj, 'date');
      expect(converted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('日時に変換できる', () => {
      const dateStr = TypeConverter.convert('2024-01-01T12:00:00', 'datetime');
      expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('ブール値に変換できる', () => {
      expect(TypeConverter.convert('true', 'boolean')).toBe(true);
      expect(TypeConverter.convert('false', 'boolean')).toBe(false);
      expect(TypeConverter.convert('1', 'boolean')).toBe(true);
      expect(TypeConverter.convert('0', 'boolean')).toBe(false);
      expect(TypeConverter.convert('○', 'boolean')).toBe(true);
    });

    it('コード値に変換できる', () => {
      expect(TypeConverter.convert('CODE001', 'code')).toBe('CODE001');
      expect(TypeConverter.convert(123, 'code')).toBe('123');
    });
  });

  describe('evaluateCondition', () => {
    it('等価条件を評価できる', () => {
      const data = { status: 'active', count: 10 };
      expect(TypeConverter.evaluateCondition("status === 'active'", data)).toBe(true);
      expect(TypeConverter.evaluateCondition("status === 'inactive'", data)).toBe(false);
    });

    it('数値比較条件を評価できる', () => {
      const data = { count: 10 };
      expect(TypeConverter.evaluateCondition('count > 5', data)).toBe(true);
      expect(TypeConverter.evaluateCondition('count < 5', data)).toBe(false);
      expect(TypeConverter.evaluateCondition('count >= 10', data)).toBe(true);
      expect(TypeConverter.evaluateCondition('count <= 10', data)).toBe(true);
    });
  });

  describe('applyTransformation', () => {
    it('uppercase変換ができる', () => {
      expect(TypeConverter.applyTransformation('hello', 'uppercase')).toBe('HELLO');
    });

    it('lowercase変換ができる', () => {
      expect(TypeConverter.applyTransformation('HELLO', 'lowercase')).toBe('hello');
    });

    it('trim変換ができる', () => {
      expect(TypeConverter.applyTransformation('  hello  ', 'trim')).toBe('hello');
    });

    it('abs変換ができる', () => {
      expect(TypeConverter.applyTransformation(-10, 'abs')).toBe(10);
      expect(TypeConverter.applyTransformation(10, 'abs')).toBe(10);
    });

    it('round変換ができる', () => {
      expect(TypeConverter.applyTransformation(10.5, 'round')).toBe(11);
      expect(TypeConverter.applyTransformation(10.4, 'round')).toBe(10);
    });

    it('floor変換ができる', () => {
      expect(TypeConverter.applyTransformation(10.9, 'floor')).toBe(10);
    });

    it('ceil変換ができる', () => {
      expect(TypeConverter.applyTransformation(10.1, 'ceil')).toBe(11);
    });
  });
});

