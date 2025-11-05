/**
 * ユーザーとアプリケーションのモデル
 */
export interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  API_USER = 'api_user',
}

export interface Application {
  id: string;
  userId: string;
  name: string;
  description?: string;
  apiKey: string;
  apiKeyHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

export interface ApiKey {
  id: string;
  applicationId: string;
  key: string;
  keyHash: string;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

