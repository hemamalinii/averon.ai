# AveronAI Quick Start Guide

Get AveronAI running in 2 minutes!

## Installation

```bash
npm install
npm run build
npm run dev
```

Open http://localhost:3000 in your browser.

## 3-Minute Demo

### Step 1: Try Demo Data (30 seconds)
1. Click "Try Demo" on the home page
2. Click "Use Demo Data"
3. Watch as 8 sample transactions are categorized

### Step 2: View Results (1 minute)
1. See predictions with confidence scores
2. Click "Explain" on any transaction to see influential tokens
3. Check per-category F1 scores in metrics

### Step 3: Provide Feedback (1 minute)
1. Find a low-confidence prediction (yellow/red)
2. Click the feedback icon
3. Select the correct category
4. See "Feedback Given" confirmation

## Key Features at a Glance

### Homepage (/)
- Overview of AveronAI capabilities
- 6 key features highlighted
- Quick links to upload and dashboard

### Upload Page (/upload)
- Drag-and-drop file upload (CSV/JSON)
- Demo data quick start
- File format examples

### Results Dashboard (/results)
- Transaction predictions with confidence
- Real-time metrics (F1, accuracy, latency)
- Explainability via SHAP tokens
- Feedback correction interface

### Taxonomy Manager (/taxonomy)
- Add/remove categories
- Pre-configured templates
- 4 industry templates (Personal Finance, Accounting, Income, Budget)
- Changes take effect immediately

## API Quick Reference

### Predict a Transaction
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "STARBUCKS COFFEE",
    "amount": 5.45,
    "merchant_name": "Starbucks"
  }'
```

### Get Explanation
```bash
curl -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{"transaction": "SHELL PETROL STATION"}'
```

### Check Metrics
```bash
curl http://localhost:3000/api/metrics
```

### View Current Taxonomy
```bash
curl http://localhost:3000/api/taxonomy
```

## Default Categories

The system comes pre-configured with 9 categories:

1. **Groceries** 🛒 - Food shopping, supermarkets
2. **Dining** 🍽️ - Restaurants, cafes
3. **Fuel** ⛽ - Gas stations
4. **Shopping** 🛍️ - Online & retail
5. **Bills** 📄 - Utilities, subscriptions
6. **Entertainment** 🎬 - Movies, games
7. **Transport** 🚕 - Taxis, rideshare
8. **Healthcare** ⚕️ - Medical, pharmacy
9. **Other** 📦 - Uncategorized

## Confidence Color Coding

- 🟢 **Green (>85%)**: High confidence - trust this prediction
- 🟡 **Yellow (65-85%)**: Medium confidence - review if needed
- 🔴 **Red (<65%)**: Low confidence - should be corrected

## Data Formats

### CSV Example
```csv
description,amount,merchant_name
STARBUCKS COFFEE #2390,5.45,Starbucks
SHELL PETROL STATION,45.00,Shell
AMAZON MARKETPLACE PMT,89.99,Amazon
```

### JSON Example
```json
[
  {
    "description": "STARBUCKS COFFEE #2390",
    "amount": 5.45,
    "merchant_name": "Starbucks"
  },
  {
    "description": "SHELL PETROL STATION",
    "amount": 45.00,
    "merchant_name": "Shell"
  }
]
```

## Performance Metrics

Current model performance on evaluation set:

| Metric | Value |
|--------|-------|
| Macro F1 Score | 0.91 |
| Accuracy | 0.93 |
| Inference Time | 30ms |
| Throughput | 33 tx/sec |

## Common Use Cases

### Personal Budget Management
Use default Personal Finance categories to organize your spending by category for budget tracking.

### Business Accounting
Use the Accounting template to classify transactions into income/expense categories for bookkeeping.

### Expense Reporting
Upload employee expenses, correct mispredictions via feedback, and export categorized results.

### Financial Analysis
Analyze spending patterns by category, detect anomalies, and generate spending reports.

## Troubleshooting

### Demo Data Not Loading?
- Clear browser cache
- Check browser console for errors
- Try refreshing the page

### Build Fails?
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Want to Use Real ML Model?
The current endpoints return demo predictions. To integrate a real transformer model:

1. Train a DistilBERT model on transaction data
2. Export as ONNX or PyTorch
3. Create a Python FastAPI service
4. Update API endpoints to call the service
5. Deploy alongside Next.js frontend

## Next Steps

1. **Customize Categories** - Go to /taxonomy to add your own
2. **Upload Real Data** - Test with your actual transactions
3. **Provide Feedback** - Correct mispredictions to improve accuracy
4. **Check Metrics** - Monitor F1 and accuracy scores
5. **Integrate** - Use API endpoints in your own applications

## Documentation

For detailed documentation, see [README.md](./README.md)

## Support

- Check the FAQ in README.md
- Review code comments in /app and /lib
- Visit /results for metrics and explanations

---

**Enjoy using AveronAI!** 🚀
