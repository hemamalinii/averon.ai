'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Settings, Download, LogOut, Info, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { explainPrediction } from '@/lib/api';
import { DEFAULT_CATEGORIES, CONFIDENCE_THRESHOLDS } from '@/lib/constants';

interface PredictedTransaction {
  id: number;
  description: string;
  amount?: number;
  merchantName?: string;
  createdAt: string;
  prediction?: {
    id: number;
    categoryId: number;
    categoryName: string;
    confidence: number;
  };
  loading?: boolean;
  error?: string;
  feedbackGiven?: boolean;
}

export default function ResultsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<PredictedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplain, setShowExplain] = useState<PredictedTransaction | null>(null);
  const [explainData, setExplainData] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState<PredictedTransaction | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [showConfidenceInfo, setShowConfidenceInfo] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login?redirect=/results');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      
      // Get uploaded transaction IDs from sessionStorage
      const uploadedIds = sessionStorage.getItem('uploadedTransactionIds');
      const txIds = uploadedIds ? JSON.parse(uploadedIds) : [];

      if (txIds.length === 0) {
        // No recent upload, load all user transactions
        const txResponse = await fetch(`/api/transactions?user_id=${session?.user.id}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allTransactions = await txResponse.json();
        await loadTransactionsWithPredictions(allTransactions);
      } else {
        // Load specific uploaded transactions
        const txPromises = txIds.map((id: number) =>
          fetch(`/api/transactions/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then(res => res.json())
        );
        const loadedTxs = await Promise.all(txPromises);
        await loadTransactionsWithPredictions(loadedTxs);
      }

      // Load categories
      const catResponse = await fetch('/api/categories?include_defaults=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const catData = await catResponse.json();
      setCategories(catData);

      // Fetch metrics
      const metricsResponse = await fetch('/api/metrics');
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('failed to load transactions');
      setLoading(false);
    }
  };

  const loadTransactionsWithPredictions = async (txs: any[]) => {
    const token = localStorage.getItem('bearer_token');
    
    const txWithPredictions = await Promise.all(
      txs.map(async (tx: any) => {
        try {
          // Fetch predictions for this transaction
          const predResponse = await fetch(`/api/predictions?transaction_id=${tx.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const predictions = await predResponse.json();

          if (predictions.length > 0) {
            const pred = predictions[0];
            
            // Fetch category name
            const catResponse = await fetch(`/api/categories/${pred.categoryId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const category = await catResponse.json();

            // Check if feedback exists
            const feedbackResponse = await fetch(`/api/feedback?transaction_id=${tx.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const feedbacks = await feedbackResponse.json();

            return {
              id: tx.id,
              description: tx.description,
              amount: tx.amount,
              merchantName: tx.merchantName,
              createdAt: tx.createdAt,
              prediction: {
                id: pred.id,
                categoryId: pred.categoryId,
                categoryName: category.name,
                confidence: pred.confidence,
              },
              feedbackGiven: feedbacks.length > 0,
            };
          }

          return {
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            merchantName: tx.merchantName,
            createdAt: tx.createdAt,
          };
        } catch (error) {
          console.error('Failed to load prediction:', error);
          return {
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            merchantName: tx.merchantName,
            createdAt: tx.createdAt,
            error: 'Failed to load prediction',
          };
        }
      })
    );

    setTransactions(txWithPredictions);
  };

  const handleExplain = async (tx: PredictedTransaction) => {
    try {
      const explanation = await explainPrediction(
        tx.description,
        tx.amount,
        tx.merchantName
      );
      setExplainData(explanation);
      setShowExplain(tx);
    } catch (error) {
      toast.error('failed to get explanation');
    }
  };

  // Helper function to highlight influential tokens in text
  const highlightInfluentialWords = (text: string, influences: string[]) => {
    if (!influences || influences.length === 0) return text;
    
    const words = text.split(' ');
    const influenceMap = new Map(influences.map((token, idx) => [token.toLowerCase(), idx]));
    
    return words.map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (influenceMap.has(cleanWord)) {
        const influenceIndex = influenceMap.get(cleanWord)!;
        const intensity = Math.max(0.3, 1 - (influenceIndex / influences.length) * 0.7);
        return (
          <span
            key={idx}
            className="inline-block px-1 mx-0.5 rounded"
            style={{
              backgroundColor: `rgba(255, 215, 0, ${intensity * 0.3})`,
              borderBottom: `2px solid rgba(255, 215, 0, ${intensity})`,
            }}
          >
            {word}
          </span>
        );
      }
      return <span key={idx}>{word} </span>;
    });
  };

  const handleFeedback = async () => {
    if (!showFeedback || !selectedCategory) {
      toast.error('please select a category');
      return;
    }

    try {
      const token = localStorage.getItem('bearer_token');
      
      // Find the category ID
      const category = categories.find(c => c.name === selectedCategory);
      if (!category) {
        toast.error('invalid category');
        return;
      }

      // Save feedback to database
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: showFeedback.id,
          predictionId: showFeedback.prediction?.id,
          originalCategoryId: showFeedback.prediction?.categoryId,
          correctedCategoryId: category.id,
          notes: feedbackText,
          userId: session?.user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save feedback');
      }

      toast.success('feedback saved');
      setShowFeedback(null);
      setFeedbackText('');
      setSelectedCategory('');

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === showFeedback.id ? { ...t, feedbackGiven: true } : t
        )
      );
    } catch (error) {
      console.error('Feedback error:', error);
      toast.error('failed to save feedback');
    }
  };

  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = filteredTransactions.map(tx => ({
      date: new Date(tx.createdAt).toLocaleDateString(),
      description: tx.description,
      merchant: tx.merchantName || '',
      amount: tx.amount || 0,
      category: tx.prediction?.categoryName || 'Uncategorized',
      confidence: tx.prediction ? (tx.prediction.confidence * 100).toFixed(1) + '%' : '',
      feedbackGiven: tx.feedbackGiven ? 'Yes' : 'No',
    }));

    if (format === 'json') {
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const exportFileDefaultName = `results_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      toast.success('Exported as JSON');
    } else {
      // CSV export
      const headers = ['Date', 'Description', 'Merchant', 'Amount', 'Category', 'Confidence', 'Feedback Given'];
      const rows = dataToExport.map((item) => [
        item.date,
        item.description,
        item.merchant,
        item.amount.toFixed(2),
        item.category,
        item.confidence,
        item.feedbackGiven,
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
      const exportFileDefaultName = `results_${new Date().toISOString().split('T')[0]}.csv`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      toast.success('Exported as CSV');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!tx.prediction) return filterConfidence === 'all';
    if (filterConfidence === 'low') return tx.prediction.confidence < CONFIDENCE_THRESHOLDS.MEDIUM;
    if (filterConfidence === 'medium')
      return (
        tx.prediction.confidence >= CONFIDENCE_THRESHOLDS.MEDIUM &&
        tx.prediction.confidence < CONFIDENCE_THRESHOLDS.HIGH
      );
    if (filterConfidence === 'high') return tx.prediction.confidence >= CONFIDENCE_THRESHOLDS.HIGH;
    return true;
  });

  const stats = {
    total: transactions.length,
    predicted: transactions.filter((t) => t.prediction).length,
    highConfidence: transactions.filter(
      (t) => t.prediction && t.prediction.confidence >= CONFIDENCE_THRESHOLDS.HIGH
    ).length,
    needsReview: transactions.filter(
      (t) => t.prediction && t.prediction.confidence < CONFIDENCE_THRESHOLDS.MEDIUM
    ).length,
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-neutral-500">loading...</p>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="text-white font-semibold text-lg tracking-tight hover:opacity-60 transition-opacity">
            averon.ai
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-yellow-400 rounded-none px-0 h-auto py-1">
                dashboard
              </Button>
            </Link>
            <Link href="/evaluation">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-blue-500 rounded-none px-0 h-auto py-1 gap-2">
                <BarChart3 className="w-4 h-4" /> evaluation
              </Button>
            </Link>
            <Link href="/taxonomy">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-yellow-400 rounded-none px-0 h-auto py-1 gap-2">
                <Settings className="w-4 h-4" /> taxonomy
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-800 mb-16">
          <div className="bg-black p-8 hover:border hover:border-yellow-400 transition-colors">
            <div className="text-4xl font-light mb-1 text-white">{stats.total}</div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">total</p>
          </div>
          <div className="bg-black p-8 hover:border hover:border-blue-500 transition-colors">
            <div className="text-4xl font-light mb-1 text-white">{stats.predicted}</div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">processed</p>
          </div>
          <div className="bg-black p-8 hover:border hover:border-yellow-400 transition-colors">
            <div className="text-4xl font-light mb-1 text-white">{stats.highConfidence}</div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">high confidence</p>
          </div>
          <div className="bg-black p-8 hover:border hover:border-blue-500 transition-colors">
            <div className="text-4xl font-light mb-1 text-white">{stats.needsReview}</div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">needs review</p>
          </div>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="border border-neutral-700 mb-16">
            <div className="border-b border-neutral-700 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">model performance</h2>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-4 gap-8">
                <div>
                  <div className="text-3xl font-light mb-1 text-white">{metrics.macro_f1.toFixed(2)}</div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">macro f1</p>
                </div>
                <div>
                  <div className="text-3xl font-light mb-1 text-white">{metrics.accuracy.toFixed(2)}</div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">accuracy</p>
                </div>
                <div>
                  <div className="text-3xl font-light mb-1 text-white">{metrics.latency_ms}ms</div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">latency</p>
                </div>
                <div>
                  <div className="text-3xl font-light mb-1 text-white">{metrics.throughput_per_second}</div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">throughput</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Export */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
              transactions <span className="text-neutral-500">({filteredTransactions.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterConfidence('all')}
                  className={`text-xs px-4 py-2 border transition-colors ${
                    filterConfidence === 'all' 
                      ? 'border-white text-white' 
                      : 'border-neutral-700 text-neutral-400 hover:border-yellow-400'
                  }`}
                >
                  all
                </button>
                <button
                  onClick={() => setFilterConfidence('low')}
                  className={`text-xs px-4 py-2 border transition-colors ${
                    filterConfidence === 'low' 
                      ? 'border-white text-white' 
                      : 'border-neutral-700 text-neutral-400 hover:border-blue-500'
                  }`}
                >
                  low (&lt;65%)
                </button>
                <button
                  onClick={() => setFilterConfidence('medium')}
                  className={`text-xs px-4 py-2 border transition-colors ${
                    filterConfidence === 'medium' 
                      ? 'border-white text-white' 
                      : 'border-neutral-700 text-neutral-400 hover:border-yellow-400'
                  }`}
                >
                  medium (65-84%)
                </button>
                <button
                  onClick={() => setFilterConfidence('high')}
                  className={`text-xs px-4 py-2 border transition-colors ${
                    filterConfidence === 'high' 
                      ? 'border-white text-white' 
                      : 'border-neutral-700 text-neutral-400 hover:border-blue-500'
                  }`}
                >
                  high (≥85%)
                </button>
              </div>
              <button
                onClick={() => setShowConfidenceInfo(true)}
                className="p-2 border border-neutral-700 text-neutral-400 hover:border-yellow-400 hover:text-white transition-colors"
                title="Confidence Level Info"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => exportData('csv')}
              className="text-xs px-4 py-2 border border-neutral-700 text-white hover:border-yellow-400 transition-colors flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
            <button
              onClick={() => exportData('json')}
              className="text-xs px-4 py-2 border border-neutral-700 text-white hover:border-blue-500 transition-colors flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              JSON
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-neutral-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">description</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">amount</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">confidence</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className={`border-b border-neutral-800 hover:bg-neutral-900 transition-colors ${tx.feedbackGiven ? 'bg-neutral-900' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-light text-white">{tx.description}</div>
                        {tx.merchantName && (
                          <div className="text-xs text-neutral-500 mt-1">{tx.merchantName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-light text-white">
                        {tx.amount ? `$${tx.amount.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {tx.loading ? (
                          <span className="text-xs text-neutral-500">processing...</span>
                        ) : tx.error ? (
                          <span className="text-xs text-neutral-500">error</span>
                        ) : tx.prediction ? (
                          <span className="text-xs font-medium text-white">{tx.prediction.categoryName}</span>
                        ) : (
                          <span className="text-xs text-neutral-500">uncategorized</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {tx.loading ? (
                          <div className="w-24 h-1 bg-neutral-800 animate-pulse" />
                        ) : tx.error || !tx.prediction ? (
                          <span className="text-xs text-neutral-500">—</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-1 bg-neutral-800">
                              <div
                                className="h-full bg-white transition-all"
                                style={{ width: `${(tx.prediction.confidence || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-white">
                              {((tx.prediction.confidence || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {tx.prediction && (
                            <>
                              <button
                                onClick={() => handleExplain(tx)}
                                className="text-xs px-3 py-1 border border-neutral-700 text-white hover:border-blue-500 transition-colors"
                              >
                                explain
                              </button>
                              {!tx.feedbackGiven && (
                                <button
                                  onClick={() => {
                                    setShowFeedback(tx);
                                    setSelectedCategory(tx.prediction?.categoryName || '');
                                  }}
                                  className="text-xs px-3 py-1 border border-neutral-700 text-white hover:border-yellow-400 transition-colors"
                                >
                                  feedback
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <p className="text-sm text-neutral-500 font-light mb-4">
                        no transactions found
                      </p>
                      <Link href="/upload">
                        <button className="border border-neutral-700 px-6 py-2 hover:border-yellow-400 transition-colors">
                          <span className="text-sm text-white">Upload Transactions</span>
                        </button>
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Confidence Info Dialog */}
      <Dialog open={showConfidenceInfo} onOpenChange={setShowConfidenceInfo}>
        <DialogContent className="bg-black border-2 border-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold uppercase tracking-wider text-white">
              confidence level classification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              Confidence scores represent the AI model's certainty in its category prediction for each transaction. 
              The scores range from 0% to 100% and are automatically categorized into three levels:
            </p>

            <div className="space-y-4">
              <div className="border border-neutral-700 p-4 bg-neutral-900">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white">High Confidence</h3>
                  <span className="text-xs font-mono text-neutral-400">≥ 85%</span>
                </div>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  Predictions with 85% or higher confidence. These categorizations are highly reliable and typically 
                  require no review. The model has strong signals from the transaction description.
                </p>
              </div>

              <div className="border border-neutral-700 p-4 bg-neutral-900">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Medium Confidence</h3>
                  <span className="text-xs font-mono text-neutral-400">65% - 84%</span>
                </div>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  Predictions between 65% and 84% confidence. Generally accurate but may benefit from occasional 
                  review. Consider providing feedback if the category seems incorrect.
                </p>
              </div>

              <div className="border border-neutral-700 p-4 bg-neutral-900">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Low Confidence</h3>
                  <span className="text-xs font-mono text-neutral-400">&lt; 65%</span>
                </div>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  Predictions below 65% confidence. These require manual review as the model is uncertain. 
                  Ambiguous transaction descriptions or unfamiliar merchants often result in low confidence. 
                  Please provide feedback to improve future predictions.
                </p>
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <p className="text-xs text-neutral-500 font-light leading-relaxed">
                <strong className="text-neutral-400">Note:</strong> These thresholds are based on statistical 
                analysis of model performance. The categorization helps prioritize which transactions to review 
                first. Your feedback on any confidence level helps improve the model over time.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Explain Dialog - Enhanced with Highlighted Text */}
      <Dialog open={!!showExplain} onOpenChange={(open) => !open && setShowExplain(null)}>
        <DialogContent className="bg-black border-2 border-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold uppercase tracking-wider text-white">
              explainability analysis
            </DialogTitle>
          </DialogHeader>
          {showExplain && explainData && (
            <div className="space-y-6">
              {/* Highlighted Transaction Text */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                  transaction with influential words highlighted
                </p>
                <div className="bg-neutral-900 border border-neutral-700 p-4">
                  <p className="text-base font-light text-white leading-relaxed">
                    {highlightInfluentialWords(showExplain.description, explainData.influences)}
                  </p>
                </div>
                <p className="text-xs text-neutral-500 mt-2 font-light">
                  Brighter highlights indicate stronger influence on the prediction
                </p>
              </div>

              {/* Prediction Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    predicted category
                  </p>
                  <p className="text-sm font-medium text-white">{explainData.category}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    confidence score
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-neutral-800">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${explainData.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">
                      {(explainData.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Token Influence Breakdown */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                  top influential tokens (shap values)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {explainData.influences?.slice(0, 10).map((token: string, idx: number) => {
                    const intensity = 1 - (idx / explainData.influences.length) * 0.7;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 px-3 py-2"
                      >
                        <div className="flex-1">
                          <span className="text-xs font-mono text-white">{token}</span>
                        </div>
                        <div className="w-16 h-1 bg-neutral-800">
                          <div
                            className="h-full bg-yellow-400"
                            style={{ width: `${intensity * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SHAP Explanation */}
              <div className="border border-neutral-800 p-4 bg-neutral-900">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  how this works
                </p>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  SHAP (SHapley Additive exPlanations) analysis identifies which words in your transaction 
                  had the strongest influence on the AI's classification decision. Words with higher SHAP 
                  values contributed more to the predicted category. This makes the model's reasoning transparent 
                  and auditable.
                </p>
              </div>

              {/* Additional Context */}
              {showExplain.amount && (
                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-neutral-800">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                      transaction amount
                    </p>
                    <p className="text-sm font-medium text-white">${showExplain.amount.toFixed(2)}</p>
                  </div>
                  {showExplain.merchantName && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                        merchant name
                      </p>
                      <p className="text-sm font-medium text-white">{showExplain.merchantName}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={!!showFeedback} onOpenChange={(open) => !open && setShowFeedback(null)}>
        <DialogContent className="bg-black border-2 border-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold uppercase tracking-wider text-white">provide feedback</DialogTitle>
          </DialogHeader>
          {showFeedback && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">transaction</p>
                <p className="text-sm font-light text-white">{showFeedback.description}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">correct category</p>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-black border border-neutral-700 px-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors"
                >
                  <option value="">select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">notes (optional)</p>
                <textarea
                  placeholder="why was this prediction incorrect?"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full bg-black border border-neutral-700 px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white transition-colors min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowFeedback(null)}
                  className="px-6 py-3 border border-neutral-700 text-sm text-white hover:border-neutral-500 transition-colors"
                >
                  cancel
                </button>
                <button
                  onClick={handleFeedback}
                  className="px-6 py-3 border-2 border-white text-sm text-white hover:border-yellow-400 transition-colors"
                >
                  save feedback
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}