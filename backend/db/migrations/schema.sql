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

-- Seed demo data so dashboard works immediately
INSERT INTO contracts (name, vendor, client, effective_date,
  expiry_date, auto_renewal, renewal_notice_days, monthly_fee,
  risk_score, status, original_filename)
VALUES
(
  'CloudSync SaaS Agreement',
  'CloudSync Technologies Pvt. Ltd.',
  'Meridian Retail Solutions Pvt. Ltd.',
  '2024-02-01', '2025-01-31', true, 30, 120000, 62,
  'expiring-soon', 'CloudSync_SaaS_Agreement.pdf'
),
(
  'AWS Enterprise Support Agreement',
  'Amazon Web Services India',
  'Meridian Retail Solutions Pvt. Ltd.',
  '2023-06-01', '2025-06-01', false, 0, 85000, 81,
  'active', 'AWS_Enterprise_Support.pdf'
),
(
  'Razorpay Payment Gateway MSA',
  'Razorpay Software Pvt. Ltd.',
  'Meridian Retail Solutions Pvt. Ltd.',
  '2024-01-01', '2024-12-31', true, 15, 0, 44,
  'high-risk', 'Razorpay_MSA.pdf'
)
ON CONFLICT DO NOTHING;
