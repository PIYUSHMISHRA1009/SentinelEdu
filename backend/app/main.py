from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
import time
import uuid
import json
import logging
import os
from datetime import datetime
from typing import Optional

from app.core.config import settings
from app.api.v1 import auth, classes, grades, attendance, risk, anomalies
from app.db.session import init_db

# ============================================================
# PROMETHEUS METRICS
# ============================================================

# HTTP Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'path', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'path'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

http_requests_in_progress = Gauge(
    'http_requests_in_progress',
    'HTTP requests currently in progress',
    ['method', 'path']
)

# Business Metrics
risk_assessments_total = Counter(
    'risk_assessments_total',
    'Total risk assessments performed',
    ['risk_level', 'class_id']
)

active_students_gauge = Gauge(
    'active_students',
    'Number of active students',
    ['class_id']
)

# ============================================================
# STRUCTURED AUDIT LOGGING
# ============================================================

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
        details: Optional[dict] = None,
        request: Optional[Request] = None,
        correlation_id: Optional[str] = None
    ):
        """Log a structured audit event."""
        
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
        
        self.logger.info(json.dumps(event))
    
    # Convenience methods for common events
    def auth_login(self, user_id: int, user_email: str, success: bool, request: Request, details: dict = None):
        self.log_event(
            event_type="auth.login",
            user_id=user_id,
            user_email=user_email,
            resource="auth",
            action="login",
            outcome="success" if success else "failure",
            details=details,
            request=request
        )
    
    def auth_logout(self, user_id: int, user_email: str, request: Request):
        self.log_event(
            event_type="auth.logout",
            user_id=user_id,
            user_email=user_email,
            resource="auth",
            action="logout",
            outcome="success",
            request=request
        )
    
    def permission_check(self, user_id: int, user_email: str, resource: str, action: str, allowed: bool, request: Request):
        self.log_event(
            event_type="authorization.check",
            user_id=user_id,
            user_email=user_email,
            resource=resource,
            action=action,
            outcome="allowed" if allowed else "denied",
            request=request
        )
    
    def data_access(self, user_id: int, user_email: str, resource: str, action: str, request: Request, details: dict = None):
        self.log_event(
            event_type="data.access",
            user_id=user_id,
            user_email=user_email,
            resource=resource,
            action=action,
            outcome="success",
            details=details,
            request=request
        )
    
    def config_change(self, user_id: int, user_email: str, resource: str, action: str, request: Request, details: dict = None):
        self.log_event(
            event_type="config.change",
            user_id=user_id,
            user_email=user_email,
            resource=resource,
            action=action,
            outcome="success",
            details=details,
            request=request
        )
    
    def risk_assessment(self, user_id: int, student_id: int, class_id: Optional[int], risk_score: float, risk_level: str, request: Request):
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
                "risk_level": risk_level
            },
            request=request
        )


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
            if key not in ['name', 'msg', 'args', 'created', 'filename', 'funcName', 'levelname', 'levelno', 'lineno', 'module', 'msecs', 'message', 'msg', 'name', 'pathname', 'process', 'processName', 'relativeCreated', 'thread', 'threadName', 'exc_info', 'exc_text', 'stack_info']:
                log_obj[key] = value
        
        return json.dumps(log_obj)


# Global audit logger instance
audit_logger = AuditLogger()


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=settings.APP_NAME,
    description="Student Performance Analytics Platform - Early At-Risk Detection",
    version="2.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# MIDDLEWARE
# ============================================================

@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    """Prometheus metrics middleware."""
    # Generate correlation ID for request tracing
    correlation_id = str(uuid.uuid4())
    request.state.correlation_id = correlation_id
    
    # Track in-progress requests
    path = request.url.path
    method = request.method
    
    # Simplify path for metrics (replace IDs with placeholders)
    metrics_path = path
    # Replace UUIDs and numeric IDs
    import re
    metrics_path = re.sub(r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '/{uuid}', metrics_path)
    metrics_path = re.sub(r'/\d+', '/{id}', metrics_path)
    
    http_requests_in_progress.labels(method=method, path=metrics_path).inc()
    
    start_time = time.time()
    response = None
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        # Log exception
        audit_logger.log_event(
            event_type="error.unhandled",
            resource="api",
            action="request",
            outcome="error",
            details={"error": str(e), "error_type": type(e).__name__},
            request=request,
            correlation_id=correlation_id
        )
        raise
    finally:
        duration = time.time() - start_time
        
        # Record metrics
        if response:
            status = response.status_code
            http_requests_total.labels(method=method, path=metrics_path, status=status).inc()
            http_request_duration_seconds.labels(method=method, path=metrics_path).observe(duration)
            
            # Log audit event for API access
            if not path.startswith("/metrics") and not path.startswith("/health"):
                audit_logger.data_access(
                    user_id=getattr(request.state, 'user_id', None),
                    user_email=getattr(request.state, 'user_email', None),
                    resource=path,
                    action=method.lower(),
                    request=request
                )
        
        http_requests_in_progress.labels(method=method, path=metrics_path).dec()


# ============================================================
# METRICS ENDPOINT
# ============================================================

@app.get("/metrics", response_class=PlainTextResponse, include_in_schema=False)
async def metrics():
    """Prometheus metrics endpoint."""
    return PlainTextResponse(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "service": "insightflow-edu-api",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "2.0.0",
        "description": "Student Performance Analytics Platform",
        "docs": f"{settings.API_V1_STR}/docs",
    }


# ============================================================
# STARTUP/SHUTDOWN EVENTS
# ============================================================

@app.on_event("startup")
async def startup_event():
    """Application startup."""
    init_db()
    audit_logger.log_event(
        event_type="system.startup",
        resource="system",
        action="startup",
        outcome="success",
        details={"version": "2.0.0"}
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown."""
    audit_logger.log_event(
        event_type="system.shutdown",
        resource="system",
        action="shutdown",
        outcome="success"
    )


# ============================================================
# INCLUDE ROUTERS
# ============================================================

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(classes.router, prefix=f"{settings.API_V1_STR}/classes", tags=["classes"])
app.include_router(grades.router, prefix=f"{settings.API_V1_STR}/grades", tags=["grades"])
app.include_router(attendance.router, prefix=f"{settings.API_V1_STR}/attendance", tags=["attendance"])
app.include_router(risk.router, prefix=f"{settings.API_V1_STR}/risk", tags=["risk"])
app.include_router(anomalies.router, prefix=f"{settings.API_V1_STR}/anomalies", tags=["anomalies"])


# ============================================================
# EXPORT AUDIT LOGGER FOR USE IN ROUTERS
# ============================================================

from app.core import audit_logger as audit_logger_module
audit_logger_module.audit_logger = audit_logger