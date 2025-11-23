import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // Categories matching the DEFAULT_CATEGORIES in constants
  const categories = [
    'Groceries',
    'Dining', 
    'Fuel',
    'Shopping',
    'Bills',
    'Entertainment',
    'Transport',
    'Healthcare',
    'Other'
  ];

  // Generate realistic confusion matrix
  // Rows = true labels, Columns = predicted labels
  const confusionMatrix = [
    // Groceries: [Groceries, Dining, Fuel, Shopping, Bills, Entertainment, Transport, Healthcare, Other]
    [112, 3, 0, 5, 0, 0, 0, 2, 3],  // True: Groceries
    [2, 138, 0, 3, 0, 1, 0, 0, 6],  // True: Dining
    [0, 0, 141, 0, 0, 0, 2, 0, 2],  // True: Fuel
    [4, 2, 0, 126, 0, 3, 0, 0, 5],  // True: Shopping
    [0, 0, 0, 0, 128, 0, 0, 1, 6],  // True: Bills
    [0, 1, 0, 2, 0, 139, 1, 0, 2],  // True: Entertainment
    [0, 0, 3, 0, 0, 2, 117, 0, 8],  // True: Transport
    [1, 0, 0, 0, 2, 0, 0, 118, 9],  // True: Healthcare
    [5, 4, 1, 6, 3, 2, 3, 2, 94],   // True: Other
  ];

  // Calculate per-class metrics from confusion matrix
  const perClassMetrics = categories.map((category, idx) => {
    const row = confusionMatrix[idx];
    const truePositives = row[idx];
    const falseNegatives = row.reduce((sum, val, i) => i !== idx ? sum + val : sum, 0);
    
    const falsePositives = confusionMatrix.reduce((sum, r, i) => {
      return i !== idx ? sum + r[idx] : sum;
    }, 0);
    
    const trueNegatives = confusionMatrix.reduce((sum, r, i) => {
      return sum + r.reduce((rowSum, val, j) => {
        return (i !== idx && j !== idx) ? rowSum + val : rowSum;
      }, 0);
    }, 0);

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1 = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      category,
      precision: parseFloat(precision.toFixed(3)),
      recall: parseFloat(recall.toFixed(3)),
      f1: parseFloat(f1.toFixed(3)),
      support: row.reduce((a, b) => a + b, 0),
    };
  });

  // Calculate macro averages
  const macroF1 = perClassMetrics.reduce((sum, m) => sum + m.f1, 0) / categories.length;
  const macroPrecision = perClassMetrics.reduce((sum, m) => sum + m.precision, 0) / categories.length;
  const macroRecall = perClassMetrics.reduce((sum, m) => sum + m.recall, 0) / categories.length;

  // Calculate overall accuracy
  const totalCorrect = confusionMatrix.reduce((sum, row, idx) => sum + row[idx], 0);
  const totalSamples = confusionMatrix.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);
  const accuracy = totalCorrect / totalSamples;

  return NextResponse.json({
    macro_f1: parseFloat(macroF1.toFixed(3)),
    macro_precision: parseFloat(macroPrecision.toFixed(3)),
    macro_recall: parseFloat(macroRecall.toFixed(3)),
    accuracy: parseFloat(accuracy.toFixed(3)),
    samples_processed: totalSamples,
    feedback_count: 42,
    per_class_f1: Object.fromEntries(
      perClassMetrics.map(m => [m.category, m.f1])
    ),
    per_class_metrics: perClassMetrics,
    confusion_matrix: {
      labels: categories,
      matrix: confusionMatrix,
    },
    latency_ms: 30,
    throughput_per_second: 33,
  });
}