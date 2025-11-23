import { PredictionResponse, BatchPredictionRequest } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function predictTransaction(
  description: string,
  amount?: number,
  merchantName?: string
): Promise<PredictionResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
  
  const response = await fetch(`${API_BASE}/api/predict`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify({
      transaction: description,
      amount,
      merchant_name: merchantName,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to predict transaction');
  }

  return response.json();
}

export async function explainPrediction(
  description: string,
  amount?: number,
  merchantName?: string
): Promise<{ transaction: string; category: string; confidence: number; influences: string[] }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
  
  const response = await fetch(`${API_BASE}/api/explain`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify({
      transaction: description,
      amount,
      merchant_name: merchantName,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get explanation');
  }

  return response.json();
}

export async function getTaxonomy(): Promise<{ categories: string[] }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
  
  const response = await fetch(`${API_BASE}/api/taxonomy`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch taxonomy');
  }

  return response.json();
}

export async function updateTaxonomy(categories: string[]): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
  
  const response = await fetch(`${API_BASE}/api/taxonomy`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify({ categories }),
  });

  if (!response.ok) {
    throw new Error('Failed to update taxonomy');
  }
}

export async function saveFeedback(
  transactionId: string,
  predictedCategoryId: string,
  correctedCategoryId: string,
  notes?: string
): Promise<void> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
  
  const response = await fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: JSON.stringify({
      transaction_id: transactionId,
      original_category_id: predictedCategoryId,
      corrected_category_id: correctedCategoryId,
      notes,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save feedback');
  }
}

export async function getMetrics(): Promise<{
  macro_f1: number;
  accuracy: number;
  samples_processed: number;
  feedback_count: number;
}> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
  
  const response = await fetch(`${API_BASE}/api/metrics`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch metrics');
  }

  return response.json();
}