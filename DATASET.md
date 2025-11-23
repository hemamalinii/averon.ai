# Dataset Documentation

## Overview

This document provides comprehensive information about the dataset format, preprocessing steps, and guidelines for creating custom datasets for the Averon.ai transaction categorization system.

---

## Dataset Format

### Supported File Formats

The system accepts two file formats:
1. **CSV (Comma-Separated Values)**
2. **JSON (JavaScript Object Notation)**

### Required Fields

Each transaction record must contain the following fields:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `description` | String | ✓ | Transaction description/memo | "STARBUCKS COFFEE #2390" |
| `amount` | Number | ✓ | Transaction amount (USD) | 5.45 |
| `merchant_name` | String | ✗ | Merchant/vendor name | "Starbucks" |

### CSV Format

**Structure:**
```csv
description,amount,merchant_name
STARBUCKS COFFEE #2390,5.45,Starbucks
SHELL PETROL STATION,45.00,Shell
AMAZON MARKETPLACE PURCHASE,89.99,Amazon
WHOLE FOODS MARKET,73.45,Whole Foods
```

**Requirements:**
- First row MUST contain headers (case-insensitive)
- Fields separated by commas
- Text fields can be quoted with double quotes
- Numeric fields should not contain currency symbols
- File encoding: UTF-8

**Alternative Header Names:**
The system accepts multiple header variations:
- Description: `description`, `transaction`, `memo`, `desc`
- Amount: `amount`, `value`, `total`, `price`
- Merchant: `merchant_name`, `merchantName`, `merchant`, `vendor`

### JSON Format

**Structure:**
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
  },
  {
    "description": "AMAZON MARKETPLACE PURCHASE",
    "amount": 89.99,
    "merchant_name": "Amazon"
  }
]
```

**Requirements:**
- Root element MUST be an array
- Each object represents one transaction
- Field names are case-sensitive
- Amount should be a number (not string)
- Valid JSON syntax required

---

## Data Preprocessing

### Automated Preprocessing Pipeline

The system automatically applies the following preprocessing steps to all uploaded transactions:

#### 1. Text Normalization

**Case Normalization:**
```
Input:  "STARBUCKS COFFEE"
Output: "starbucks coffee"
```

**Whitespace Handling:**
- Multiple consecutive spaces → single space
- Leading/trailing whitespace removed
- Tab characters → single space

**Special Character Handling:**
- Non-alphanumeric characters preserved for context
- Currency symbols removed from descriptions
- Common separators (-, /, #) retained

#### 2. Tokenization

**Word-Level Tokenization:**
```
Input:  "STARBUCKS COFFEE #2390"
Tokens: ["starbucks", "coffee", "#2390"]
```

**Merchant Name Extraction:**
- Automatically identifies merchant patterns
- Extracts store numbers and location codes
- Preserves brand identifiers

#### 3. Feature Engineering

**Amount Binning:**
```
< $10      → "micro"
$10-$50    → "small"
$50-$200   → "medium"
$200-$1000 → "large"
> $1000    → "extra_large"
```

**Temporal Features (if date provided):**
- Day of week
- Time of day (morning/afternoon/evening/night)
- Month/season

#### 4. Noise Handling

**Typo Correction:**
- Common misspellings automatically corrected
- Fuzzy matching for merchant names
- Minimum edit distance algorithm

**Duplicate Detection:**
- Identifies near-duplicate transactions
- Flags potential data quality issues
- Preserves all records (non-destructive)

---

## Creating Custom Datasets

### Dataset Requirements

**Minimum Dataset Size:**
- Training: 500-1000 transactions recommended
- Each category: 50+ examples minimum
- Balanced distribution preferred (but not required)

**Quality Guidelines:**

1. **Diversity:**
   - Include various merchants per category
   - Mix of transaction amounts
   - Different description formats

2. **Labeling Accuracy:**
   - Consistent category assignments
   - Clear category definitions
   - Handle edge cases explicitly

3. **Representativeness:**
   - Reflect real-world transaction patterns
   - Include common and uncommon transactions
   - Cover seasonal variations

### Category Design Best Practices

**Taxonomy Guidelines:**

1. **Mutually Exclusive:**
   - Categories should not overlap
   - Clear boundaries between categories
   - Document edge cases

2. **Collectively Exhaustive:**
   - Cover all transaction types
   - Include "Other" category for miscellaneous
   - Plan for future expansion

3. **Granularity:**
   - Not too broad (e.g., "Expenses")
   - Not too specific (e.g., "Organic Groceries from Trader Joe's")
   - Optimal: 5-20 categories

**Example Taxonomy:**

```
✅ GOOD:
- Groceries
- Dining
- Fuel
- Shopping
- Bills
- Entertainment
- Transport
- Healthcare

