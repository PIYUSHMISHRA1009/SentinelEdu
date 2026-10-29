import pytest
from app.services.analytics_service import analytics_service

class TestAnalytics:
    def test_summary_returns_data(self, db, sample_data):
        summary = analytics_service.get_summary(db)
        assert summary['total_students'] == 5
        assert summary['avg_attendance'] == 77.5
        assert summary['avg_gpa'] == 70.875
        assert summary['at_risk_count'] == 2
        
    def test_department_performance(self, db, sample_data):
        dept_perf = analytics_service.get_department_performance(db)
        assert len(dept_perf) >= 2
        depts = [d['department'] for d in dept_perf]
        assert 'CS' in depts
        assert 'EC' in depts

    def test_gpa_distribution(self, db, sample_data):
        gpa_dist = analytics_service.get_gpa_distribution(db)
        assert len(gpa_dist) > 0
        assert any(b['count'] > 0 for b in gpa_dist)

    def test_attendance_vs_gpa_uses_present_enum_label(self, db, sample_data):
        rows = analytics_service.get_attendance_vs_gpa(db)
        by_student = {row['student_name']: row for row in rows}

        assert by_student['AtRisk Student']['attendance_rate'] == 50.0
        assert by_student['Good Student']['attendance_rate'] == 90.0
        assert by_student['AtRisk Student']['gpa'] == 46.0

    def test_declining_students(self, db, sample_data):
        declining = analytics_service.get_declining_students(db)
        assert isinstance(declining, list)

    def test_intervention_priority(self, db, sample_data):
        interventions = analytics_service.get_intervention_priority(db)
        assert isinstance(interventions, list)

    def test_risk_distribution(self, db, sample_data):
        risk_dist = analytics_service.get_risk_distribution(db)
        assert isinstance(risk_dist, list)

    def test_summary_with_no_data(self, db):
        summary = analytics_service.get_summary(db)
        assert summary['total_students'] == 0
        assert summary.get('avg_attendance') is None or summary.get('avg_attendance') == 0
        assert summary.get('avg_gpa') is None or summary.get('avg_gpa') == 0
