/**
 * EDIメッセージのモデル
 */
export enum MessageType {
  QUOTATION = 'quotation',
  QUOTATION_RESPONSE = 'quotation_response',
  ORDER = 'order',
  ORDER_RESPONSE = 'order_response',
  DESPATCH_ADVICE = 'despatch_advice',
  RECEIVING_ADVICE = 'receiving_advice',
  INVOICE = 'invoice',
  CONSOLIDATED_INVOICE = 'consolidated_invoice',
  SELF_INVOICE = 'self_invoice',
  CONSOLIDATED_SELF_INVOICE = 'consolidated_self_invoice',
  SELF_INVOICE_RESPONSE = 'self_invoice_response',
  CONSOLIDATED_SELF_INVOICE_RESPONSE = 'consolidated_self_invoice_response',
  REMITTANCE_ADVICE = 'remittance_advice',
  DEMAND_FORECAST = 'demand_forecast',
  SUPPLY_INSTRUCTION = 'supply_instruction',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  ERROR = 'error',
  PROCESSED = 'processed',
}

export interface Message {
  id: string;
  messageType: MessageType;
  senderId: string;
  receiverId?: string; // オプショナル（受信者が不明な場合がある）
  status: MessageStatus;
  data: any; // JSONデータ
  xmlData?: string; // XML形式のデータ
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

export interface MessageCreateInput {
  messageType: MessageType;
  senderId: string;
  receiverId: string;
  data: any;
}

