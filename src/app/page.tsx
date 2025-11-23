'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface PredictionResult {
  category: string;
  confidence: number;
}

interface ProcessedTransaction {
  text: string;
  category?: string;
  confidence?: number;
}

export default function Home() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileUpload(files[0]);
  };

  const predictTransactions = async (texts: string[]): Promise<PredictionResult[]> => {
    try {
      const response = await fetch('/predict_batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Failed to get predictions. Please try again.');
      throw error;
    }
  };

  const processFileContent = async (content: string) => {
    try {
      try {
        const jsonData = JSON.parse(content);
        if (Array.isArray(jsonData)) {
          return jsonData.map(item => ({
            text: typeof item === 'string' ? item : JSON.stringify(item)
          }));
        }
        return [{ text: JSON.stringify(jsonData) }];
      } catch {
        return content
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => ({ text: line.trim() }));
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file. Please check the format and try again.');
      return [];
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsLoading(true);
    try {
      const content = await file.text();
      const parsedTransactions = await processFileContent(content);

      if (parsedTransactions.length === 0) {
        toast.error('No valid transactions found in the file.');
        return;
      }

      setTransactions(parsedTransactions);
      toast.success(`Loaded ${parsedTransactions.length} transactions`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredict = async () => {
    if (transactions.length === 0) {
      toast.error('No transactions to predict');
      return;
    }

    setIsPredicting(true);
    try {
      const texts = transactions.map(t => t.text);
      const predictions = await predictTransactions(texts);

      const updatedTransactions = transactions.map((txn, index) => ({
        ...txn,
        category: predictions[index]?.category || 'Unknown',
        confidence: predictions[index]?.confidence || 0,
      }));

      setTransactions(updatedTransactions);
      toast.success('Predictions completed!');
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Failed to get predictions. Please try again.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold">averon.ai</h1>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Financial Transaction Categorization</h1>
          <p className="text-neutral-400 text-lg mb-8">
            Upload your financial transactions and let our AI categorize them automatically.
          </p>

          {transactions.length > 0 && (
            <div className="flex justify-center gap-4 mb-8">
              <Button
                onClick={handlePredict}
                disabled={isPredicting || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPredicting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Predicting...
                  </>
                ) : (
                  'Predict Categories'
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setTransactions([])}
                disabled={isPredicting || isLoading}
                className="text-white border-gray-500 hover:bg-gray-800"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-neutral-700 hover:border-neutral-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="w-12 h-12 text-blue-500" />
            <div className="space-y-2">
              <h3 className="text-xl font-medium">
                {isLoading ? 'Processing...' : 'Drag and drop your file here'}
              </h3>
              <p className="text-neutral-400">
                {isLoading
                  ? 'Please wait while we process your file...'
                  : 'or click to browse files (CSV, Excel, JSON)'}
              </p>
            </div>

            {!isLoading && (
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Select File
                    <input
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </span>
                </label>
              </div>
            )}

            {isLoading && (
              <div className="mt-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          {transactions.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 mb-8">
              <h3 className="text-lg font-semibold mb-4">Transactions ({transactions.length})</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Transaction
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {transactions.map((txn, index) => (
                      <tr key={index} className="hover:bg-gray-800">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-gray-500" />
                            {txn.text}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {txn.category ? (
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                txn.confidence && txn.confidence > 0.9
                                  ? 'bg-green-900 text-green-200'
                                  : txn.confidence && txn.confidence > 0.7
                                  ? 'bg-blue-900 text-blue-200'
                                  : 'bg-yellow-900 text-yellow-200'
                              }`}
                            >
                              {txn.category}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                          {txn.confidence ? `${(txn.confidence * 100).toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-center text-sm text-neutral-500 mt-8">
            <p>Supported formats: Plain text (one transaction per line), JSON</p>
            <p className="text-xs text-neutral-600 mt-1">
              Example: "Starbucks LA 4421" or ["Starbucks LA 4421", "Shell Gas 8833 NYC"]
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
