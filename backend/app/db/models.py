import enum
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.db.base import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"


class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    semester: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    teacher_classes: Mapped[List["Class"]] = relationship("Class", back_populates="teacher", foreign_keys="Class.teacher_id")
    student_enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="student")
    student_grades: Mapped[List["Grade"]] = relationship("Grade", back_populates="student")
    student_attendance: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="student")
    
    __table_args__ = (
        Index("idx_users_email", "email"),
        Index("idx_users_role", "role"),
    )


class Class(Base):
    __tablename__ = "classes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    credits: Mapped[int] = mapped_column(Integer, default=3)
    teacher_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    teacher: Mapped["User"] = relationship("User", back_populates="teacher_classes", foreign_keys=[teacher_id])
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="class_")
    grades: Mapped[List["Grade"]] = relationship("Grade", back_populates="class_")
    attendance_records: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="class_")
    
    __table_args__ = (
        Index("idx_classes_teacher", "teacher_id"),
        Index("idx_classes_dept_semester", "department", "semester"),
    )


class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    class_id: Mapped[int] = mapped_column(Integer, ForeignKey("classes.id"), nullable=False)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(default=True)
    
    # Relationships
    student: Mapped["User"] = relationship("User", back_populates="student_enrollments")
    class_: Mapped["Class"] = relationship("Class", back_populates="enrollments")
    
    __table_args__ = (
        UniqueConstraint("student_id", "class_id", name="uq_student_class"),
        Index("idx_enrollments_student", "student_id"),
        Index("idx_enrollments_class", "class_id"),
    )


class Grade(Base):
    __tablename__ = "grades"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    class_id: Mapped[int] = mapped_column(Integer, ForeignKey("classes.id"), nullable=False)
    assignment_name: Mapped[str] = mapped_column(String(255), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    percentage: Mapped[float] = mapped_column(Float, nullable=False)  # computed
    weight: Mapped[float] = mapped_column(Float, default=1.0)  # for weighted average
    graded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student: Mapped["User"] = relationship("User", back_populates="student_grades")
    class_: Mapped["Class"] = relationship("Class", back_populates="grades")
    
    __table_args__ = (
        Index("idx_grades_student_class", "student_id", "class_id"),
        Index("idx_grades_graded_at", "graded_at"),
    )


class Attendance(Base):
    __tablename__ = "attendance"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    class_id: Mapped[int] = mapped_column(Integer, ForeignKey("classes.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student: Mapped["User"] = relationship("User", back_populates="student_attendance")
    class_: Mapped["Class"] = relationship("Class", back_populates="attendance_records")
    
    __table_args__ = (
        UniqueConstraint("student_id", "class_id", "date", name="uq_student_class_date"),
        Index("idx_attendance_student_class", "student_id", "class_id"),
        Index("idx_attendance_date", "date"),
    )


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    class_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("classes.id"), nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0.0 to 1.0
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)  # low, medium, high, critical
    gpa_trend: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # negative = declining
    attendance_trend: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # negative = declining
    factors: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON string of contributing factors
    assessed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    student: Mapped["User"] = relationship("User")
    class_: Mapped[Optional["Class"]] = relationship("Class")
    
    __table_args__ = (
        Index("idx_risk_student", "student_id"),
        Index("idx_risk_class", "class_id"),
        Index("idx_risk_assessed_at", "assessed_at"),
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    resource: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    action: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    outcome: Mapped[str] = mapped_column(String(20), nullable=False)  # success, failure, allowed, denied
    client_ip: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
    correlation_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User")
    
    __table_args__ = (
        Index("idx_audit_user_time", "user_id", "timestamp"),
        Index("idx_audit_event_time", "event_type", "timestamp"),
        Index("idx_audit_correlation", "correlation_id"),
    )