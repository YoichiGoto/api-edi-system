/**
 * DateFormatter ユニットテスト
 */
import { formatDate, formatTime, formatDateTime, parseISO8601 } from '../../../src/utils/dateFormatter';

describe('DateFormatter', () => {
  describe('formatDate', () => {
    it('DateオブジェクトをISO8601日付形式に変換できる', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-01-01');
    });

    it('文字列をISO8601日付形式に変換できる', () => {
      const result = formatDate('2024-01-01T12:00:00Z');
      expect(result).toBe('2024-01-01');
    });

    it('無効な日付でエラーを投げる', () => {
      expect(() => formatDate('invalid-date')).toThrow();
    });
  });

  describe('formatTime', () => {
    it('DateオブジェクトをISO8601時刻形式に変換できる', () => {
      const date = new Date('2024-01-01T12:30:45Z');
      const result = formatTime(date);
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('無効な日付でエラーを投げる', () => {
      expect(() => formatTime('invalid-date')).toThrow();
    });
  });

  describe('formatDateTime', () => {
    it('DateオブジェクトをISO8601日時形式に変換できる', () => {
      const date = new Date('2024-01-01T12:30:45Z');
      const result = formatDateTime(date);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it('無効な日付でエラーを投げる', () => {
      expect(() => formatDateTime('invalid-date')).toThrow();
    });
  });

  describe('parseISO8601', () => {
    it('ISO8601形式の文字列をDateオブジェクトに変換できる', () => {
      const result = parseISO8601('2024-01-01T12:00:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // 0-indexed
      expect(result.getDate()).toBe(1);
    });

    it('無効な文字列でエラーを投げる', () => {
      expect(() => parseISO8601('invalid-date')).toThrow();
    });
  });
});

