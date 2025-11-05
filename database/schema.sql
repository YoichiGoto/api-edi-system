-- SME Common EDI System Database Schema

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- アプリケーションテーブル
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    api_key_hash VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP
);

-- メッセージ履歴テーブル
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_type VARCHAR(100) NOT NULL,
    sender_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    receiver_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    data JSONB NOT NULL,
    xml_data TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- マッピング設定テーブル
CREATE TABLE IF NOT EXISTS mapping_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    app_name VARCHAR(255) NOT NULL,
    message_type VARCHAR(100) NOT NULL,
    field_mappings JSONB NOT NULL,
    format_type VARCHAR(20) NOT NULL DEFAULT 'json',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(app_id, message_type)
);

CREATE INDEX IF NOT EXISTS idx_mapping_configs_app ON mapping_configs(app_id);
CREATE INDEX IF NOT EXISTS idx_mapping_configs_type ON mapping_configs(message_type);

-- コード定義テーブル（参照用、JSONデータからロード）
CREATE TABLE IF NOT EXISTS code_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_type VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    code_name VARCHAR(255) NOT NULL,
    code_name_en VARCHAR(255),
    description TEXT,
    international_code VARCHAR(100),
    international_code_name VARCHAR(255),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code_type, code)
);

CREATE INDEX IF NOT EXISTS idx_code_definitions_type ON code_definitions(code_type);
CREATE INDEX IF NOT EXISTS idx_code_definitions_code ON code_definitions(code);
CREATE INDEX IF NOT EXISTS idx_code_definitions_category ON code_definitions(category);

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mapping_configs_updated_at BEFORE UPDATE ON mapping_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_code_definitions_updated_at BEFORE UPDATE ON code_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

