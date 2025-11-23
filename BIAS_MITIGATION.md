# Bias Mitigation & Robustness Documentation

## Overview

This document outlines the bias mitigation strategies, fairness considerations, and robustness mechanisms implemented in the Averon.ai transaction categorization system. Our goal is to ensure equitable, reliable, and ethically responsible AI performance across diverse transaction types, merchants, and user demographics.

---

## Table of Contents

1. [Types of Bias](#types-of-bias)
2. [Bias Detection Methods](#bias-detection-methods)
3. [Mitigation Strategies](#mitigation-strategies)
4. [Robustness to Noise](#robustness-to-noise)
5. [Ethical AI Principles](#ethical-ai-principles)
6. [Testing & Validation](#testing--validation)
7. [Continuous Monitoring](#continuous-monitoring)
8. [Reporting & Transparency](#reporting--transparency)

---

## Types of Bias

### 1. Merchant Bias

**Definition:** Disproportionate accuracy or confidence based on merchant name recognition.

**Manifestation:**
- Well-known brands (Starbucks, Amazon) → Higher confidence
- Local/regional merchants → Lower confidence
- Small businesses → Potential misclassification

**Example:**
```
Transaction: "JOE'S COFFEE SHOP"
Bias Risk: Lower confidence than "STARBUCKS" despite similar category
Impact: Unfair disadvantage to small businesses
```

**Mitigation:**
- Feature engineering that doesn't overweight brand names
- Training data includes diverse merchant types
- Confidence calibration across merchant tiers
- Regular audits of performance by merchant size

### 2. Regional Bias

**Definition:** Performance variations based on geographic location or regional naming conventions.

**Manifestation:**
- US merchants → Better recognition
- International transactions → Higher error rate
- Regional chains → Inconsistent categorization

**Example:**
```
Transaction: "TESCO SUPERMARKET" (UK)
Bias Risk: Misclassified due to training on US-centric data
Impact: Poor experience for international users
```

**Mitigation:**
- Multi-regional training data
- Location-agnostic feature extraction
- Explicit handling of currency/locale differences
- Performance monitoring by region

### 3. Amount Bias

**Definition:** Classification influenced by transaction amount rather than description.

**Manifestation:**
- High-value transactions → Biased toward certain categories
- Micropayments → Assumed to be specific categories
- Amount-category stereotyping

**Example:**
```
Transaction: "APPLE.COM $999"
Bias Risk: Assumed "Shopping" due to amount, actually "Bills" (subscription)
Impact: Incorrect categorization based on stereotypes
```

**Mitigation:**
- Amount treated as auxiliary feature (not primary)
- Category-agnostic amount normalization
- Training on diverse amount distributions per category
- Explicit validation that amount isn't sole decision factor

### 4. Temporal Bias

**Definition:** Model performance degradation over time due to changing patterns.

**Manifestation:**
- New merchants not recognized
- Evolving transaction formats
- Seasonal category shifts

**Example:**
```
Transaction: "CHATGPT PLUS SUBSCRIPTION" (new service)
Bias Risk: Misclassified due to novelty
Impact: Poor handling of emerging merchants
```

**Mitigation:**
- Continuous learning from user feedback
- Regular model updates
- Handling of unknown merchants
- Confidence penalties for novel patterns

### 5. Category Representation Bias

**Definition:** Over-representation of certain categories in training data.

**Manifestation:**
- Common categories → Higher accuracy
- Rare categories → Lower accuracy
- Imbalanced confusion matrix

**Example:**
```
Training Data:
- Groceries: 2000 samples → 95% accuracy
- Healthcare: 100 samples → 70% accuracy

Impact: Unfair performance across categories
```

**Mitigation:**
- Class balancing techniques (oversampling/undersampling)
- Weighted loss functions
- Per-class performance monitoring
- Minimum sample requirements per category

### 6. Description Format Bias

**Definition:** Performance varies based on transaction string format/structure.

**Manifestation:**
- Structured descriptions → Better performance
- Unstructured/noisy text → Lower accuracy
- Bank-specific formats → Format-dependent accuracy

**Example:**
```
Well-formed: "STARBUCKS COFFEE #2390" → 98% confidence
Poorly-formed: "COFFEE PURCHASE 11/22" → 52% confidence

Impact: Inconsistent user experience based on bank format
```

**Mitigation:**
- Robust text preprocessing
- Format-agnostic feature extraction
- Training on diverse description formats
- Explicit noise simulation in training

---

## Bias Detection Methods

### 1. Performance Auditing

**Confusion Matrix Analysis:**
- Identify categories with high false positive/negative rates
- Detect systematic misclassification patterns
- Compare per-class F1 scores

**Current Implementation:**
```
Available at: /evaluation page
Metrics Tracked:
- Per-class precision, recall, F1
- Confusion matrix visualization
- Category-wise performance gaps
```

### 2. Subgroup Analysis

**Merchant Tier Breakdown:**
```python
performance_by_merchant_tier = {
  "major_brands": {"f1": 0.95, "confidence_avg": 0.92},
  "regional_chains": {"f1": 0.88, "confidence_avg": 0.84},
  "local_business": {"f1": 0.78, "confidence_avg": 0.72}
}
```

**Amount Range Breakdown:**
```python
performance_by_amount = {
  "< $10": {"f1": 0.89, "confidence_avg": 0.87},
  "$10-$50": {"f1": 0.92, "confidence_avg": 0.90},
  "$50-$200": {"f1": 0.91, "confidence_avg": 0.89},
  "> $200": {"f1": 0.87, "confidence_avg": 0.83}
}
```

### 3. Confidence Calibration Analysis

**Expected vs Observed Accuracy:**
```
Confidence Range | Expected Accuracy | Observed Accuracy | Calibration Error
----------------|-------------------|-------------------|------------------
90-100%         | 95%               | 94%               | 1%
80-90%          | 85%               | 83%               | 2%
70-80%          | 75%               | 71%               | 4%
< 70%           | 60%               | 58%               | 2%
```

**Target:** Calibration error < 5% across all ranges

### 4. Explainability Analysis (SHAP)

**Bias Detection via Feature Importance:**
- Check if merchant name dominates predictions
- Verify amount feature weight is reasonable
- Identify unexpected feature dependencies

**Example SHAP Analysis:**
```
Transaction: "LOCAL CAFE $5.50"

Feature Contributions:
- "cafe" token: +0.42 (toward Dining)
- "local" token: +0.08
- amount $5.50: -0.03
- merchant unknown: -0.15 (bias detected!)

Issue: Unknown merchant penalty
Action: Reduce unknown merchant penalty
```

---

## Mitigation Strategies

### 1. Balanced Training Data

**Class Balancing:**
```python
# Ensure minimum samples per category
MIN_SAMPLES_PER_CATEGORY = 50

# Balance via stratified sampling
balanced_data = stratified_sample(
  data,
  target='category',
  n_samples=1000,
  random_state=42
)
```

**Synthetic Augmentation:**
- Generate diverse descriptions for underrepresented categories
- Vary merchant names within categories
- Include format variations

### 2. Feature Engineering

**Merchant-Agnostic Features:**
```python
features = {
  "keywords": extract_keywords(description),  # e.g., "coffee", "gas", "pharmacy"
  "patterns": detect_patterns(description),   # e.g., "subscription", "utility"
  "amount_bin": bin_amount(amount),          # Normalized ranges
  "description_length": len(description),
  "has_numbers": bool(re.search(r'\d', description))
}

# Avoid: merchant_name as primary feature
# Instead: merchant_type (if available) as auxiliary
```

**Amount Normalization:**
```python
# Prevent amount from dominating predictions
amount_normalized = (amount - category_mean) / category_std

# Weight amount feature appropriately
amount_weight = 0.15  # 15% max contribution
```

### 3. Confidence Calibration

**Post-Processing Calibration:**
```python
# Apply Platt scaling or isotonic regression
calibrated_confidence = calibrator.predict_proba(raw_confidence)

# Adjust confidence for known biases
if merchant_is_unknown:
  calibrated_confidence *= 0.9  # Slight penalty

if description_is_noisy:
  calibrated_confidence *= 0.85  # Larger penalty
```

### 4. Fairness Constraints

**Demographic Parity (if applicable):**
```
For each protected attribute (region, merchant tier):
  P(prediction = c | attribute = a1) ≈ P(prediction = c | attribute = a2)
```

**Equalized Odds:**
```
For each category and attribute:
  TPR(category, attr1) ≈ TPR(category, attr2)
  FPR(category, attr1) ≈ FPR(category, attr2)
```

### 5. Human-in-the-Loop Feedback

**Feedback Integration:**
```
User corrects: "AMAZON" from "Shopping" → "Groceries"

Action:
1. Store feedback in database
2. Flag for model retraining
3. Temporary rule: "AMAZON" + "FRESH" → "Groceries"
4. Periodic batch retraining with feedback data
```

**Feedback Weighting:**
- Recent feedback → Higher weight
- Consistent corrections → Higher confidence
- Conflicting feedback → Flag for review

---

## Robustness to Noise

### 1. Input Validation

**Character-Level Validation:**
```python
def validate_transaction(description: str) -> bool:
  # Check length
  if len(description) < 3 or len(description) > 500:
    return False
  
  # Check for excessive special characters
  special_char_ratio = count_special_chars(description) / len(description)
  if special_char_ratio > 0.5:
    return False
  
  # Check for minimum alphanumeric content
  alphanum_ratio = count_alphanumeric(description) / len(description)
  if alphanum_ratio < 0.3:
    return False
  
  return True
```

**Amount Validation:**
```python
def validate_amount(amount: float) -> bool:
  # Reasonable range
  if amount < 0 or amount > 1_000_000:
    return False
  
  # Precision check
  if len(str(amount).split('.')[-1]) > 2:
    return False  # More than 2 decimal places
  
  return True
```

### 2. Noise Handling

**Typo Tolerance:**
```python
# Fuzzy matching for common merchants
known_merchants = ["starbucks", "amazon", "walmart", "target"]
threshold = 0.85

for known in known_merchants:
  similarity = levenshtein_similarity(description_token, known)
  if similarity > threshold:
    description_token = known  # Normalize to known form
```

**Missing Data Handling:**
```python
# Graceful degradation when merchant_name missing
if merchant_name is None:
  # Rely more on description keywords
  confidence_adjustment = 0.9
else:
  confidence_adjustment = 1.0
```

### 3. Outlier Detection

**Transaction Outliers:**
```python
# Flag unusual transactions for manual review
outlier_score = isolation_forest.score(transaction_features)

if outlier_score < threshold:
  confidence *= 0.7  # Reduce confidence
  flag_for_review = True
```

**Amount Outliers:**
```python
# Per-category amount distribution
if amount > category_99th_percentile:
  confidence *= 0.8  # High amount uncertainty
  add_note("Unusually high amount for category")
```

### 4. Adversarial Robustness

**Input Perturbation Testing:**
```python
# Test model stability against small changes
original_pred = model.predict("STARBUCKS COFFEE")
perturbed_pred = model.predict("STARBUCKS C0FFEE")  # 0 instead of O

# Assert similar predictions
assert similar(original_pred, perturbed_pred, tolerance=0.05)
```

---

## Ethical AI Principles

### 1. Transparency

**User Awareness:**
- Explain how categorization works (via explainability features)
- Disclose confidence scores
- Provide SHAP-based explanations

**Documentation:**
- Public disclosure of bias mitigation efforts
- Regular publication of performance metrics
- Clear communication of system limitations

### 2. User Control

**Customization:**
- Users can define custom categories
- Manual overrides always respected
- Feedback mechanism for corrections

**Data Ownership:**
- Users own their transaction data
- Export functionality provided
- Deletion on request

### 3. Privacy Protection

**Data Minimization:**
- Only required fields collected
- No personally identifiable information (PII) stored
- Merchant names generalized where possible

**No External Sharing:**
- All processing in-house
- No third-party API calls
- No data sales or sharing

### 4. Accountability

**Error Handling:**
- Clear error messages
- Contact for support
- Regular system audits

**Performance Monitoring:**
- Continuous bias tracking
- Regular fairness audits
- Public reporting of metrics

### 5. Non-Discrimination

**Protected Attributes:**
- No direct use of demographic information
- Performance monitored across merchant types
- Equitable treatment regardless of transaction patterns

**Fairness Constraints:**
- Per-category performance targets
- Minimum accuracy thresholds
- Regular disparity audits

---

## Testing & Validation

### 1. Bias Testing Suite

**Test Cases:**

```python
# Test: Merchant Bias
def test_merchant_bias():
  # Same category, different merchants
  tx1 = {"description": "STARBUCKS COFFEE", "amount": 5.0}
  tx2 = {"description": "LOCAL CAFE COFFEE", "amount": 5.0}
  
  pred1 = model.predict(tx1)
  pred2 = model.predict(tx2)
  
  # Assert similar confidence
  assert abs(pred1.confidence - pred2.confidence) < 0.15
  # Assert same category
  assert pred1.category == pred2.category

# Test: Amount Bias
def test_amount_bias():
  # Same description, different amounts
  tx1 = {"description": "AMAZON PURCHASE", "amount": 10.0}
  tx2 = {"description": "AMAZON PURCHASE", "amount": 200.0}
  
  pred1 = model.predict(tx1)
  pred2 = model.predict(tx2)
  
  # Should predict same category despite amount difference
  assert pred1.category == pred2.category

# Test: Format Robustness
def test_format_robustness():
  variations = [
    "STARBUCKS COFFEE",
    "STARBUCKS COFFEE #2390",
    "Starbucks Coffee",
    "starbucks coffee",
    "STARBUCKS  COFFEE"  # double space
  ]
  
  predictions = [model.predict({"description": v, "amount": 5.0}) for v in variations]
  categories = [p.category for p in predictions]
  
  # All should predict same category
  assert len(set(categories)) == 1
```

### 2. Fairness Validation

**Metrics:**

```python
# Demographic Parity
def demographic_parity(predictions, attribute):
  groups = predictions.groupby(attribute)
  category_probs = groups['predicted_category'].value_counts(normalize=True)
  
  # Calculate max disparity
  disparity = category_probs.max() - category_probs.min()
  return disparity

# Target: disparity < 0.10

# Equalized Odds
def equalized_odds(y_true, y_pred, attribute):
  groups = groupby(attribute)
  
  tpr_by_group = {g: tpr(y_true[g], y_pred[g]) for g in groups}
  fpr_by_group = {g: fpr(y_true[g], y_pred[g]) for g in groups}
  
  tpr_disparity = max(tpr_by_group.values()) - min(tpr_by_group.values())
  fpr_disparity = max(fpr_by_group.values()) - min(fpr_by_group.values())
  
  return tpr_disparity, fpr_disparity

# Target: both disparities < 0.05
```

### 3. Robustness Testing

**Noise Injection:**

```python
def test_noise_robustness():
  clean_tx = "STARBUCKS COFFEE #2390"
  
  noise_variants = [
    add_typos(clean_tx, num_typos=2),
    add_extra_spaces(clean_tx),
    change_case_random(clean_tx),
    add_special_chars(clean_tx),
  ]
  
  clean_pred = model.predict(clean_tx)
  noisy_preds = [model.predict(v) for v in noise_variants]
  
  # Should maintain same category
  assert all(p.category == clean_pred.category for p in noisy_preds)
  
  # Confidence can drop but should stay reasonable
  assert all(p.confidence > 0.5 for p in noisy_preds)
```

---

## Continuous Monitoring

### 1. Performance Dashboards

**Metrics Tracked:**
- Overall macro F1 score
- Per-category F1 scores
- Confidence calibration error
- Feedback frequency by category
- Average confidence trends

**Alerting Thresholds:**
```
Alert if:
- Macro F1 drops below 0.88
- Any category F1 drops below 0.75
- Calibration error exceeds 0.10
- Feedback rate exceeds 20% for any category
```

### 2. Bias Monitoring

**Regular Audits:**
- Monthly: Per-category performance review
- Quarterly: Subgroup analysis (merchant tier, amount ranges)
- Annually: Comprehensive fairness audit

**Automated Checks:**
```python
# Run daily
def daily_bias_check():
  recent_predictions = get_last_24h_predictions()
  
  # Check merchant bias
  major_brand_f1 = compute_f1(recent_predictions, merchant_tier="major")
  local_business_f1 = compute_f1(recent_predictions, merchant_tier="local")
  
  if abs(major_brand_f1 - local_business_f1) > 0.15:
    alert("Merchant bias detected: F1 gap = {:.2f}".format(gap))
  
  # Check amount bias
  low_amount_f1 = compute_f1(recent_predictions, amount_range="<$10")
  high_amount_f1 = compute_f1(recent_predictions, amount_range=">$200")
  
  if abs(low_amount_f1 - high_amount_f1) > 0.12:
    alert("Amount bias detected: F1 gap = {:.2f}".format(gap))
```

### 3. Feedback Analysis

**Pattern Detection:**
```python
# Identify systematic errors
feedback_by_category = analyze_feedback()

for category in feedback_by_category:
  if feedback_by_category[category]['correction_rate'] > 0.20:
    # More than 20% of predictions corrected
    alert(f"High correction rate for {category}")
    
    # Analyze common correction patterns
    common_errors = feedback_by_category[category]['common_corrections']
    log_for_retraining(category, common_errors)
```

---

## Reporting & Transparency

### 1. Public Metrics

**Available at `/evaluation`:**
- Confusion matrix with all misclassification patterns
- Per-class precision, recall, F1 scores
- Overall accuracy and macro F1
- Model performance trends

**Interpretation Guide:**
- Explanation of metrics
- Confidence level classification
- How to read confusion matrix

### 2. Bias Reports

**Quarterly Fairness Report (planned):**
- Subgroup performance analysis
- Bias mitigation progress
- Identified issues and remediation
- Future improvement plans

### 3. User Communication

**Confidence Transparency:**
- Always show confidence scores
- Explain what confidence means
- Encourage feedback on low-confidence predictions

**Explainability:**
- SHAP-based token influence visualization
- Clear indication of influential words
- Context for prediction decisions

---

## Continuous Improvement

### 1. Retraining Schedule

**Frequency:**
- Weekly: Incorporate user feedback
- Monthly: Full model retraining with updated data
- Quarterly: Architecture/hyperparameter optimization

**Data Requirements:**
- Minimum 100 new feedback entries for retraining
- Balanced across categories
- Validated for quality

### 2. Feature Enhancement

**Planned Improvements:**
- Merchant embedding learning
- Context-aware amount interpretation
- Multi-lingual support
- Time-series pattern detection

### 3. Bias Mitigation Roadmap

**Short-term (3 months):**
- Implement automated bias testing suite
- Add per-merchant-tier performance tracking
- Enhance confidence calibration

**Medium-term (6 months):**
- Deploy fairness constraints in model training
- Build synthetic data augmentation pipeline
- Launch public bias reporting

**Long-term (12 months):**
- Multi-regional model variants
- Adaptive confidence thresholds per user
- Advanced adversarial robustness

---

## Conclusion

Bias mitigation and robustness are ongoing commitments, not one-time implementations. This document will be updated regularly as we identify new biases, implement new mitigation strategies, and improve our understanding of fairness in transaction categorization.

**Key Takeaways:**

1. **Multiple bias types** exist (merchant, region, amount, temporal, representation)
2. **Detection is continuous** via audits, metrics, and user feedback
3. **Mitigation is multi-layered** (data, features, post-processing, human feedback)
4. **Robustness requires** input validation, noise handling, and adversarial testing
5. **Transparency and user control** are ethical imperatives
6. **Monitoring never stops** - bias detection and mitigation are continuous processes

---

## References

- **Fairness in ML:** [Google's ML Fairness Guide](https://developers.google.com/machine-learning/fairness-overview)
- **Bias Detection:** [AI Fairness 360 Toolkit](https://aif360.mybluemix.net/)
- **Robustness Testing:** [Adversarial Robustness Toolbox](https://github.com/Trusted-AI/adversarial-robustness-toolbox)
- **SHAP Explainability:** [SHAP Documentation](https://shap.readthedocs.io/)

---

## Changelog

**v1.0.0 (November 2025)**
- Initial bias mitigation documentation
- Identified 6 primary bias types
- Documented detection and mitigation strategies
- Robustness testing guidelines
- Ethical AI principles
- Continuous monitoring framework