❌ TOO BROAD:
- Expenses
- Purchases
- Services

❌ TOO SPECIFIC:
- Fast Food Restaurants
- Coffee Shops
- Sit-Down Restaurants
- Food Trucks
```

### Sample Dataset Template

**CSV Template:**
```csv
description,amount,merchant_name,category
STARBUCKS COFFEE,5.45,Starbucks,Dining
WHOLE FOODS,73.45,Whole Foods,Groceries
SHELL GAS STATION,45.00,Shell,Fuel
NETFLIX SUBSCRIPTION,15.99,Netflix,Entertainment
UBER RIDE,24.50,Uber,Transport
ELECTRIC BILL,120.00,Power Co,Bills
CVS PHARMACY,32.15,CVS,Healthcare
AMAZON PURCHASE,89.99,Amazon,Shopping
```

**JSON Template:**
```json
[
  {
    "description": "STARBUCKS COFFEE",
    "amount": 5.45,
    "merchant_name": "Starbucks",
    "category": "Dining"
  },
  {
    "description": "WHOLE FOODS",
    "amount": 73.45,
    "merchant_name": "Whole Foods",
    "category": "Groceries"
  }
]
```

### Data Collection Strategies

**1. Export from Financial Institutions:**
- Download CSV/OFX from bank
- Use bank's API if available
- Aggregate multiple accounts

**2. Manual Entry:**
- Use provided template
- Validate before upload
- Start small, expand gradually

**3. Synthetic Data Generation:**
- Use demographic patterns
- Include realistic merchants
- Vary amounts appropriately

**4. Public Datasets:**
- Kaggle financial datasets
- Academic research data
- Anonymized transaction datasets

---

## Data Validation

### Pre-Upload Validation Checklist

Before uploading your dataset, verify:

- [ ] File format is CSV or JSON
- [ ] Required fields present (description, amount)
- [ ] No missing values in required fields
- [ ] Amount values are numeric
- [ ] File encoding is UTF-8
- [ ] File size < 10MB
- [ ] At least 50 transactions (for meaningful results)

### Validation Errors

**Common Issues:**

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid file format" | Wrong file extension | Save as .csv or .json |
| "Missing required field" | Column name mismatch | Use correct header names |
| "Invalid amount" | Non-numeric value | Remove currency symbols |
| "Empty file" | No data rows | Add transaction records |
| "Parse error" | Malformed JSON/CSV | Validate syntax |

---

## Dataset Statistics

### Demo Dataset Characteristics

The provided demo dataset contains:

- **Total Transactions:** 8
- **Categories:** 8 (Groceries, Dining, Fuel, Shopping, Bills, Entertainment, Transport, Healthcare)
- **Amount Range:** $5.45 - $120.00
- **Confidence Distribution:**
  - High (≥85%): 3 transactions (37.5%)
  - Medium (65-84%): 3 transactions (37.5%)
  - Low (<65%): 2 transactions (25%)

### Production Dataset Recommendations

For optimal model performance:

- **Training Set:** 5,000-10,000 transactions
- **Validation Set:** 1,000-2,000 transactions
- **Test Set:** 500-1,000 transactions
- **Category Balance:** ±20% variance acceptable
- **Temporal Coverage:** 6-12 months of data

---

## Evaluation Metrics

### Dataset Quality Indicators

**Coverage Score:**
```
Coverage = (Categories with ≥50 samples) / (Total categories)
Target: ≥ 0.80
```

**Balance Ratio:**
```
Balance = (Min category size) / (Max category size)
Target: ≥ 0.30
```

**Noise Level:**
```
Noise = (Transactions with low confidence) / (Total transactions)
Target: ≤ 0.20
```

### Model Performance by Dataset Size

| Dataset Size | Expected Macro F1 | Expected Accuracy |
|--------------|-------------------|-------------------|
| 500-1,000    | 0.75-0.85        | 0.78-0.87        |
| 1,000-5,000  | 0.85-0.90        | 0.87-0.92        |
| 5,000-10,000 | 0.90-0.95        | 0.92-0.95        |
| 10,000+      | 0.95+            | 0.95+            |

---

## Privacy & Security

### Data Handling

**Storage:**
- All data encrypted at rest
- Database access controlled via authentication
- User data isolated by user_id

**Processing:**
- No data sent to external APIs
- All processing occurs in-house
- Temporary processing data cleared after categorization

**Retention:**
- Transactions stored indefinitely (user deletable)
- Predictions linked to transactions
- Feedback stored for model improvement

### Anonymization Guidelines

When sharing datasets:

1. **Remove PII:**
   - Account numbers
   - Personal names
   - Phone numbers
   - Email addresses

2. **Generalize Locations:**
   - Remove specific addresses
   - Keep city/region if relevant
   - Use generic merchant names

3. **Aggregate Amounts:**
   - Round to nearest dollar
   - Group into ranges
   - Preserve relative magnitudes

---

## Troubleshooting

### Common Dataset Issues

**Issue: Low Model Accuracy**

Possible causes:
- Insufficient training data
- Unbalanced category distribution
- Poor category definitions
- High label noise

Solutions:
- Collect more data (target 1,000+ transactions)
- Balance categories via oversampling/undersampling
- Refine taxonomy definitions
- Review and correct labels

**Issue: High Confidence on Incorrect Predictions**

Possible causes:
- Overfitting to training patterns
- Ambiguous transactions
- Category overlap

Solutions:
- Provide feedback on incorrect predictions
- Add diverse examples to training set
- Refine category boundaries

**Issue: Many Low Confidence Predictions**

Possible causes:
- Novel transaction types
- Insufficient category examples
- Ambiguous descriptions

Solutions:
- Add similar transactions to training set
- Provide merchant_name when available
- Use more descriptive categories

---

## API Integration

### Bulk Upload Endpoint

```bash
POST /api/transactions/bulk
Content-Type: application/json
Authorization: Bearer <token>

