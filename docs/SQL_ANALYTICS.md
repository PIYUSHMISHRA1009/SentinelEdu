# SentinelEdu SQL Analytics

`backend/app/services/analytics_service.py` contains the SQL used by the analytics API. The queries run through SQLAlchemy `text()` and are scoped to a teacher's active enrollments when the requester is a teacher; administrators receive institution-wide results.

## Data used by the queries

- `users`: `id`, `full_name`, `role`, and `department`
- `classes`: `id`, `code`, `name`, `department`, and `teacher_id`
- `enrollments`: `student_id`, `class_id`, and `is_active`
- `grades`: `student_id`, `class_id`, `percentage`, and `graded_at`
- `attendance`: `student_id`, `class_id`, `status`, and `date`; statuses are lowercase, including `present`
- `risk_assessments`: `student_id`, `risk_score`, `risk_level`, and `assessed_at`

## Implemented analytics

### Population summary

`get_summary()` uses `StudentGrades` and `StudentAttendance` CTEs to calculate the average grade percentage, present-attendance percentage, and students meeting either at-risk condition: grade percentage below 70 or attendance below 80. A second CTE ranks grades with `ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY graded_at DESC)` and compares the most recent three grades with older grades. A student is declining when the recent average is more than five percentage points below the older average.

### Department and class performance

`get_department_performance()` groups student grade percentages by `users.department` and returns distinct student counts and average score. `get_class_performance()` groups by `classes.id`, `classes.code`, `classes.name`, and `classes.department`; it reports active enrollment counts and average grade percentage.

### GPA distribution and attendance comparison

`get_gpa_distribution()` first calculates each student's average grade percentage, then assigns a `gpa_bucket` with `CASE` expressions. `get_attendance_vs_gpa()` joins per-student average grade percentages with present-attendance percentages, returning individual student points keyed by `student_id` and `full_name`.

### Declining students and intervention priority

`get_declining_students()` returns `student_id`, `full_name` (as `student_name`), department, recent and older grade averages, and the decline amount. It uses the `graded_at` ordering described above.

`get_intervention_priority()` joins student metrics with the latest risk assessment per student (`MAX(id)` within each student group). It derives a priority of `Immediate`, `Urgent`, `Monitor`, or `Normal` using risk level, GPA, and attendance thresholds, then orders the result by risk score, GPA, and attendance.

### Risk and semester distributions

`get_risk_distribution()` counts non-null `risk_level` values from `risk_assessments`. `get_semester_trends()` groups grade percentages by `classes.semester` and returns the average score for each semester. `get_at_risk_summary()` delegates to the risk-distribution query.

## Compatibility note

The analytics tests run on SQLite. Production PostgreSQL compatibility should be verified against a PostgreSQL database before deployment.
