export interface Category {
  id: string;
  name: string;
  description?: string;
  color_hex: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount?: number;
  transaction_date?: string;
  merchant_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Prediction {
  id: string;
  transaction_id: string;
  category_id: string;
  confidence: number;
  influential_tokens: string[];
  model_version: string;
  created_at: string;
  category?: Category;
}

export interface Feedback {
  id: string;
  transaction_id: string;
  prediction_id?: string;
  corrected_category_id: string;
  original_category_id?: string;
  user_id: string;
  notes?: string;
  created_at: string;
}

export interface PredictionResponse {
  category: string;
  confidence: number;
  influential_tokens: string[];
  category_id: string;
}

export interface BatchPredictionRequest {
  transactions: Array<{
    description: string;
    amount?: number;
    merchant_name?: string;
  }>;
}

export interface TaxonomyConfig {
  categories: string[];
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
}
