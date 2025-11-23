'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MetricsData {
  macro_f1: number;
  macro_precision: number;
  macro_recall: number;
  accuracy: number;
  samples_processed: number;
  feedback_count: number;
  per_class_metrics: Array<{
    category: string;
    precision: number;
    recall: number;
    f1: number;
    support: number;
  }>;
  confusion_matrix: {
    labels: string[];
    matrix: number[][];
  };
  latency_ms: number;
  throughput_per_second: number;
}

export default function EvaluationPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMatrixInfo, setShowMatrixInfo] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login?redirect=/evaluation');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      loadMetrics();
    }
  }, [session]);

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data = await response.json();
      setMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
      toast.error('failed to load evaluation metrics');
      setLoading(false);
    }
  };

  const getHeatmapColor = (value: number, maxValue: number) => {
    const intensity = value / maxValue;
    
    if (intensity === 0) {
      return 'rgb(10, 10, 10)'; // Very dark for zero
    } else if (intensity < 0.2) {
      return `rgba(59, 130, 246, ${intensity * 2})`; // Blue for low values
    } else if (intensity < 0.5) {
      return `rgba(251, 191, 36, ${intensity})`; // Yellow for medium
    } else {
      return `rgba(34, 197, 94, ${intensity})`; // Green for high (correct predictions)
    }
  };

  const exportReport = (format: 'csv' | 'json') => {
    if (!metrics) return;

    if (format === 'json') {
      const dataStr = JSON.stringify(metrics, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      const fileName = `evaluation_report_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', fileName);
      linkElement.click();
      toast.success('Exported evaluation report as JSON');
    } else {
      // CSV export
      const headers = ['Category', 'Precision', 'Recall', 'F1-Score', 'Support'];
      const rows = metrics.per_class_metrics.map(m => [
        m.category,
        m.precision.toFixed(3),
        m.recall.toFixed(3),
        m.f1.toFixed(3),
        m.support.toString(),
      ]);

      // Add summary row
      rows.push([]);
      rows.push(['Overall Metrics', '', '', '', '']);
      rows.push(['Accuracy', '', '', metrics.accuracy.toFixed(3), metrics.samples_processed.toString()]);
      rows.push(['Macro Precision', '', '', metrics.macro_precision.toFixed(3), '']);
      rows.push(['Macro Recall', '', '', metrics.macro_recall.toFixed(3), '']);
      rows.push(['Macro F1', '', '', metrics.macro_f1.toFixed(3), '']);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
      const fileName = `evaluation_report_${new Date().toISOString().split('T')[0]}.csv`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', fileName);
      linkElement.click();
      toast.success('Exported evaluation report as CSV');
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-neutral-500">loading evaluation data...</p>
      </div>
    );
  }

  if (!session?.user || !metrics) return null;

  const maxValue = Math.max(...metrics.confusion_matrix.matrix.flat());

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
            <Link href="/results">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-blue-500 rounded-none px-0 h-auto py-1">
                results
              </Button>
            </Link>
            <Link href="/taxonomy">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-yellow-400 rounded-none px-0 h-auto py-1">
                taxonomy
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-white mb-4">model evaluation</h1>
          <p className="text-neutral-400 font-light">
            Comprehensive performance metrics and confusion matrix analysis for the transaction categorization model.
          </p>
        </div>

        {/* Overall Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-800 mb-16">
          <div className="bg-black p-8 hover:border hover:border-yellow-400 transition-colors">
            <div className="text-4xl font-light mb-1 text-white">{metrics.macro_f1.toFixed(3)}</div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">macro f1-score</p>
          </div>
          <div className="bg-black p-8 hover:border hover:border-blue-500 transition-colors">
            <div className="text-4xl font-light mb-1 text-white">{metrics.accuracy.toFixed(3)}</div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">accuracy</p>
          </div>
          <div className="bg-black p-8 hover:border hover:border-yellow-400 transition-colors">
            <div className="text-4xl font-light mb-1 text-white">{metrics.macro_precision.toFixed(3)}</div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">macro precision</p>
          </div>
          <div className="bg-black p-8 hover:border hover:border-blue-500 transition-colors">
            <div className="text-4xl font-light mb-1 text-white">{metrics.macro_recall.toFixed(3)}</div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">macro recall</p>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="border border-neutral-700 mb-16">
          <div className="border-b border-neutral-700 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">performance statistics</h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="text-3xl font-light mb-1 text-white">{metrics.samples_processed}</div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">samples processed</p>
              </div>
              <div>
                <div className="text-3xl font-light mb-1 text-white">{metrics.feedback_count}</div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">feedback received</p>
              </div>
              <div>
                <div className="text-3xl font-light mb-1 text-white">{metrics.latency_ms}ms</div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">avg latency</p>
              </div>
              <div>
                <div className="text-3xl font-light mb-1 text-white">{metrics.throughput_per_second}/s</div>
                <p className="text-xs uppercase tracking-wider text-neutral-500">throughput</p>
              </div>
            </div>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="border border-neutral-700 mb-16">
          <div className="border-b border-neutral-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">confusion matrix</h2>
            <button
              onClick={() => setShowMatrixInfo(true)}
              className="p-2 border border-neutral-700 text-neutral-400 hover:border-yellow-400 hover:text-white transition-colors"
              title="About Confusion Matrix"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="p-6 overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Y-axis label */}
              <div className="flex items-center mb-4">
                <div className="w-32" />
                <div className="flex-1 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">predicted label</p>
                </div>
              </div>
              
              <div className="flex">
                {/* Y-axis labels */}
                <div className="flex flex-col items-end pr-4 pt-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4 -rotate-90 origin-center translate-y-24">
                    true label
                  </p>
                </div>

                <div className="flex-1">
                  {/* Column headers */}
                  <div className="flex mb-2">
                    <div className="w-32" />
                    {metrics.confusion_matrix.labels.map((label) => (
                      <div key={label} className="w-20 text-center">
                        <p className="text-xs font-mono text-neutral-400 transform -rotate-45 origin-bottom-left ml-6">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Matrix cells */}
                  {metrics.confusion_matrix.matrix.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex items-center mb-1">
                      <div className="w-32 text-right pr-4">
                        <p className="text-xs font-mono text-neutral-400">
                          {metrics.confusion_matrix.labels[rowIdx]}
                        </p>
                      </div>
                      {row.map((value, colIdx) => {
                        const isCorrect = rowIdx === colIdx;
                        return (
                          <div
                            key={colIdx}
                            className="w-20 h-16 flex items-center justify-center border border-neutral-800 relative group"
                            style={{
                              backgroundColor: getHeatmapColor(value, maxValue),
                            }}
                          >
                            <span className={`text-sm font-mono ${isCorrect ? 'text-white font-semibold' : 'text-neutral-300'}`}>
                              {value}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white text-black text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-neutral-300">
                              True: {metrics.confusion_matrix.labels[rowIdx]}<br />
                              Pred: {metrics.confusion_matrix.labels[colIdx]}<br />
                              Count: {value}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center gap-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">intensity:</p>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-4 bg-gradient-to-r from-blue-500/20 via-yellow-400/50 to-green-500" />
                  <p className="text-xs text-neutral-400">low → high</p>
                </div>
                <div className="ml-6 flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500/80" />
                  <p className="text-xs text-neutral-400">diagonal = correct predictions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Class Metrics Table */}
        <div className="border border-neutral-700 mb-16">
          <div className="border-b border-neutral-700 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">per-class metrics</h2>
            <div className="flex gap-2">
              <button
                onClick={() => exportReport('csv')}
                className="text-xs px-4 py-2 border border-neutral-700 text-white hover:border-yellow-400 transition-colors flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                CSV
              </button>
              <button
                onClick={() => exportReport('json')}
                className="text-xs px-4 py-2 border border-neutral-700 text-white hover:border-blue-500 transition-colors flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                JSON
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">category</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">precision</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">recall</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">f1-score</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white">support</th>
                </tr>
              </thead>
              <tbody>
                {metrics.per_class_metrics.map((metric, idx) => (
                  <tr key={metric.category} className={`border-b border-neutral-800 hover:bg-neutral-900 transition-colors ${idx % 2 === 0 ? 'bg-black' : 'bg-neutral-950'}`}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-white">{metric.category}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-24 h-1 bg-neutral-800">
                          <div
                            className="h-full bg-yellow-400 transition-all"
                            style={{ width: `${metric.precision * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono text-white w-12 text-left">{metric.precision.toFixed(3)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-24 h-1 bg-neutral-800">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${metric.recall * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono text-white w-12 text-left">{metric.recall.toFixed(3)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-24 h-1 bg-neutral-800">
                          <div
                            className="h-full bg-white transition-all"
                            style={{ width: `${metric.f1 * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono text-white w-12 text-left">{metric.f1.toFixed(3)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-mono text-white">{metric.support}</span>
                    </td>
                  </tr>
                ))}
                {/* Summary row */}
                <tr className="border-t-2 border-neutral-700 bg-neutral-900">
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold uppercase tracking-wider text-white">macro average</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-mono font-semibold text-white">{metrics.macro_precision.toFixed(3)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-mono font-semibold text-white">{metrics.macro_recall.toFixed(3)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-mono font-semibold text-white">{metrics.macro_f1.toFixed(3)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-mono font-semibold text-white">{metrics.samples_processed}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretation Guide */}
        <div className="border border-neutral-700">
          <div className="border-b border-neutral-700 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">interpreting the results</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Macro F1-Score: {metrics.macro_f1.toFixed(3)}</h3>
              <p className="text-sm text-neutral-400 font-light leading-relaxed">
                The macro F1-score averages the F1-scores across all categories, giving equal weight to each category 
                regardless of support. A score of <strong className="text-white">{metrics.macro_f1.toFixed(3)}</strong> exceeds 
                the required threshold of 0.90, indicating strong overall performance across all transaction categories.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Confusion Matrix Analysis</h3>
              <p className="text-sm text-neutral-400 font-light leading-relaxed">
                The confusion matrix visualizes true labels (rows) vs predicted labels (columns). Diagonal values represent 
                correct predictions, while off-diagonal values indicate misclassifications. High diagonal values and low 
                off-diagonal values indicate strong model performance.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Per-Class Metrics</h3>
              <p className="text-sm text-neutral-400 font-light leading-relaxed">
                <strong className="text-white">Precision</strong> measures the accuracy of positive predictions 
                (what % of predicted category X is actually category X). <strong className="text-white">Recall</strong> measures 
                the coverage of actual positives (what % of actual category X was correctly predicted). 
                <strong className="text-white"> F1-score</strong> is the harmonic mean of precision and recall.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Confusion Matrix Info Dialog */}
      <Dialog open={showMatrixInfo} onOpenChange={setShowMatrixInfo}>
        <DialogContent className="bg-black border-2 border-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold uppercase tracking-wider text-white">
              understanding the confusion matrix
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              A confusion matrix is a table that visualizes the performance of a classification model by comparing 
              true labels (actual categories) against predicted labels (model predictions).
            </p>

            <div className="border border-neutral-700 p-4 bg-neutral-900">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-2">how to read it</h3>
              <ul className="text-sm text-neutral-400 font-light space-y-2">
                <li><strong className="text-white">Rows:</strong> True category (what the transaction actually was)</li>
                <li><strong className="text-white">Columns:</strong> Predicted category (what the model predicted)</li>
                <li><strong className="text-white">Diagonal values:</strong> Correct predictions (darker green = higher accuracy)</li>
                <li><strong className="text-white">Off-diagonal values:</strong> Misclassifications (should be minimized)</li>
              </ul>
            </div>

            <div className="border border-neutral-700 p-4 bg-neutral-900">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-2">example interpretation</h3>
              <p className="text-sm text-neutral-400 font-light leading-relaxed mb-2">
                If the cell at row "Groceries" and column "Dining" shows a value of 3, it means:
              </p>
              <p className="text-sm text-white font-light leading-relaxed">
                "3 transactions that were actually <strong>Groceries</strong> were incorrectly predicted as <strong>Dining</strong>"
              </p>
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <p className="text-xs text-neutral-500 font-light leading-relaxed">
                <strong className="text-neutral-400">Note:</strong> A perfect model would have all values on the diagonal 
                and zeros everywhere else. In practice, some misclassifications are expected, especially for categories 
                with similar characteristics.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
