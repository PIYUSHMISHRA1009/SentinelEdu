from datetime import datetime

from app.db.models import Attendance
from tests.conftest import auth_header, get_auth_token


def tokens(client):
    return {
        'admin': auth_header(get_auth_token(client, 'admin@test.edu', 'admin123')),
        'teacher': auth_header(get_auth_token(client, 'teacher@test.edu', 'teacher123')),
        'student': auth_header(get_auth_token(client, 'good@test.edu', 'student123')),
        'nodata_student': auth_header(get_auth_token(client, 'nodata@test.edu', 'student123')),
    }


def test_class_creation_listing_and_enrollment_lifecycle(client, sample_data):
    headers = tokens(client)
    teacher_id = sample_data['teacher'].id
    student_id = sample_data['students'][3].id

    invalid = client.post('/api/v1/classes', json={
        'code': 'BAD101', 'name': 'Bad', 'department': 'CS', 'semester': 1,
        'credits': 3, 'teacher_id': student_id,
    }, headers=headers['admin'])
    assert invalid.status_code == 400

    created = client.post('/api/v1/classes', json={
        'code': 'CS401', 'name': 'Testing', 'department': 'CS', 'semester': 4,
        'credits': 3, 'teacher_id': teacher_id,
    }, headers=headers['admin'])
    assert created.status_code == 201
    class_id = created.json()['id']
    assert client.get('/api/v1/classes', headers=headers['teacher']).status_code == 200

    enrollment = client.post(f'/api/v1/classes/{class_id}/enroll', json={
        'student_id': student_id, 'class_id': class_id,
    }, headers=headers['teacher'])
    assert enrollment.status_code == 201
    assert client.get(f'/api/v1/classes/{class_id}', headers=headers['nodata_student']).status_code == 200
    assert client.delete(f'/api/v1/classes/{class_id}/enroll/{student_id}', headers=headers['teacher']).status_code == 204
    assert client.get(f'/api/v1/classes/{class_id}', headers=headers['nodata_student']).status_code == 403


def test_grade_workflow_calculates_weighted_summary_and_enforces_student_scope(client, sample_data):
    headers = tokens(client)
    student_id = sample_data['students'][0].id
    other_student_id = sample_data['students'][1].id
    class_id = sample_data['classes'][0].id

    created = client.post('/api/v1/grades', json={
        'student_id': student_id, 'class_id': class_id, 'assignment_name': 'Final',
        'score': 18, 'max_score': 20, 'weight': 2,
    }, headers=headers['teacher'])
    assert created.status_code == 201
    grade_id = created.json()['id']
    assert created.json()['percentage'] == 90

    summary = client.get(f'/api/v1/grades/student/{student_id}/summary', headers=headers['student'])
    assert summary.status_code == 200
    assert summary.json()['total_assignments'] == 9
    assert client.get(f'/api/v1/grades?student_id={other_student_id}', headers=headers['student']).status_code == 403

    updated = client.put(f'/api/v1/grades/{grade_id}', json={'score': 10, 'max_score': 20}, headers=headers['teacher'])
    assert updated.status_code == 200
    assert updated.json()['percentage'] == 50
    assert client.delete(f'/api/v1/grades/{grade_id}', headers=headers['teacher']).status_code == 204


def test_attendance_create_update_list_and_summaries(client, db, sample_data):
    headers = tokens(client)
    student_id = sample_data['students'][0].id
    class_id = sample_data['classes'][0].id
    date = '2024-06-01T00:00:00'

    created = client.post('/api/v1/attendance', json={
        'student_id': student_id, 'class_id': class_id, 'date': date, 'status': 'absent',
    }, headers=headers['teacher'])
    assert created.status_code == 201
    attendance_id = created.json()['id']
    updated = client.put(f'/api/v1/attendance/{attendance_id}', json={'status': 'excused'}, headers=headers['teacher'])
    assert updated.status_code == 200
    assert updated.json()['status'] == 'excused'

    records = client.get(f'/api/v1/attendance?student_id={student_id}', headers=headers['student'])
    assert records.status_code == 200
    assert all(record['student_id'] == student_id for record in records.json())
    summary = client.get(f'/api/v1/attendance/student/{student_id}/class/{class_id}/summary', headers=headers['student'])
    assert summary.status_code == 200
    assert summary.json()['excused'] >= 1
    class_summary = client.get(f'/api/v1/attendance/class/{class_id}/summary', headers=headers['teacher'])
    assert class_summary.status_code == 200
    assert any(row['student_id'] == student_id for row in class_summary.json()['students'])
    assert client.delete(f'/api/v1/attendance/{attendance_id}', headers=headers['teacher']).status_code == 204


def test_bulk_attendance_skips_unenrolled_students(client, sample_data):
    headers = tokens(client)
    class_id = sample_data['classes'][0].id
    enrolled_id = sample_data['students'][0].id
    unenrolled_id = sample_data['students'][3].id

    response = client.post('/api/v1/attendance/bulk', json={
        'class_id': class_id,
        'date': '2024-07-01',
        'records': [
            {'student_id': enrolled_id, 'class_id': class_id, 'date': '2024-07-01T00:00:00', 'status': 'present'},
            {'student_id': unenrolled_id, 'class_id': class_id, 'date': '2024-07-01T00:00:00', 'status': 'present'},
        ],
    }, headers=headers['teacher'])

    assert response.status_code == 200
    assert [record['student_id'] for record in response.json()] == [enrolled_id]
