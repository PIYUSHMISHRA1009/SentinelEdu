import json

import numpy as np

from app.db.models import RiskAssessment, User, UserRole
from app.services.analytics_service import analytics_service
from app.services.risk_scorer import RiskScorer


class FixedScaler:
    def transform(self, values):
        return values


class FixedModel:
    def __init__(self, probability):
        self.probability = probability

    def predict_proba(self, values):
        return np.array([[1 - self.probability, self.probability]])


def scorer_with_probability(probability):
    scorer = RiskScorer.__new__(RiskScorer)
    scorer.feature_names = [
        "current_gpa", "gpa_trend", "gpa_volatility", "attendance_rate",
        "attendance_trend", "attendance_volatility", "assignments_completed",
        "missing_assignments", "recent_grade_decline", "recent_attendance_decline",
    ]
    scorer.scaler = FixedScaler()
    scorer.model = FixedModel(probability)
    return scorer


def test_synthetic_data_has_expected_shape_and_binary_labels():
    scorer = scorer_with_probability(0.1)

    features, labels = scorer._generate_synthetic_data(40)

    assert features.shape == (40, 10)
    assert set(labels).issubset({0, 1})
    assert 0 in labels and 1 in labels


def test_feature_calculation_uses_grade_and_attendance_history(db, sample_data):
    scorer = scorer_with_probability(0.1)
    student_id = sample_data['students'][2].id

    features = scorer._calculate_student_features(db, student_id)

    assert features['current_gpa'] < 2.0
    assert features['gpa_trend'] < 0
    assert features['recent_grade_decline'] > 0
    assert features['attendance_rate'] == 50.0
    assert features['assignments_completed'] == 8


def test_feature_calculation_uses_defaults_without_records(db, sample_data):
    scorer = scorer_with_probability(0.1)

    assert scorer._calculate_student_features(db, sample_data['students'][3].id) == scorer._default_features()


def test_predict_risk_thresholds_and_factor_actions(db, sample_data, monkeypatch):
    features = {
        'current_gpa': 1.5, 'gpa_trend': -0.2, 'gpa_volatility': 0.2,
        'attendance_rate': 50, 'attendance_trend': -6, 'attendance_volatility': 1,
        'assignments_completed': 1, 'missing_assignments': 4,
        'recent_grade_decline': 0.2, 'recent_attendance_decline': 6,
    }
    expected = [(0.29, 'low'), (0.30, 'medium'), (0.50, 'high'), (0.70, 'critical')]
    for probability, level in expected:
        scorer = scorer_with_probability(probability)
        monkeypatch.setattr(scorer, '_calculate_student_features', lambda *args: features)
        result = scorer.predict_risk(db, sample_data['students'][0].id)
        assert result['risk_level'] == level
        assert 'Multiple missing assignments' in result['factors']
        assert result['intervention']['recommended_actions']


def test_assess_all_students_filters_enrollment_and_persists_json(db, sample_data, monkeypatch):
    scorer = scorer_with_probability(0.1)
    monkeypatch.setattr(scorer, 'predict_risk', lambda db, student_id, class_id=None: {
        'risk_score': 0.2, 'risk_level': 'low', 'gpa_trend': 0.0,
        'attendance_trend': 0.0, 'factors': ['Test factor'], 'features': {},
        'intervention': {},
    })

    results = scorer.assess_all_students(db, sample_data['classes'][0].id)

    assert {result['student_id'] for result in results} == {student.id for student in sample_data['students'][:3]}
    assessments = db.query(RiskAssessment).all()
    assert len(assessments) == 3
    assert json.loads(assessments[0].factors) == ['Test factor']


def test_teacher_analytics_are_scoped_and_return_all_views(db, sample_data):
    teacher = sample_data['teacher']
    db.add(RiskAssessment(
        student_id=sample_data['students'][0].id,
        class_id=sample_data['classes'][0].id,
        risk_score=0.8,
        risk_level='critical',
        factors='[]',
    ))
    db.commit()

    assert analytics_service.get_summary(db, teacher)['total_students'] == 4
    assert {row['code'] for row in analytics_service.get_class_performance(db, teacher)} == {'CS301', 'EC201'}
    assert analytics_service.get_department_performance(db, teacher)
    assert analytics_service.get_gpa_distribution(db, teacher)
    assert len(analytics_service.get_attendance_vs_gpa(db, teacher)) == 4
    assert analytics_service.get_declining_students(db, teacher, limit=1)[0]['student_name'] == 'AtRisk Student'
    assert analytics_service.get_intervention_priority(db, teacher, limit=2)[0]['risk_level'] == 'critical'
    assert analytics_service.get_semester_trends(db, teacher)
    assert analytics_service.get_risk_distribution(db, teacher) == [{'risk_level': 'critical', 'count': 1}]
    assert analytics_service.get_at_risk_summary(db, teacher) == [{'risk_level': 'critical', 'count': 1}]
