from app.core import audit_logger as audit_logger_module
from app.db.models import AuditLog
from tests.conftest import TestSessionLocal, auth_header, get_auth_token


def test_list_users_is_admin_only(client, sample_data):
    admin_token = get_auth_token(client, "admin@test.edu", "admin123")
    teacher_token = get_auth_token(client, "teacher@test.edu", "teacher123")
    student_token = get_auth_token(client, "good@test.edu", "student123")

    assert (
        client.get("/api/v1/auth/users", headers=auth_header(admin_token)).status_code
        == 200
    )
    assert (
        client.get("/api/v1/auth/users", headers=auth_header(teacher_token)).status_code
        == 403
    )
    assert (
        client.get("/api/v1/auth/users", headers=auth_header(student_token)).status_code
        == 403
    )


def test_get_user_access_matches_role_scope(client, sample_data):
    admin_token = get_auth_token(client, "admin@test.edu", "admin123")
    teacher_token = get_auth_token(client, "teacher@test.edu", "teacher123")
    student_token = get_auth_token(client, "good@test.edu", "student123")
    enrolled_student_id = sample_data["students"][0].id
    unassigned_student_id = sample_data["students"][3].id

    assert (
        client.get(
            f"/api/v1/auth/users/{enrolled_student_id}",
            headers=auth_header(admin_token),
        ).status_code
        == 200
    )
    assert (
        client.get(
            f"/api/v1/auth/users/{enrolled_student_id}",
            headers=auth_header(teacher_token),
        ).status_code
        == 200
    )
    assert (
        client.get(
            f"/api/v1/auth/users/{unassigned_student_id}",
            headers=auth_header(teacher_token),
        ).status_code
        == 403
    )
    assert (
        client.get(
            f"/api/v1/auth/users/{enrolled_student_id}",
            headers=auth_header(student_token),
        ).status_code
        == 200
    )
    assert (
        client.get(
            f"/api/v1/auth/users/{unassigned_student_id}",
            headers=auth_header(student_token),
        ).status_code
        == 403
    )


def test_classes_are_available_to_each_authenticated_role(client, sample_data):
    admin_token = get_auth_token(client, "admin@test.edu", "admin123")
    teacher_token = get_auth_token(client, "teacher@test.edu", "teacher123")
    student_token = get_auth_token(client, "good@test.edu", "student123")

    assert (
        client.get("/api/v1/classes", headers=auth_header(admin_token)).status_code
        == 200
    )
    assert (
        client.get("/api/v1/classes", headers=auth_header(teacher_token)).status_code
        == 200
    )
    assert (
        client.get("/api/v1/classes", headers=auth_header(student_token)).status_code
        == 200
    )


def test_risk_endpoints_apply_student_and_teacher_scope(client, sample_data):
    admin_token = get_auth_token(client, "admin@test.edu", "admin123")
    teacher_token = get_auth_token(client, "teacher@test.edu", "teacher123")
    student_token = get_auth_token(client, "good@test.edu", "student123")
    enrolled_student_id = sample_data["students"][0].id
    unassigned_student_id = sample_data["students"][3].id

    assert (
        client.get(
            f"/api/v1/risk/student/{enrolled_student_id}",
            headers=auth_header(admin_token),
        ).status_code
        == 200
    )
    assert (
        client.get(
            f"/api/v1/risk/student/{enrolled_student_id}",
            headers=auth_header(teacher_token),
        ).status_code
        == 200
    )
    assert (
        client.get(
            f"/api/v1/risk/student/{unassigned_student_id}",
            headers=auth_header(teacher_token),
        ).status_code
        == 403
    )
    assert (
        client.get(
            f"/api/v1/risk/student/{enrolled_student_id}",
            headers=auth_header(student_token),
        ).status_code
        == 200
    )
    assert (
        client.get(
            f"/api/v1/risk/student/{unassigned_student_id}",
            headers=auth_header(student_token),
        ).status_code
        == 403
    )
    assert (
        client.get(
            "/api/v1/risk/dashboard/summary", headers=auth_header(student_token)
        ).status_code
        == 200
    )


def test_login_attempts_write_success_and_failure_audit_rows(
    client, db, sample_data, monkeypatch
):
    monkeypatch.setattr(audit_logger_module, "SessionLocal", TestSessionLocal)

    success = client.post(
        "/api/v1/auth/login", json={"email": "admin@test.edu", "password": "admin123"}
    )
    failure = client.post(
        "/api/v1/auth/login", json={"email": "admin@test.edu", "password": "wrong"}
    )

    assert success.status_code == 200
    assert failure.status_code == 401
    entries = (
        db.query(AuditLog)
        .filter(AuditLog.event_type == "auth.login")
        .order_by(AuditLog.id)
        .all()
    )
    assert [(entry.user_email, entry.outcome) for entry in entries] == [
        ("admin@test.edu", "success"),
        ("admin@test.edu", "failure"),
    ]
