/**
 * 日付・時刻フォーマットユーティリティ
 * ISO8601形式に準拠
 */

/**
 * 日付をISO8601形式に変換
 */
export function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 時刻をISO8601形式に変換
 */
export function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 日時をISO8601形式に変換
 */
export function formatDateTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date');
  }

  const dateStr = formatDate(d);
  const timeStr = formatTime(d);

  return `${dateStr}T${timeStr}`;
}

/**
 * ISO8601形式の文字列をDateオブジェクトに変換
 */
export function parseISO8601(dateString: string): Date {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO8601 date string: ${dateString}`);
  }

  return date;
}

