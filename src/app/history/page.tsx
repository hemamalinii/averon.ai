'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Download, Filter, Search, LogOut, Upload, History, Settings } from 'lucide-react';

interface Transaction {
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
}

export default function HistoryPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'confidence'>('date');

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      loadTransactions();
    }
  }, [session]);

  useEffect(() => {
    filterAndSortTransactions();
  }, [transactions, searchTerm, confidenceFilter, sortBy]);

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem('bearer_token');
      
      // Fetch all user transactions
      const txResponse = await fetch(`/api/transactions?user_id=${session?.user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!txResponse.ok) throw new Error('Failed to fetch transactions');
      const txData = await txResponse.json();

      // Fetch predictions for each transaction
      const txWithPredictions = await Promise.all(
        txData.map(async (tx: any) => {
          try {
            const predResponse = await fetch(`/api/predictions?transaction_id=${tx.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const predictions = await predResponse.json();
            
            if (predictions.length > 0) {
              // Fetch category name
              const catResponse = await fetch(`/api/categories/${predictions[0].categoryId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const category = await catResponse.json();
              
              return {
                ...tx,
                prediction: {
                  id: predictions[0].id,
                  categoryId: predictions[0].categoryId,
                  categoryName: category.name,
                  confidence: predictions[0].confidence,
                },
              };
            }
            return tx;
          } catch (error) {
            return tx;
          }
        })
      );

      setTransactions(txWithPredictions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.merchantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.prediction?.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Confidence filter
    if (confidenceFilter !== 'all') {
      filtered = filtered.filter((tx) => {
        if (!tx.prediction) return false;
        const conf = tx.prediction.confidence;
        if (confidenceFilter === 'high') return conf >= 0.8;
        if (confidenceFilter === 'medium') return conf >= 0.5 && conf < 0.8;
        if (confidenceFilter === 'low') return conf < 0.5;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'amount') {
        return (b.amount || 0) - (a.amount || 0);
      }
      if (sortBy === 'confidence') {
        return (b.prediction?.confidence || 0) - (a.prediction?.confidence || 0);
      }
      return 0;
    });

    setFilteredTransactions(filtered);
  };

  const exportData = (format: 'csv' | 'json') => {
    if (filteredTransactions.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    if (format === 'json') {
      const dataStr = JSON.stringify(filteredTransactions, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const exportFileDefaultName = `transactions_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      toast.success('Exported as JSON');
    } else {
      // CSV export
      const headers = ['Date', 'Description', 'Merchant', 'Amount', 'Category', 'Confidence'];
      const rows = filteredTransactions.map((tx) => [
        new Date(tx.createdAt).toLocaleDateString(),
        tx.description,
        tx.merchantName || '',
        tx.amount?.toFixed(2) || '',
        tx.prediction?.categoryName || 'Uncategorized',
        tx.prediction ? (tx.prediction.confidence * 100).toFixed(1) + '%' : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
      const exportFileDefaultName = `transactions_${new Date().toISOString().split('T')[0]}.csv`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      toast.success('Exported as CSV');
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem('bearer_token');
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem('bearer_token');
      refetch();
      router.push('/');
    }
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
            <Link href="/upload">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-blue-500 rounded-none px-0 h-auto py-1 gap-2">
                <Upload className="w-4 h-4" /> upload
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-yellow-400 rounded-none px-0 h-auto py-1 gap-2">
                <Settings className="w-4 h-4" /> settings
              </Button>
            </Link>
            <button
              onClick={handleSignOut}
              className="text-white hover:opacity-60 transition-opacity flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" /> sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-light text-white mb-4">transaction history</h1>
          <p className="text-neutral-400 font-light">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Filters and Export */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Search and Filters */}
          <div className="border border-neutral-700 p-6">
            <div className="space-y-6">
              {/* Search */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="description, merchant, category..."
                    className="w-full bg-black border border-neutral-700 text-white text-sm pl-10 pr-4 py-2 focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Confidence Filter */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  confidence
                </label>
                <select
                  value={confidenceFilter}
                  onChange={(e) => setConfidenceFilter(e.target.value as any)}
                  className="w-full bg-black border border-neutral-700 text-white text-sm px-4 py-2 focus:outline-none focus:border-white"
                >
                  <option value="all">All Levels</option>
                  <option value="high">High (≥80%)</option>
                  <option value="medium">Medium (50-79%)</option>
                  <option value="low">Low (&lt;50%)</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-black border border-neutral-700 text-white text-sm px-4 py-2 focus:outline-none focus:border-white"
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="amount">Amount (Highest First)</option>
                  <option value="confidence">Confidence (Highest First)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Export */}
          <div className="border border-neutral-700 p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
                  export data
                </h3>
                <p className="text-sm text-neutral-400 font-light mb-6">
                  download your filtered transactions in CSV or JSON format
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => exportData('csv')}
                  className="w-full border border-neutral-700 px-4 py-3 hover:border-yellow-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span className="text-sm text-white">Export as CSV</span>
                </button>

                <button
                  onClick={() => exportData('json')}
                  className="w-full border border-neutral-700 px-4 py-3 hover:border-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span className="text-sm text-white">Export as JSON</span>
                </button>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <p className="text-xs text-neutral-500 font-light">
                  exports include all filtered results with dates, amounts, categories, and confidence scores
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="border border-neutral-700">
          <div className="border-b border-neutral-700 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">transactions</h2>
          </div>
          
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-neutral-800">
              {filteredTransactions.map((tx) => (
                <div key={tx.id} className="p-6 hover:bg-neutral-900 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-sm text-white font-light mb-1">{tx.description}</p>
                      {tx.merchantName && (
                        <p className="text-xs text-neutral-500">{tx.merchantName}</p>
                      )}
                      <p className="text-xs text-neutral-600 mt-2">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      {tx.amount && (
                        <p className="text-sm text-white mb-1">${tx.amount.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  {tx.prediction && (
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-neutral-400">
                          Category: <span className="text-white">{tx.prediction.categoryName}</span>
                        </span>
                        <span className="text-xs text-neutral-400">
                          Confidence: <span className="text-white">
                            {(tx.prediction.confidence * 100).toFixed(0)}%
                          </span>
                        </span>
                      </div>
                      <div className="w-24 h-1 bg-neutral-800">
                        <div
                          className={`h-full transition-all ${
                            tx.prediction.confidence >= 0.8
                              ? 'bg-white'
                              : tx.prediction.confidence >= 0.5
                              ? 'bg-neutral-400'
                              : 'bg-neutral-600'
                          }`}
                          style={{ width: `${tx.prediction.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
              <p className="text-sm text-neutral-500 font-light mb-4">
                {transactions.length === 0
                  ? 'no transactions yet'
                  : 'no transactions match your filters'}
              </p>
              {transactions.length === 0 && (
                <Link href="/upload">
                  <button className="border border-neutral-700 px-6 py-2 hover:border-yellow-400 transition-colors">
                    <span className="text-sm text-white">Upload Transactions</span>
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
