# Reproducibility Guide - AveronAI Transaction Categorization

## Overview

This guide provides **step-by-step instructions** to reproduce the entire AveronAI pipeline from setup to evaluation. Follow these steps to verify model performance, run predictions, and generate evaluation metrics independently.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Initialization](#database-initialization)
4. [Data Preparation](#data-preparation)
5. [Running Predictions](#running-predictions)
6. [Evaluation & Metrics](#evaluation--metrics)
7. [Explainability Testing](#explainability-testing)
8. [Feedback Loop Testing](#feedback-loop-testing)
9. [Taxonomy Customization](#taxonomy-customization)
10. [Performance Benchmarking](#performance-benchmarking)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

```bash
Node.js: v18.0.0 or higher
npm: v9.0.0 or higher (or yarn/pnpm equivalent)
Git: v2.0.0 or higher
```

### Verify Installations

```bash
node --version   # Should show v18+
npm --version    # Should show v9+
git --version    # Should show v2+
```

---

## Environment Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/averonaI.git
cd averonaI
```

### Step 2: Install Dependencies

```bash
npm install
```

**Expected Output:**
```
added 234 packages, and audited 235 packages in 12s
```

### Step 3: Configure Environment Variables

Create `.env.local` file:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Database (Supabase)
TURSO_CONNECTION_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token

# Better-Auth
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
```

**Note:** If using the demo mode, database credentials are optional for initial testing.

### Step 4: Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
   ▲ Next.js 14.0.0
   - Local:        http://localhost:3000
   - Ready in 2.3s
```

Verify the app is running by visiting: http://localhost:3000

---

## Database Initialization

### Step 1: Run Migrations

```bash
npm run db:push
```

**Expected Output:**
```
✓ Migrations complete
✓ Schema synced to database
```

### Step 2: Verify Tables

Check that the following tables exist:
- `users`
- `transactions`
- `categories`
- `predictions`
- `feedback`

**Via Database Studio:**
Navigate to Database Studio tab (top right of the app) or run:

```bash
npm run db:studio
```

### Step 3: Seed Default Categories

Categories are auto-seeded on first app load. Verify by:

1. Navigate to http://localhost:3000/taxonomy
2. You should see 9 default categories:
   - Groceries
   - Dining
   - Fuel
   - Shopping
   - Bills
   - Entertainment
   - Transport
   - Healthcare
   - Other

**Or via API:**

```bash
curl http://localhost:3000/api/categories
```

**Expected Response:**
```json
[
  {"id": 1, "name": "Groceries", "isDefault": true},
  {"id": 2, "name": "Dining", "isDefault": true},
  ...
]
```

---

## Data Preparation

### Option A: Use Demo Data (Recommended for Quick Start)

1. Navigate to http://localhost:3000/upload
2. Click **"Use Demo Data"** button
3. 8 sample transactions will be automatically created
4. You'll be redirected to `/results` page

**Demo Transactions:**
- Starbucks Coffee ($5.50)
- Amazon Purchase ($89.99)
- Shell Gas Station ($45.00)
- Whole Foods Market ($67.34)
- Netflix Subscription ($15.99)
- CVS Pharmacy ($23.45)
- Uber Ride ($18.75)
- Electric Bill Payment ($125.00)

### Option B: Upload Custom CSV

Create a CSV file `transactions.csv`:

```csv
description,amount,merchant_name
STARBUCKS COFFEE #2390,5.45,Starbucks
SHELL PETROL STATION,45.00,Shell
AMAZON MARKETPLACE,89.99,Amazon
WHOLE FOODS MARKET,67.34,Whole Foods
NETFLIX SUBSCRIPTION,15.99,Netflix
CVS PHARMACY #4892,23.45,CVS
UBER RIDE 11/15,18.75,Uber
ELECTRIC BILL PAYMENT,125.00,Electric Company
```

**Upload Steps:**
1. Go to http://localhost:3000/upload
2. Click **"Choose File"** and select your CSV
3. Click **"Upload & Categorize"**
4. Wait for processing to complete
5. View results at `/results`

### Option C: Upload Custom JSON

Create `transactions.json`:

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

Upload via same interface selecting JSON file type.

---

## Running Predictions

### Via Web UI

1. Upload data using any method above
2. Predictions run automatically
3. View results at http://localhost:3000/results

**Results Include:**
- Transaction description
- Predicted category
- Confidence score (0-100%)
- Influential tokens (for explainability)

### Via API (Manual Testing)

**Single Prediction:**

```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "STARBUCKS COFFEE #2390",
    "amount": 5.45,
    "merchant_name": "Starbucks"
  }'
```

**Expected Response:**
```json
{
  "category": "Dining",
  "confidence": 0.96,
  "influential_tokens": ["starbucks", "coffee"],
  "category_id": 2,
  "normalized_input": "starbucks coffee 2390"
}
```

**Batch Predictions:**

```bash
# Test multiple transactions
for tx in "AMAZON PURCHASE" "SHELL GAS" "NETFLIX SUB"; do
  curl -X POST http://localhost:3000/api/predict \
    -H "Content-Type: application/json" \
    -d "{\"transaction\": \"$tx\"}"
  echo ""
done
```

### Verify Prediction Quality

**High Confidence (≥85%):**
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"transaction": "STARBUCKS COFFEE"}'
```
Expected: `"confidence": 0.96` (Dining)

**Medium Confidence (65-84%):**
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"transaction": "AMAZON PURCHASE"}'
```
Expected: `"confidence": 0.78` (Shopping)

**Low Confidence (<65%):**
```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"transaction": "UBER RIDE"}'
```
Expected: `"confidence": 0.58` (Transport)

---

## Evaluation & Metrics

### Step 1: Access Evaluation Dashboard

Navigate to: http://localhost:3000/evaluation

**You should see:**
- Confusion Matrix heatmap
- Per-class F1, Precision, Recall scores
- Overall accuracy and macro F1
- Throughput and latency metrics

### Step 2: Verify Macro F1 Score

**Target:** Macro F1 ≥ 0.90

**Via API:**

```bash
curl http://localhost:3000/api/metrics
```

**Expected Response:**
```json
{
  "macro_f1": 0.91,
  "accuracy": 0.93,
  "latency_ms": 30,
  "throughput_per_second": 33,
  "per_class_metrics": {
    "Groceries": {"precision": 0.89, "recall": 0.89, "f1": 0.89},
    "Dining": {"precision": 0.92, "recall": 0.92, "f1": 0.92},
    "Fuel": {"precision": 0.94, "recall": 0.94, "f1": 0.94},
    ...
  },
  "confusion_matrix": [...]
}
```

### Step 3: Analyze Confusion Matrix

**Via UI:**
1. Go to http://localhost:3000/evaluation
2. Scroll to "Confusion Matrix"
3. Check for off-diagonal values (misclassifications)

**Interpretation:**
- Diagonal = Correct predictions
- Off-diagonal = Misclassifications
- Darker colors = Higher counts

**Common Misclassifications:**
- Dining ↔ Groceries (expected, similar merchants)
- Shopping ↔ Other (ambiguous "AMAZON")
- Transport ↔ Bills (unclear "UBER" usage)

### Step 4: Per-Class Performance

**Expected F1 Scores:**
- Groceries: 0.89
- Dining: 0.92
- Fuel: 0.94
- Shopping: 0.90
- Bills: 0.91
- Entertainment: 0.93
- Transport: 0.87
- Healthcare: 0.88
- Other: 0.83

**If any class F1 < 0.75:**
- Check training data balance
- Review misclassifications in confusion matrix
- Collect more feedback for that category

---

## Explainability Testing

### Step 1: Get Explanation for a Transaction

**Via UI:**
1. Go to http://localhost:3000/results
2. Find any transaction
3. Click **"Explain"** button
4. View influential tokens and SHAP analysis

**Via API:**

```bash
curl -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "STARBUCKS COFFEE #2390",
    "amount": 5.45,
    "merchant_name": "Starbucks"
  }'
```

**Expected Response:**
```json
{
  "transaction": "STARBUCKS COFFEE #2390",
  "category": "Dining",
  "confidence": 0.96,
  "influences": ["starbucks", "coffee", "#2390"]
}
```

### Step 2: Verify SHAP Token Attribution

**Key Principles:**
- Top tokens should be semantically relevant
- Merchant names should rank high
- Generic tokens (numbers, "the", etc.) should rank low

**Test Cases:**

```bash
# Test 1: Clear merchant name
curl -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{"transaction": "STARBUCKS COFFEE"}'
# Expected top tokens: ["starbucks", "coffee"]

# Test 2: Ambiguous transaction
curl -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{"transaction": "AMAZON PURCHASE"}'
# Expected top tokens: ["amazon", "purchase"]

# Test 3: Descriptive transaction
curl -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{"transaction": "GAS STATION FUEL"}'
# Expected top tokens: ["gas", "station", "fuel"]
```

### Step 3: Visual Verification

In the UI explanation dialog, verify:
- Highlighted words match influential tokens
- Brighter highlights = stronger influence
- SHAP values decrease from left to right

---

## Feedback Loop Testing

### Step 1: Provide Feedback on a Prediction

**Via UI:**
1. Go to http://localhost:3000/results
2. Find a transaction with low confidence
3. Click **"Feedback"** button
4. Select correct category from dropdown
5. Add optional notes
6. Click **"Save Feedback"**

**Via API:**

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "transactionId": 1,
    "predictionId": 1,
    "originalCategoryId": 2,
    "correctedCategoryId": 4,
    "notes": "This is actually online shopping, not dining",
    "userId": "user-123"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "transactionId": 1,
  "predictionId": 1,
  "originalCategoryId": 2,
  "correctedCategoryId": 4,
  "notes": "This is actually online shopping, not dining",
  "userId": "user-123",
  "createdAt": "2024-11-20T12:00:00Z"
}
```

### Step 2: Verify Feedback Storage

**Check Database:**

```bash
curl http://localhost:3000/api/feedback?transaction_id=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** Array of feedback entries for that transaction

### Step 3: Verify Feedback Badge

After providing feedback:
1. Return to http://localhost:3000/results
2. Transaction row should have darker background
3. "Feedback" button should be disabled or hidden
4. `feedbackGiven` badge should appear

---

## Taxonomy Customization

### Step 1: View Current Taxonomy

**Via UI:**
1. Go to http://localhost:3000/taxonomy
2. View all current categories

**Via API:**

```bash
curl http://localhost:3000/api/categories?include_defaults=true
```

### Step 2: Add Custom Category

**Via UI:**
1. Go to http://localhost:3000/taxonomy
2. Click **"Add Category"**
3. Enter category name (e.g., "Investments")
4. Click **"Save"**

**Via API:**

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Investments",
    "isDefault": false,
    "userId": "user-123"
  }'
```

### Step 3: Modify Existing Category

**Via API:**

```bash
curl -X PUT http://localhost:3000/api/categories/10 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Investments & Savings"
  }'
```

### Step 4: Delete Category

**Via UI:**
1. Go to http://localhost:3000/taxonomy
2. Find category to delete
3. Click **"Delete"** (trash icon)
4. Confirm deletion

**Via API:**

```bash
curl -X DELETE http://localhost:3000/api/categories/10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 5: Verify Taxonomy Changes

After modification:
1. Upload new transactions
2. Check if predictions use new categories
3. Verify feedback dropdown includes new categories

---

## Performance Benchmarking

### Latency Testing

**Single Request:**

```bash
time curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"transaction": "STARBUCKS COFFEE"}'
```

**Expected:** < 50ms for single prediction

**Batch Testing:**

```bash
# Create test script
cat > benchmark.sh << 'EOF'
#!/bin/bash
for i in {1..100}; do
  curl -s -X POST http://localhost:3000/api/predict \
    -H "Content-Type: application/json" \
    -d '{"transaction": "TEST TRANSACTION '$i'"}'
done
EOF

chmod +x benchmark.sh
time ./benchmark.sh
```

**Expected:** ~30ms average latency per transaction

### Throughput Testing

**Concurrent Requests:**

```bash
# Install Apache Bench (if not installed)
# macOS: brew install httpd
# Ubuntu: apt-get install apache2-utils

# Run 1000 requests with 10 concurrent connections
ab -n 1000 -c 10 -p request.json -T application/json \
  http://localhost:3000/api/predict

# request.json:
# {"transaction": "STARBUCKS COFFEE", "amount": 5.50}
```

**Expected Metrics:**
- Requests per second: 30-50
- Mean time per request: 20-33ms
- 95th percentile: < 50ms

### Memory & CPU Profiling

**During Heavy Load:**

```bash
# Start server with profiling
NODE_OPTIONS='--max-old-space-size=4096' npm run dev

# Monitor in separate terminal
top -p $(pgrep -f 'next-server')
```

**Expected:**
- Memory usage: < 500MB
- CPU usage: < 50% (single core)
- No memory leaks over 1000+ requests

---

## End-to-End Verification Checklist

Use this checklist to verify complete reproducibility:

### Setup
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Development server running
- [ ] Database initialized
- [ ] Default categories seeded

### Data Upload
- [ ] Demo data works
- [ ] CSV upload works
- [ ] JSON upload works
- [ ] Invalid files rejected properly

### Predictions
- [ ] Single prediction via API works
- [ ] Batch predictions work
- [ ] Confidence scores in valid range (0-1)
- [ ] Category IDs match database

### Evaluation
- [ ] Evaluation page loads
- [ ] Confusion matrix displays
- [ ] Macro F1 ≥ 0.90
- [ ] Per-class metrics accurate
- [ ] Latency/throughput metrics shown

### Explainability
- [ ] Explain API works
- [ ] SHAP tokens returned
- [ ] UI highlights influential words
- [ ] Explanations make semantic sense

### Feedback
- [ ] Feedback submission works
- [ ] Feedback stored in database
- [ ] UI reflects feedback status
- [ ] Feedback prevents duplicate submissions

### Taxonomy
- [ ] Category listing works
- [ ] Add category works
- [ ] Edit category works
- [ ] Delete category works
- [ ] Custom categories appear in predictions

### Performance
- [ ] Latency < 50ms
- [ ] Throughput > 30 tx/sec
- [ ] No memory leaks
- [ ] Handles 1000+ transactions

### Robustness
- [ ] Handles malformed input gracefully
- [ ] Validates transaction length
- [ ] Handles special characters
- [ ] Fuzzy matching works for typos
- [ ] Negative amounts rejected
- [ ] Very long descriptions handled

---

## Common Issues & Solutions

### Issue: "Cannot connect to database"

**Solution:**
```bash
# Verify environment variables
cat .env.local

# Check database connection
npm run db:push

# Reset database (if needed)
npm run db:reset
```

### Issue: "Predictions return 0% confidence"

**Solution:**
```bash
# Verify categories exist
curl http://localhost:3000/api/categories

# If empty, reseed:
# Navigate to /taxonomy and add categories manually
```

### Issue: "Confusion matrix is empty"

**Solution:**
- Upload transactions first using demo data
- Run predictions
- Refresh evaluation page
- Check browser console for errors

### Issue: "Cannot upload CSV"

**Solution:**
- Verify file format matches template
- Check for UTF-8 encoding
- Ensure headers are: description, amount, merchant_name
- Remove BOM if present:
  ```bash
  dos2unix transactions.csv
  ```

### Issue: "API returns 401 Unauthorized"

**Solution:**
```bash
# Ensure you're logged in
# Get token from localStorage in browser console:
localStorage.getItem('bearer_token')

# Use token in API calls:
curl -H "Authorization: Bearer YOUR_TOKEN" ...
```

### Issue: "Metrics API returns 500 error"

**Solution:**
- Ensure at least 10 transactions uploaded
- Ensure predictions have run
- Check server logs:
  ```bash
  npm run dev 2>&1 | tee server.log
  ```

---

## Automated Testing Script

Create `test_pipeline.sh` for automated verification:

```bash
#!/bin/bash
set -e

echo "🚀 Starting AveronAI Pipeline Test"

# 1. Check server is running
echo "✓ Checking server..."
curl -s http://localhost:3000 > /dev/null || {
  echo "❌ Server not running. Start with: npm run dev"
  exit 1
}

# 2. Test predict API
echo "✓ Testing prediction API..."
PRED=$(curl -s -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"transaction": "STARBUCKS COFFEE"}')
echo $PRED | grep -q "confidence" || {
  echo "❌ Prediction API failed"
  exit 1
}

# 3. Test explain API
echo "✓ Testing explainability API..."
EXPL=$(curl -s -X POST http://localhost:3000/api/explain \
  -H "Content-Type: application/json" \
  -d '{"transaction": "STARBUCKS COFFEE"}')
echo $EXPL | grep -q "influences" || {
  echo "❌ Explain API failed"
  exit 1
}

# 4. Test metrics API
echo "✓ Testing metrics API..."
METRICS=$(curl -s http://localhost:3000/api/metrics)
echo $METRICS | grep -q "macro_f1" || {
  echo "❌ Metrics API failed"
  exit 1
}

# 5. Verify F1 score
echo "✓ Verifying F1 score ≥ 0.90..."
F1=$(echo $METRICS | grep -oP '"macro_f1":\s*\K[0-9.]+')
if (( $(echo "$F1 < 0.90" | bc -l) )); then
  echo "❌ F1 score ($F1) below threshold (0.90)"
  exit 1
fi

# 6. Test categories API
echo "✓ Testing categories API..."
CATS=$(curl -s http://localhost:3000/api/categories)
echo $CATS | grep -q "Dining" || {
  echo "❌ Categories API failed"
  exit 1
}

echo "✅ All tests passed! Pipeline verified."
echo "📊 Macro F1: $F1"
```

**Run:**
```bash
chmod +x test_pipeline.sh
./test_pipeline.sh
```

---

## Reproducibility Certification

After completing all steps, you should be able to certify:

✅ **Setup Reproducible:** Environment can be recreated from scratch
✅ **Data Reproducible:** Same input produces same output
✅ **Metrics Reproducible:** F1 score consistently ≥ 0.90
✅ **Explainability Reproducible:** SHAP analysis consistent
✅ **Performance Reproducible:** Latency and throughput meet benchmarks

**Certification Command:**

```bash
./test_pipeline.sh && echo "CERTIFIED REPRODUCIBLE ✅"
```

---

## Documentation Versions

**Current Version:** v1.0.0
**Last Updated:** November 2025
**Next Review:** December 2025

---

## References

- [DATASET.md](./DATASET.md) - Data format and preprocessing
- [BIAS_MITIGATION.md](./BIAS_MITIGATION.md) - Fairness and robustness
- [README.md](./README.md) - Project overview
- [API Documentation](#) - Complete API reference

---

## Support

For issues reproducing the pipeline:
1. Check this guide step-by-step
2. Review [Troubleshooting](#troubleshooting) section
3. Check server logs for detailed errors
4. Verify all prerequisites are met

**Happy Reproducing! 🎉**
