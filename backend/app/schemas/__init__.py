from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[UserRole] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None


# Class Schemas
class ClassBase(BaseModel):
    code: str = Field(..., max_length=20)
    name: str
    department: str
    semester: int = Field(..., ge=1, le=8)
    credits: int = Field(default=3, ge=1)


class ClassCreate(ClassBase):
    teacher_id: int


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[int] = Field(default=None, ge=1, le=8)
    credits: Optional[int] = Field(default=None, ge=1)
    teacher_id: Optional[int] = None


class ClassResponse(ClassBase):
    id: int
    teacher_id: int
    teacher_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Enrollment Schemas
class EnrollmentCreate(BaseModel):
    student_id: int
    class_id: int


class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    student_name: Optional[str] = None
    class_id: int
    class_code: Optional[str] = None
    enrolled_at: datetime
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


# Grade Schemas
class GradeBase(BaseModel):
    assignment_name: str = Field(..., max_length=255)
    score: float = Field(..., ge=0)
    max_score: float = Field(default=100.0, gt=0)
    weight: float = Field(default=1.0, gt=0)


class GradeCreate(GradeBase):
    student_id: int
    class_id: int


class GradeUpdate(BaseModel):
    assignment_name: Optional[str] = None
    score: Optional[float] = Field(default=None, ge=0)
    max_score: Optional[float] = Field(default=None, gt=0)
    weight: Optional[float] = Field(default=None, gt=0)


class GradeResponse(GradeBase):
    id: int
    student_id: int
    student_name: Optional[str] = None
    class_id: int
    class_code: Optional[str] = None
    percentage: float
    graded_at: datetime
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Attendance Schemas
class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"


class AttendanceBase(BaseModel):
    status: AttendanceStatus


class AttendanceCreate(AttendanceBase):
    student_id: int
    class_id: int
    date: datetime


class AttendanceUpdate(BaseModel):
    status: Optional[AttendanceStatus] = None


class AttendanceResponse(AttendanceBase):
    id: int
    student_id: int
    student_name: Optional[str] = None
    class_id: int
    class_code: Optional[str] = None
    date: datetime
    recorded_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Risk Assessment Schemas
class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RiskAssessmentBase(BaseModel):
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: RiskLevel
    gpa_trend: Optional[float] = None
    attendance_trend: Optional[float] = None
    factors: Optional[str] = None


class RiskAssessmentCreate(RiskAssessmentBase):
    student_id: int
    class_id: Optional[int] = None


class RiskAssessmentResponse(RiskAssessmentBase):
    id: int
    student_id: int
    student_name: Optional[str] = None
    class_id: Optional[int] = None
    class_code: Optional[str] = None
    assessed_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Dashboard/Analytics Schemas
class StudentRiskSummary(BaseModel):
    student_id: int
    student_name: str
    roll_number: Optional[str] = None
    email: EmailStr
    department: str
    semester: int
    current_gpa: Optional[float] = None
    attendance_rate: Optional[float] = None
    risk_score: Optional[float] = None
    risk_level: Optional[RiskLevel] = None
    gpa_trend: Optional[float] = None
    attendance_trend: Optional[float] = None
    classes: List[ClassResponse] = []


class TrendPoint(BaseModel):
    date: str  # ISO format
    value: float


class StudentTrends(BaseModel):
    student_id: int
    gpa_trend: List[TrendPoint]
    attendance_trend: List[TrendPoint]


# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Pagination
class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    page_size: int
    total_pages: int