{
  "transactions": [
    {
      "description": "STARBUCKS COFFEE",
      "amount": 5.45,
      "merchantName": "Starbucks",
      "userId": "<user_id>"
    }
  ]
}
```

### Response Format

```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "description": "STARBUCKS COFFEE",
      "amount": 5.45,
      "merchantName": "Starbucks",
      "userId": "<user_id>",
      "createdAt": "2025-11-22T14:55:00Z"
    }
  ],
  "count": 1
}
```

---

## Additional Resources

### Recommended Reading

- **Data Preprocessing:** [scikit-learn preprocessing](https://scikit-learn.org/stable/modules/preprocessing.html)
- **Text Classification:** [Hugging Face Text Classification](https://huggingface.co/docs/transformers/tasks/sequence_classification)
- **SHAP Explainability:** [SHAP Documentation](https://shap.readthedocs.io/)

### Dataset Examples

Available in the repository:
- `demo_transactions.csv` - 8 sample transactions
- `template.csv` - Empty template for data entry
- `sample_large.json` - 100 synthetic transactions (coming soon)

### Support

For dataset-related questions:
- Review this documentation
- Check the FAQ in README.md
- Refer to upload page instructions at `/upload`

---

## Changelog

**v1.0.0 (November 2025)**
- Initial dataset documentation
- CSV and JSON format specifications
- Preprocessing pipeline documentation
- Custom dataset guidelines
- Validation and troubleshooting guides
