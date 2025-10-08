-- migrations/003_add_indexes.sql

USE boarding;

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Password tokens indexes (already has idx_token_hash)
CREATE INDEX idx_password_tokens_user_id ON password_tokens(user_id);
CREATE INDEX idx_password_tokens_created_at ON password_tokens(created_at);
CREATE INDEX idx_password_tokens_used ON password_tokens(used);

-- User companies indexes
CREATE INDEX idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX idx_user_companies_company_id ON user_companies(company_id);

-- Analyze tables for query optimization
ANALYZE TABLE users, companies, user_companies, password_tokens;