/*
  # AveronAI - Financial Transaction Categorization System
  
  1. New Tables
    - `transactions` - Store transaction data and predictions
    - `categories` - Store available transaction categories
    - `predictions` - Store model predictions with confidence scores
    - `feedback` - Store user corrections for model improvement
    - `taxonomy` - Store current taxonomy configuration
  
  2. Security
    - Enable RLS on all tables
    - Authenticated users can read/write their own data
    - Admin users can manage taxonomy
  
  3. Indexes
    - Created on frequently queried columns for performance
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color_hex text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by authenticated users"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  description text NOT NULL,
  amount decimal(12, 2),
  transaction_date date,
  merchant_name text,
  raw_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories ON DELETE CASCADE,
  confidence numeric(3, 2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  influential_tokens text[] DEFAULT ARRAY[]::text[],
  model_version text DEFAULT '1.0',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_predictions_transaction_id ON predictions(transaction_id);
CREATE INDEX idx_predictions_confidence ON predictions(confidence);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view predictions for own transactions"
  ON predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM transactions
      WHERE transactions.id = predictions.transaction_id
      AND transactions.user_id = auth.uid()
    )
  );

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES transactions ON DELETE CASCADE,
  prediction_id uuid REFERENCES predictions ON DELETE SET NULL,
  corrected_category_id uuid NOT NULL REFERENCES categories ON DELETE CASCADE,
  original_category_id uuid REFERENCES categories ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_transaction_id ON feedback(transaction_id);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create taxonomy table
CREATE TABLE IF NOT EXISTS taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL DEFAULT '1.0',
  config jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users ON DELETE SET NULL
);

ALTER TABLE taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Taxonomy is viewable by authenticated users"
  ON taxonomy FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Only admins can update taxonomy"
  ON taxonomy FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Insert default categories
INSERT INTO categories (name, description, color_hex) VALUES
  ('Groceries', 'Food and grocery shopping', '#10B981'),
  ('Dining', 'Restaurants and cafes', '#F59E0B'),
  ('Fuel', 'Gas stations and fuel', '#EF4444'),
  ('Shopping', 'General shopping and retail', '#8B5CF6'),
  ('Bills', 'Utilities and bills', '#06B6D4'),
  ('Entertainment', 'Movies, games, and entertainment', '#EC4899'),
  ('Transport', 'Public transport and taxi', '#3B82F6'),
  ('Healthcare', 'Medical and healthcare', '#14B8A6'),
  ('Other', 'Uncategorized transactions', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Insert default taxonomy
INSERT INTO taxonomy (version, config, is_active) VALUES
  ('1.0', '{"categories": ["Groceries", "Dining", "Fuel", "Shopping", "Bills", "Entertainment", "Transport", "Healthcare", "Other"]}', true)
ON CONFLICT DO NOTHING;