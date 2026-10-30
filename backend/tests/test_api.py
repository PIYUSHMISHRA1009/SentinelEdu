import pytest
from tests.conftest import TestSessionLocal, get_auth_token, auth_header
from app.core import audit_logger as audit_logger_module
from app.db.models import AuditLog

def test_login_success(client, sample_data):
    response = client.post('/api/v1/auth/login', json={'email': 'admin@test.edu', 'password': 'admin123'})
    assert response.status_code == 200
    assert 'access_token' in response.json()

def test_login_failure(client, sample_data):
    response = client.post('/api/v1/auth/login', json={'email': 'admin@test.edu', 'password': 'wrong'})
    assert response.status_code in [400, 401]

def test_admin_list_users_writes_audit_entry(client, db, sample_data, monkeypatch):
    monkeypatch.setattr(audit_logger_module, 'SessionLocal', TestSessionLocal)
    token = get_auth_token(client, 'admin@test.edu', 'admin123')

    response = client.get('/api/v1/auth/users', headers=auth_header(token))

    assert response.status_code == 200
    audit_entry = db.query(AuditLog).filter(
        AuditLog.event_type == 'data.access',
        AuditLog.resource == 'users',
        AuditLog.action == 'list',
    ).one()
    assert audit_entry.user_email == 'admin@test.edu'

def test_analytics_summary_requires_auth(client):
    response = client.get('/api/v1/analytics/summary')
    assert response.status_code == 401

def test_analytics_summary_with_auth(client, sample_data):
    token = get_auth_token(client, 'admin@test.edu', 'admin123')
    response = client.get('/api/v1/analytics/summary', headers=auth_header(token))
    assert response.status_code == 200
    assert 'total_students' in response.json()

def test_risk_dashboard_with_auth(client, sample_data):
    token = get_auth_token(client, 'admin@test.edu', 'admin123')
    response = client.get('/api/v1/risk/dashboard/summary', headers=auth_header(token))
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_data_quality_with_auth(client, sample_data):
    token = get_auth_token(client, 'admin@test.edu', 'admin123')
    response = client.get('/api/v1/data-quality/report', headers=auth_header(token))
    assert response.status_code == 200
    assert 'summary' in response.json()

def test_student_denied_analytics_summary(client, sample_data):
    token = get_auth_token(client, 'good@test.edu', 'student123')
    response = client.get('/api/v1/analytics/summary', headers=auth_header(token))
    assert response.status_code == 403

def test_student_denied_data_quality(client, sample_data):
    token = get_auth_token(client, 'good@test.edu', 'student123')
    response = client.get('/api/v1/data-quality/report', headers=auth_header(token))
    assert response.status_code == 403

def test_student_cannot_access_other_student_risk(client, sample_data):
    token_good = get_auth_token(client, 'good@test.edu', 'student123')
    other_student_id = sample_data['students'][1].id
    response = client.get(f'/api/v1/risk/student/{other_student_id}', headers=auth_header(token_good))
    assert response.status_code == 403

def test_faculty_analytics_data_scoping(client, sample_data):
    token_admin = get_auth_token(client, 'admin@test.edu', 'admin123')
    token_teacher = get_auth_token(client, 'teacher@test.edu', 'teacher123')
    
    admin_summary = client.get('/api/v1/analytics/summary', headers=auth_header(token_admin)).json()
    teacher_summary = client.get('/api/v1/analytics/summary', headers=auth_header(token_teacher)).json()
    
    # Admin sees total institution students (5 students)
    # Teacher sees only enrolled assigned students (4 students across teacher's active classes)
    assert admin_summary['total_students'] == 5
    assert teacher_summary['total_students'] == 4

def test_faculty_cannot_access_unassigned_student_risk(client, sample_data):
    token_teacher = get_auth_token(client, 'teacher@test.edu', 'teacher123')
    unassigned_student_id = sample_data['students'][3].id  # nodata student not enrolled in teacher's classes
    
    response = client.get(f'/api/v1/risk/student/{unassigned_student_id}', headers=auth_header(token_teacher))
    assert response.status_code == 403
