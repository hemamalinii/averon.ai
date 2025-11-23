'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Upload, Loader2, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { DEMO_TRANSACTIONS } from '@/lib/constants';

interface ProcessingProgress {
  total: number;
  completed: number;
  current: string;
  status: 'processing' | 'complete' | 'error';
  estimatedTimeRemaining: number;
}

export default function UploadPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login?redirect=/upload');
    }
  }, [session, isPending, router]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!session?.user) {
      toast.error('Please login to upload transactions');
      router.push('/login?redirect=/upload');
      return;
    }

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error('please upload a csv or json file');
      return;
    }

    setIsLoading(true);
    try {
      const text = await file.text();
      const transactions = file.name.endsWith('.csv')
        ? parseCSV(text)
        : JSON.parse(text);

      await saveTransactionsToDatabase(transactions);
    } catch (error) {
      toast.error('failed to parse file');
      console.error(error);
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const values = lines[i].split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx];
      });
      rows.push(obj);
    }
    return rows;
  };

  const saveTransactionsToDatabase = async (transactions: any[]) => {
    const startTime = Date.now();
    
    try {
      const token = localStorage.getItem('bearer_token');
      
      // Initialize progress
      setProgress({
        total: transactions.length,
        completed: 0,
        current: 'Saving transactions to database...',
        status: 'processing',
        estimatedTimeRemaining: transactions.length * 0.05, // ~50ms per transaction
      });

      // Save transactions to database
      const txPayload = transactions.map(tx => ({
        description: tx.description || tx.transaction,
        amount: parseFloat(tx.amount) || 0,
        merchantName: tx.merchant_name || tx.merchantName || null,
        userId: session?.user.id,
      }));

      const bulkResponse = await fetch('/api/transactions/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ transactions: txPayload }),
      });

      if (!bulkResponse.ok) {
        throw new Error('Failed to save transactions');
      }

      const bulkResult = await bulkResponse.json();
      const savedTransactions = bulkResult.transactions; // ✅ Extract the transactions array
      
      setProgress({
        total: transactions.length,
        completed: 0,
        current: 'Starting AI categorization...',
        status: 'processing',
        estimatedTimeRemaining: transactions.length * 0.05,
      });

      // Get predictions for each transaction with real-time progress
      const predictionsResults = [];
      for (let i = 0; i < savedTransactions.length; i++) {
        const tx = savedTransactions[i];
        const iterationStartTime = Date.now();
        
        // Update progress
        const avgTimePerTransaction = i > 0 ? (Date.now() - startTime) / i : 50;
        const remainingTransactions = savedTransactions.length - i;
        const estimatedTimeRemaining = (remainingTransactions * avgTimePerTransaction) / 1000;
        
        setProgress({
          total: savedTransactions.length,
          completed: i,
          current: `Processing: ${tx.description.substring(0, 50)}...`,
          status: 'processing',
          estimatedTimeRemaining,
        });

        try {
          const predResponse = await fetch('/api/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              transaction: tx.description,
              amount: tx.amount,
              merchant_name: tx.merchantName,
            }),
          });

          if (predResponse.ok) {
            const predResult = await predResponse.json();
            
            // Save prediction to database
            const savePredResponse = await fetch('/api/predictions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                transactionId: tx.id,
                categoryId: predResult.category_id,
                confidence: predResult.confidence,
                modelVersion: '1.0.0',
              }),
            });

            if (savePredResponse.ok) {
              const savedPred = await savePredResponse.json();
              predictionsResults.push({
                transaction: tx,
                prediction: {
                  ...predResult,
                  predictionId: savedPred.id,
                },
              });
            }
          }
        } catch (error) {
          console.error('Failed to predict transaction:', error);
        }
      }

      // Complete
      setProgress({
        total: savedTransactions.length,
        completed: savedTransactions.length,
        current: 'Complete!',
        status: 'complete',
        estimatedTimeRemaining: 0,
      });

      // Store transaction IDs in sessionStorage for results page
      sessionStorage.setItem('uploadedTransactionIds', JSON.stringify(savedTransactions.map((t: any) => t.id)));
      sessionStorage.setItem('uploadedTransactions', JSON.stringify(predictionsResults));
      
      toast.success(`categorized ${predictionsResults.length} transactions`);
      
      // Redirect after brief delay
      setTimeout(() => {
        router.push('/results');
      }, 1500);
    } catch (error) {
      console.error('Failed to save transactions:', error);
      setProgress({
        total: transactions.length,
        completed: 0,
        current: 'Error processing transactions',
        status: 'error',
        estimatedTimeRemaining: 0,
      });
      toast.error('failed to save transactions to database');
    }
  };

  const useDemoData = async () => {
    if (!session?.user) {
      toast.error('Please login to use demo data');
      router.push('/login?redirect=/upload');
      return;
    }

    setIsLoading(true);
    try {
      await saveTransactionsToDatabase(DEMO_TRANSACTIONS);
    } catch (error) {
      toast.error('failed to load demo data');
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
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
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-yellow-400 rounded-none px-0 h-auto py-1 gap-2">
                <ArrowLeft className="w-4 h-4" /> back
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        <div className="mb-16">
          <h1 className="text-4xl font-light text-white mb-4">upload transactions</h1>
          <p className="text-neutral-400 font-light">
            csv or json format for automatic categorization
          </p>
        </div>

        {/* Processing Progress Overlay */}
        {progress && (
          <div className="mb-12 border-2 border-yellow-400 bg-black">
            <div className="border-b border-yellow-400 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white flex items-center gap-2">
                  {progress.status === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {progress.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-yellow-400" />}
                  {progress.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  {progress.status === 'processing' && 'Processing Batch'}
                  {progress.status === 'complete' && 'Processing Complete'}
                  {progress.status === 'error' && 'Processing Error'}
                </h2>
                <span className="text-xs text-neutral-400">
                  {progress.completed} / {progress.total}
                </span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Progress Bar */}
              <div className="w-full h-2 bg-neutral-800">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                />
              </div>

              {/* Current Status */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-light">{progress.current}</p>
                <span className="text-xs text-neutral-400">
                  {((progress.completed / progress.total) * 100).toFixed(0)}%
                </span>
              </div>

              {/* Time Remaining */}
              {progress.status === 'processing' && progress.estimatedTimeRemaining > 0 && (
                <p className="text-xs text-neutral-500">
                  Estimated time remaining: {progress.estimatedTimeRemaining.toFixed(1)}s
                </p>
              )}

              {/* Success Message */}
              {progress.status === 'complete' && (
                <div className="bg-neutral-900 border border-neutral-700 p-4">
                  <p className="text-sm text-neutral-400 font-light">
                    ✓ All transactions categorized successfully. Redirecting to results...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-12">
          {/* Upload Area */}
          <div className="border border-neutral-700">
            <div className="border-b border-neutral-700 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">file upload</h2>
            </div>
            <div className="p-6">
              <div
                className={`border-2 ${isDragOver ? 'border-yellow-400' : 'border-neutral-700'} p-16 text-center cursor-pointer transition-colors hover:border-blue-500 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isLoading && document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  className="hidden"
                  disabled={isLoading}
                />
                <Upload className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                <p className="text-sm text-neutral-400 mb-2">drop file or click to browse</p>
                <p className="text-xs text-neutral-500">csv / json</p>
              </div>

              <div className="mt-8 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">expected format</p>
                <div className="bg-neutral-900 border border-neutral-800 p-4 font-mono text-xs text-neutral-400">
                  description, amount, merchant_name<br />
                  STARBUCKS #2390, 5.45, Starbucks<br />
                  SHELL PETROL, 45.00, Shell
                </div>
              </div>
            </div>
          </div>

          {/* Demo Data */}
          <div className="border border-neutral-700">
            <div className="border-b border-neutral-700 px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">demo data</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-neutral-400 mb-8 font-light leading-relaxed">
                try with 8 pre-configured sample transactions to see the system in action
              </p>

              <div className="bg-neutral-900 border border-neutral-800 p-4 mb-8 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">samples</p>
                <ul className="text-xs text-neutral-400 space-y-2 font-light">
                  {DEMO_TRANSACTIONS.slice(0, 5).map((tx, i) => (
                    <li key={i}>• {tx.description}</li>
                  ))}
                  <li className="text-neutral-600">• ... and 3 more</li>
                </ul>
              </div>

              <button
                onClick={useDemoData}
                disabled={isLoading}
                className="w-full border-2 border-white px-6 py-3 hover:border-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm font-medium tracking-wide text-white">
                  {isLoading ? 'processing...' : 'use demo data'}
                </span>
              </button>

              <div className="mt-8 pt-8 border-t border-neutral-800">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">process</p>
                <ol className="text-xs text-neutral-400 space-y-2 font-light">
                  <li>1. data saved to database</li>
                  <li>2. ai categorizes transactions</li>
                  <li>3. results with confidence scores</li>
                  <li>4. provide feedback to improve</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Format Info */}
        <div className="grid md:grid-cols-3 gap-px bg-neutral-800 mt-16">
          <div className="bg-black p-8 hover:border hover:border-yellow-400 transition-colors">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-white">csv format</p>
            <p className="text-xs text-neutral-500 font-light">comma-separated values with headers</p>
          </div>

          <div className="bg-black p-8 hover:border hover:border-blue-500 transition-colors">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-white">json format</p>
            <p className="text-xs text-neutral-500 font-light">array of transaction objects</p>
          </div>

          <div className="bg-black p-8 hover:border hover:border-yellow-400 transition-colors">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-white">file size</p>
            <p className="text-xs text-neutral-500 font-light">up to 10mb (~100k transactions)</p>
          </div>
        </div>
      </main>
    </div>
  );
}