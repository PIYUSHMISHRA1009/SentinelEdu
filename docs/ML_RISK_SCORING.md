# SentinelEdu ML Risk Scoring

The risk scorer in `backend/app/services/risk_scorer.py` produces a risk probability, risk level, contributing factors, and deterministic intervention guidance from grades and attendance.

## Training data and models

When no serialized model is available at the configured model path, the scorer generates 5,000 synthetic student records. It splits them into 80% training and 20% validation data using a stratified `train_test_split`.

The scorer fits a `StandardScaler` on the training data, then trains:

- `LogisticRegression` with balanced classes
- `DecisionTreeClassifier` with balanced classes and `max_depth=8`

It selects the model with the higher validation accuracy. The code does not perform imputation, and this documentation makes no fixed accuracy claim.

## Features

The model uses these ten features:

1. `current_gpa`
2. `gpa_trend`
3. `gpa_volatility`
4. `attendance_rate`
5. `attendance_trend`
6. `attendance_volatility`
7. `assignments_completed`
8. `missing_assignments`
9. `recent_grade_decline`
10. `recent_attendance_decline`

For a student record, grade-derived features use grade percentages ordered by `graded_at`. Attendance features use lowercase attendance statuses; `present`, `late`, and `excused` count as attended for the attendance rate.

## Risk levels

The selected model's positive-class probability is mapped as follows:

| Probability | Risk level |
|---:|---|
| `< 0.30` | low |
| `0.30–<0.50` | medium |
| `0.50–<0.70` | high |
| `>= 0.70` | critical |

## Output and interventions

The scorer adds contributing factors when thresholds in the computed features are met, such as low GPA, declining GPA, low attendance, declining attendance, or more than three missing assignments. `get_intervention_recommendation()` maps the risk level and factors to priority, recommended actions, review frequency, and escalation.

## Limitation

Both the training records and their labels are synthetic. The models demonstrate the application pipeline; this repository makes no accuracy claim and does not establish real-world predictive performance.
