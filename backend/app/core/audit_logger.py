"""
Audit logging module for InsightFlow Edu.
Provides structured audit logging for security events.
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Optional

from fastapi import Request

from app.db.models import AuditLog
from app.db.session import SessionLocal


class JsonFormatter(logging.Formatter):
    """JSON log formatter for structured logging."""

    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Add extra fields from record
        for key, value in record.__dict__.items():
            if key not in [
                "name",
                "msg",
                "args",
                "created",
                "filename",
                "funcName",
                "levelname",
                "levelno",
                "lineno",
                "module",
                "msecs",
                "message",
                "msg",
                "name",
                "pathname",
                "process",
                "processName",
                "relativeCreated",
                "thread",
                "threadName",
                "exc_info",
                "exc_text",
                "stack_info",
            ]:
                log_obj[key] = value

        return json.dumps(log_obj)


class AuditLogger:
    """Structured audit logger for security events."""

    def __init__(self):
        self.logger = logging.getLogger("audit")
        self.logger.setLevel(logging.INFO)

        # Console handler with JSON formatting
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        self.logger.addHandler(handler)
        self.logger.propagate = False

    def log_event(
        self,
        event_type: str,
        user_id: Optional[int] = None,
        user_email: Optional[str] = None,
        resource: Optional[str] = None,
        action: Optional[str] = None,
        outcome: str = "success",
        details: Optional[Dict] = None,
        request: Optional[Request] = None,
        correlation_id: Optional[str] = None,
    ):
        """Log a structured audit event to both console and database."""

        event = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event_type": event_type,
            "outcome": outcome,
            "correlation_id": correlation_id or str(uuid.uuid4()),
        }

        if user_id:
            event["user_id"] = user_id
        if user_email:
            event["user_email"] = user_email
        if resource:
            event["resource"] = resource
        if action:
            event["action"] = action
        if details:
            event["details"] = details
        if request:
            event["client_ip"] = request.client.host if request.client else None
            event["user_agent"] = request.headers.get("user-agent")
            event["method"] = request.method
            event["path"] = str(request.url)

        # Log to console (JSON format)
        self.logger.info(json.dumps(event))

        # Persist to database
        self._persist_to_db(event)

    def _persist_to_db(self, event: dict):
        """Persist audit event to database."""
        try:
            db = SessionLocal()
            audit_log = AuditLog(
                user_id=event.get("user_id"),
                user_email=event.get("user_email"),
                event_type=event.get("event_type"),
                resource=event.get("resource"),
                action=event.get("action"),
                outcome=event.get("outcome", "success"),
                client_ip=event.get("client_ip"),
                user_agent=event.get("user_agent"),
                details=(
                    json.dumps(event.get("details")) if event.get("details") else None
                ),
                correlation_id=event.get("correlation_id"),
                timestamp=datetime.utcnow(),
            )
            db.add(audit_log)
            db.commit()
        except Exception as e:
            # Don't let audit logging failure break the request
            self.logger.error(f"Failed to persist audit log: {e}")
        finally:
            db.close()

    # Convenience methods for common events
    def auth_login(
        self,
        user_id: Optional[int],
        user_email: str,
        success: bool,
        request: Request,
        details: dict = None,
    ):
        self.log_event(
            event_type="auth.login",
            user_id=user_id,
            user_email=user_email,
            resource="auth",
            action="login",
            outcome="success" if success else "failure",
            details=details,
            request=request,
        )

    def auth_logout(self, user_id: int, user_email: str, request: Request):
        self.log_event(
            event_type="auth.logout",
            user_id=user_id,
            user_email=user_email,
            resource="auth",
            action="logout",
            outcome="success",
            request=request,
        )

    def permission_check(
        self,
        user_id: int,
        user_email: str,
        resource: str,
        action: str,
        allowed: bool,
        request: Request,
    ):
        self.log_event(
            event_type="authorization.check",
            user_id=user_id,
            user_email=user_email,
            resource=resource,
            action=action,
            outcome="allowed" if allowed else "denied",
            request=request,
        )

    def data_access(
        self,
        user_id: int,
        user_email: str,
        resource: str,
        action: str,
        request: Request,
        details: dict = None,
    ):
        self.log_event(
            event_type="data.access",
            user_id=user_id,
            user_email=user_email,
            resource=resource,
            action=action,
            outcome="success",
            details=details,
            request=request,
        )

    def config_change(
        self,
        user_id: int,
        user_email: str,
        resource: str,
        action: str,
        request: Request,
        details: dict = None,
    ):
        self.log_event(
            event_type="config.change",
            user_id=user_id,
            user_email=user_email,
            resource=resource,
            action=action,
            outcome="success",
            details=details,
            request=request,
        )

    def risk_assessment(
        self,
        user_id: int,
        student_id: Optional[int],
        class_id: Optional[int],
        risk_score: Optional[float],
        risk_level: Optional[str],
        request: Request,
        details: dict = None,
    ):
        self.log_event(
            event_type="risk.assessment",
            user_id=user_id,
            resource="risk_assessment",
            action="create",
            outcome="success",
            details={
                "student_id": student_id,
                "class_id": class_id,
                "risk_score": risk_score,
                "risk_level": risk_level,
                **(details or {}),
            },
            request=request,
        )


# Global audit logger instance
audit_logger = AuditLogger()

__all__ = ["AuditLogger", "audit_logger", "JsonFormatter"]
