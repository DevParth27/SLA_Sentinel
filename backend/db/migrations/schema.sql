CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  vendor VARCHAR(255),
  client VARCHAR(255),
  effective_date DATE,
  expiry_date DATE,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 0,
  monthly_fee NUMERIC(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  risk_score INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  s3_key VARCHAR(500),
  original_filename VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clauses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  type VARCHAR(100),
  summary TEXT,
  raw_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  message TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT,
  answer TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
