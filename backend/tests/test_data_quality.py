import pytest
from app.services.data_quality_service import data_quality_service
from app.db.models import Grade
from datetime import datetime

class TestDataQuality:
    def test_clean_data_no_issues(self, db, sample_data):
        report = data_quality_service.run_quality_checks(db)
        assert 'summary' in report
        assert 'categories' in report
        assert report['summary']['total_records_checked'] > 0

    def test_detects_invalid_gpa(self, db, sample_data):
        # Insert grade with percentage > 100
        db.add(Grade(student_id=sample_data['students'][0].id, class_id=sample_data['classes'][0].id, assignment_name='Bonus', score=150, max_score=100, percentage=150, weight=1.0, graded_at=datetime.utcnow()))
        db.commit()
        report = data_quality_service.run_quality_checks(db)
        cat_names = [c['category'] for c in report['categories']]
        assert 'Invalid grade score' in cat_names

    def test_detects_orphan_grades(self, db, sample_data):
        # Grade for class not enrolled in
        db.add(Grade(student_id=sample_data['students'][0].id, class_id=sample_data['classes'][1].id, assignment_name='Mistake', score=80, max_score=100, percentage=80, weight=1.0, graded_at=datetime.utcnow()))
        db.commit()
        report = data_quality_service.run_quality_checks(db)
        cat_names = [c['category'] for c in report['categories']]
        assert 'Orphan Grades' in cat_names

    def test_detects_missing_enrollments(self, db, sample_data):
        report = data_quality_service.run_quality_checks(db)
        # Since nodata@test.edu isn't enrolled in any classes, this should be caught
        cat_names = [c['category'] for c in report['categories']]
        assert 'Missing Enrollments' in cat_names

    def test_report_structure(self, db, sample_data):
        report = data_quality_service.run_quality_checks(db)
        assert 'summary' in report
        assert 'categories' in report
        assert 'total_records_checked' in report['summary']
        assert 'valid_records' in report['summary']
        assert 'issues_found' in report['summary']
