import pytest
import os
TEST_DATABASE_URL = os.getenv('TEST_DATABASE_URL', 'sqlite://')
os.environ['ENVIRONMENT'] = 'test'
os.environ['DATABASE_URL'] = TEST_DATABASE_URL

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import User, UserRole, Class, Enrollment, Grade, Attendance, AttendanceStatus
from app.core.security import get_password_hash
from app.main import app
from app.api.deps import get_db
from datetime import datetime, timedelta

# Use PostgreSQL in CI when TEST_DATABASE_URL is set; otherwise use in-memory SQLite.
engine_options = {}
if TEST_DATABASE_URL.startswith('sqlite'):
    engine_options = {
        'connect_args': {'check_same_thread': False},
        'poolclass': StaticPool,
    }
test_engine = create_engine(TEST_DATABASE_URL, **engine_options)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def sample_data(db):
    """Create sample data for testing: 1 admin, 1 teacher, 5 students, 2 classes, enrollments, grades, attendance."""
    admin = User(email='admin@test.edu', hashed_password=get_password_hash('admin123'), full_name='Test Admin', role=UserRole.ADMIN, department='Admin')
    teacher = User(email='teacher@test.edu', hashed_password=get_password_hash('teacher123'), full_name='Test Teacher', role=UserRole.TEACHER, department='CS')
    
    students = []
    student_profiles = [
        ('good@test.edu', 'Good Student', 'CS', 3),     # high performer
        ('average@test.edu', 'Average Student', 'CS', 3),  # average
        ('atrisk@test.edu', 'AtRisk Student', 'CS', 3),    # at-risk
        ('nodata@test.edu', 'NoData Student', 'CS', 3),    # no grades/attendance
        ('ec@test.edu', 'EC Student', 'EC', 2),            # different dept
    ]
    for email, name, dept, sem in student_profiles:
        s = User(email=email, hashed_password=get_password_hash('student123'), full_name=name, role=UserRole.STUDENT, department=dept, semester=sem)
        students.append(s)
    
    db.add(admin)
    db.add(teacher)
    for s in students:
        db.add(s)
    db.commit()
    
    # Classes
    c1 = Class(code='CS301', name='DBMS', department='CS', semester=3, credits=4, teacher_id=teacher.id)
    c2 = Class(code='EC201', name='Digital Electronics', department='EC', semester=2, credits=3, teacher_id=teacher.id)
    db.add(c1)
    db.add(c2)
    db.commit()
    
    # Enrollments (first 3 CS students in CS301, EC student in EC201, nodata student NOT enrolled)
    for s in students[:3]:
        db.add(Enrollment(student_id=s.id, class_id=c1.id))
    db.add(Enrollment(student_id=students[4].id, class_id=c2.id))
    db.commit()
    
    # Grades for good student (high scores)
    base_date = datetime(2024, 2, 1)
    for i in range(8):
        score = 85 + i  # improving: 85, 86, ..., 92
        db.add(Grade(student_id=students[0].id, class_id=c1.id, assignment_name=f'Assignment {i+1}', score=score, max_score=100, percentage=score, weight=1.0, graded_at=base_date + timedelta(days=i*7)))
    
    # Grades for average student
    for i in range(6):
        score = 65 + (i % 3) * 5  # 65, 70, 75, 65, 70, 75
        db.add(Grade(student_id=students[1].id, class_id=c1.id, assignment_name=f'Assignment {i+1}', score=score, max_score=100, percentage=score, weight=1.0, graded_at=base_date + timedelta(days=i*7)))
    
    # Grades for at-risk student (declining)
    for i in range(8):
        score = max(30, 60 - i * 4)  # declining: 60, 56, 52, 48, 44, 40, 36, 32
        db.add(Grade(student_id=students[2].id, class_id=c1.id, assignment_name=f'Assignment {i+1}', score=score, max_score=100, percentage=score, weight=1.0, graded_at=base_date + timedelta(days=i*7)))
    
    # Grades for EC student
    for i in range(5):
        score = 75 + i * 2
        db.add(Grade(student_id=students[4].id, class_id=c2.id, assignment_name=f'Assignment {i+1}', score=score, max_score=100, percentage=score, weight=1.0, graded_at=base_date + timedelta(days=i*7)))
    
    db.commit()
    
    # Attendance
    from datetime import date
    for week in range(10):
        for session in range(2):
            att_date = datetime(2024, 1, 15) + timedelta(days=week*7 + session*3)
            # Good student: mostly present
            db.add(Attendance(student_id=students[0].id, class_id=c1.id, date=att_date, status=AttendanceStatus.PRESENT if week < 9 else AttendanceStatus.LATE))
            # Average student: mostly present with some absences
            status = AttendanceStatus.PRESENT if week % 4 != 0 else AttendanceStatus.ABSENT
            db.add(Attendance(student_id=students[1].id, class_id=c1.id, date=att_date, status=status))
            # At-risk student: poor attendance
            status = AttendanceStatus.ABSENT if week % 2 == 0 else AttendanceStatus.PRESENT
            db.add(Attendance(student_id=students[2].id, class_id=c1.id, date=att_date, status=status))
            # EC student
            db.add(Attendance(student_id=students[4].id, class_id=c2.id, date=att_date, status=AttendanceStatus.PRESENT))
    
    db.commit()
    
    return {
        'admin': admin, 'teacher': teacher, 'students': students,
        'classes': [c1, c2],
    }

@pytest.fixture
def admin_token(client):
    # Need sample_data first - this creates the admin user
    pass  # We'll get token in tests directly

def get_auth_token(client, email, password):
    response = client.post('/api/v1/auth/login', json={'email': email, 'password': password})
    return response.json()['access_token']

def auth_header(token):
    return {'Authorization': f'Bearer {token}'}
