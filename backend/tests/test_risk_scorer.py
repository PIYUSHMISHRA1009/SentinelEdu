import pytest
from app.services.risk_scorer import RiskScorer, risk_scorer

class TestRiskScorer:
    def test_predict_risk_good_student(self, db, sample_data):
        """Good student should have low risk."""
        result = risk_scorer.predict_risk(db, sample_data['students'][0].id)
        assert result['risk_level'] in ['low', 'medium']
        assert result['risk_score'] < 0.5
        assert 'factors' in result
        assert 'intervention' in result
    
    def test_predict_risk_atrisk_student(self, db, sample_data):
        """At-risk student should have high risk."""
        result = risk_scorer.predict_risk(db, sample_data['students'][2].id)
        assert result['risk_level'] in ['high', 'critical']
        assert result['risk_score'] >= 0.5
        assert len(result['factors']) > 0
    
    def test_predict_risk_no_data_student(self, db, sample_data):
        """Student with no grades/attendance should get default features."""
        result = risk_scorer.predict_risk(db, sample_data['students'][3].id)
        assert 'risk_score' in result
        assert 'risk_level' in result
    
    def test_intervention_recommendation_critical(self):
        """Critical risk should get Immediate priority."""
        result = RiskScorer.get_intervention_recommendation('critical', ['Very low GPA'], {})
        assert result['priority'] == 'Immediate'
        assert result['priority_score'] == 4
        assert len(result['recommended_actions']) > 0
    
    def test_intervention_recommendation_low(self):
        """Low risk should get Normal priority."""
        result = RiskScorer.get_intervention_recommendation('low', [], {})
        assert result['priority'] == 'Normal'
        assert result['priority_score'] == 1
    
    def test_intervention_adds_attendance_action(self):
        """Factors mentioning attendance should add attendance-specific action."""
        result = RiskScorer.get_intervention_recommendation('high', ['Below average attendance (< 75%)'], {})
        actions = ' '.join(result['recommended_actions'])
        assert 'attendance' in actions.lower()
