import os
import pickle
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from typing import Dict, List, Optional, Tuple
import json
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from app.db.models import User, UserRole, Class, Enrollment, Grade, Attendance, RiskAssessment, AttendanceStatus


class RiskScorer:
    """ML-based risk scoring for students using grade and attendance trends."""
    
    def __init__(self, model_path: str = "app/ml/risk_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            "current_gpa", "gpa_trend", "gpa_volatility",
            "attendance_rate", "attendance_trend", "attendance_volatility",
            "assignments_completed", "missing_assignments",
            "recent_grade_decline", "recent_attendance_decline"
        ]
        self._load_or_train()
    
    def _load_or_train(self):
        """Load existing model or train a new one on synthetic data."""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    saved = pickle.load(f)
                    self.model = saved["model"]
                    self.scaler = saved["scaler"]
                return
            except Exception:
                pass
        
        # Train new model on synthetic data
        self._train_synthetic()
        self._save()
    
    def _generate_synthetic_data(self, n_samples: int = 2000) -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data for risk prediction."""
        np.random.seed(42)
        
        features = []
        labels = []
        
        for _ in range(n_samples):
            # Base student characteristics
            current_gpa = np.random.uniform(1.0, 4.0)
            attendance_rate = np.random.uniform(40, 100)
            assignments_completed = np.random.randint(0, 20)
            missing_assignments = np.random.randint(0, 10)
            
            # Trends (negative = declining)
            gpa_trend = np.random.uniform(-0.5, 0.3)
            attendance_trend = np.random.uniform(-20, 10)
            
            # Volatility
            gpa_volatility = np.random.uniform(0, 0.5)
            attendance_volatility = np.random.uniform(0, 15)
            
            # Recent declines (last 3 periods)
            recent_grade_decline = max(0, -gpa_trend * 3 + np.random.uniform(-0.2, 0.2))
            recent_attendance_decline = max(0, -attendance_trend * 0.5 + np.random.uniform(-2, 2))
            
            # Risk logic: Low GPA + declining trend + low attendance + declining attendance = high risk
            risk_score = 0
            
            # GPA factors
            if current_gpa < 2.0:
                risk_score += 0.3
            elif current_gpa < 2.5:
                risk_score += 0.15
            
            if gpa_trend < -0.2:
                risk_score += 0.2
            elif gpa_trend < 0:
                risk_score += 0.1
            
            if gpa_volatility > 0.3:
                risk_score += 0.1
            
            # Attendance factors
            if attendance_rate < 60:
                risk_score += 0.25
            elif attendance_rate < 75:
                risk_score += 0.1
            
            if attendance_trend < -10:
                risk_score += 0.2
            elif attendance_trend < 0:
                risk_score += 0.1
            
            if attendance_volatility > 10:
                risk_score += 0.05
            
            # Assignment factors
            if missing_assignments > 5:
                risk_score += 0.1
            elif missing_assignments > 2:
                risk_score += 0.05
            
            # Recent declines
            risk_score += min(recent_grade_decline * 0.5, 0.15)
            risk_score += min(recent_attendance_decline * 0.01, 0.1)
            
            # Normalize to 0-1
            risk_score = min(max(risk_score, 0), 1)
            
            # Binary label: high risk if score > 0.5
            is_high_risk = 1 if risk_score > 0.5 else 0
            
            features.append([
                current_gpa, gpa_trend, gpa_volatility,
                attendance_rate, attendance_trend, attendance_volatility,
                assignments_completed, missing_assignments,
                recent_grade_decline, recent_attendance_decline
            ])
            labels.append(is_high_risk)
        
        return np.array(features), np.array(labels)
    
    def _train_synthetic(self):
        """Train model on synthetic data."""
        X, y = self._generate_synthetic_data(5000)
        
        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Try both models and pick better one
        lr = LogisticRegression(random_state=42, max_iter=1000, class_weight="balanced")
        dt = DecisionTreeClassifier(random_state=42, max_depth=8, class_weight="balanced")
        
        lr.fit(X_train_scaled, y_train)
        dt.fit(X_train_scaled, y_train)
        
        lr_acc = accuracy_score(y_test, lr.predict(X_test_scaled))
        dt_acc = accuracy_score(y_test, dt.predict(X_test_scaled))
        
        if lr_acc >= dt_acc:
            self.model = lr
        else:
            self.model = dt
        
        print(f"Risk model trained: LR={lr_acc:.3f}, DT={dt_acc:.3f}, Selected={'LR' if lr_acc >= dt_acc else 'DT'}")
    
    def _save(self):
        """Save model to disk."""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump({
                "model": self.model,
                "scaler": self.scaler,
                "feature_names": self.feature_names,
            }, f)
    
    def _calculate_student_features(
        self, 
        db: Session, 
        student_id: int, 
        class_id: Optional[int] = None
    ) -> Dict:
        """Calculate risk features for a student from database."""
        
        # Get student's grades
        grade_query = db.query(Grade).filter(Grade.student_id == student_id)
        if class_id:
            grade_query = grade_query.filter(Grade.class_id == class_id)
        grades = grade_query.order_by(Grade.graded_at.asc()).all()
        
        # Get student's attendance
        att_query = db.query(Attendance).filter(Attendance.student_id == student_id)
        if class_id:
            att_query = att_query.filter(Attendance.class_id == class_id)
        attendance = att_query.order_by(Attendance.date.asc()).all()
        
        if not grades and not attendance:
            return self._default_features()
        
        # Calculate GPA metrics
        if grades:
            percentages = [g.percentage for g in grades]
            current_gpa = np.mean(percentages) / 25  # Convert to 4.0 scale
            
            # GPA trend (linear regression slope over time)
            if len(percentages) >= 2:
                x = np.arange(len(percentages))
                gpa_trend = float(np.polyfit(x, percentages, 1)[0]) / 25  # per assignment
                gpa_volatility = float(np.std(percentages)) / 25
            else:
                gpa_trend = 0
                gpa_volatility = 0
            
            # Recent decline (last 3 grades)
            recent_grades = percentages[-3:] if len(percentages) >= 3 else percentages
            if len(recent_grades) >= 2:
                recent_grade_decline = max(0, (recent_grades[0] - recent_grades[-1]) / 25)
            else:
                recent_grade_decline = 0
            
            assignments_completed = len(grades)
        else:
            current_gpa = 2.0
            gpa_trend = 0
            gpa_volatility = 0
            recent_grade_decline = 0
            assignments_completed = 0
        
        # Calculate attendance metrics
        if attendance:
            total = len(attendance)
            attended = sum(1 for a in attendance if a.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED])
            attendance_rate = (attended / total * 100) if total > 0 else 0
            
            # Attendance trend (monthly)
            monthly_rates = {}
            for a in attendance:
                month_key = a.date.strftime("%Y-%m")
                if month_key not in monthly_rates:
                    monthly_rates[month_key] = {"total": 0, "attended": 0}
                monthly_rates[month_key]["total"] += 1
                if a.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE, AttendanceStatus.EXCUSED]:
                    monthly_rates[month_key]["attended"] += 1
            
            monthly_list = [(k, v["attended"]/v["total"]*100) for k, v in sorted(monthly_rates.items())]
            
            if len(monthly_list) >= 2:
                rates = [r for _, r in monthly_list]
                x = np.arange(len(rates))
                attendance_trend = float(np.polyfit(x, rates, 1)[0])  # per month
                attendance_volatility = float(np.std(rates))
            else:
                attendance_trend = 0
                attendance_volatility = 0
            
            # Recent decline (last 3 months)
            recent_months = monthly_list[-3:] if len(monthly_list) >= 3 else monthly_list
            if len(recent_months) >= 2:
                recent_attendance_decline = max(0, recent_months[0][1] - recent_months[-1][1])
            else:
                recent_attendance_decline = 0
            
            missing_assignments = 0  # Not directly tracked, but could be inferred
        else:
            attendance_rate = 75
            attendance_trend = 0
            attendance_volatility = 0
            recent_attendance_decline = 0
            missing_assignments = 0
        
        return {
            "current_gpa": current_gpa,
            "gpa_trend": gpa_trend,
            "gpa_volatility": gpa_volatility,
            "attendance_rate": attendance_rate,
            "attendance_trend": attendance_trend,
            "attendance_volatility": attendance_volatility,
            "assignments_completed": assignments_completed,
            "missing_assignments": missing_assignments,
            "recent_grade_decline": recent_grade_decline,
            "recent_attendance_decline": recent_attendance_decline,
        }
    
    def _default_features(self) -> Dict:
        """Default features for students with no data."""
        return {
            "current_gpa": 2.5,
            "gpa_trend": 0,
            "gpa_volatility": 0,
            "attendance_rate": 75,
            "attendance_trend": 0,
            "attendance_volatility": 0,
            "assignments_completed": 0,
            "missing_assignments": 0,
            "recent_grade_decline": 0,
            "recent_attendance_decline": 0,
        }
    
    def predict_risk(
        self, 
        db: Session, 
        student_id: int, 
        class_id: Optional[int] = None
    ) -> Dict:
        """Predict risk score for a student."""
        features = self._calculate_student_features(db, student_id, class_id)
        
        # Prepare feature vector
        X = np.array([[features[f] for f in self.feature_names]])
        X_scaled = self.scaler.transform(X)
        
        # Get probability of high risk
        risk_prob = float(self.model.predict_proba(X_scaled)[0][1])
        
        # Determine risk level
        if risk_prob >= 0.7:
            risk_level = "critical"
        elif risk_prob >= 0.5:
            risk_level = "high"
        elif risk_prob >= 0.3:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Contributing factors
        factors = []
        if features["current_gpa"] < 2.0:
            factors.append("Very low GPA (< 2.0)")
        elif features["current_gpa"] < 2.5:
            factors.append("Low GPA (< 2.5)")
        
        if features["gpa_trend"] < -0.1:
            factors.append("Declining grade trend")
        
        if features["attendance_rate"] < 60:
            factors.append("Very low attendance (< 60%)")
        elif features["attendance_rate"] < 75:
            factors.append("Below average attendance (< 75%)")
        
        if features["attendance_trend"] < -5:
            factors.append("Declining attendance trend")
        
        if features["recent_grade_decline"] > 0.1:
            factors.append("Recent grade decline")
        
        if features["recent_attendance_decline"] > 5:
            factors.append("Recent attendance decline")
        
        if features["missing_assignments"] > 3:
            factors.append("Multiple missing assignments")
        
        return {
            "risk_score": round(risk_prob, 4),
            "risk_level": risk_level,
            "gpa_trend": round(features["gpa_trend"], 4),
            "attendance_trend": round(features["attendance_trend"], 2),
            "factors": factors,
            "features": {k: round(v, 4) if isinstance(v, float) else v for k, v in features.items()},
        }
    
    def assess_all_students(
        self, 
        db: Session, 
        class_id: Optional[int] = None
    ) -> List[Dict]:
        """Assess risk for all students (optionally filtered by class)."""
        query = db.query(User).filter(User.role == UserRole.STUDENT)
        students = query.all()
        
        results = []
        for student in students:
            # If class_id specified, check enrollment
            if class_id:
                enrollment = db.query(Enrollment).filter(
                    Enrollment.student_id == student.id,
                    Enrollment.class_id == class_id,
                    Enrollment.is_active == True
                ).first()
                if not enrollment:
                    continue
            
            risk = self.predict_risk(db, student.id, class_id)
            
            # Save to database
            assessment = RiskAssessment(
                student_id=student.id,
                class_id=class_id,
                risk_score=risk["risk_score"],
                risk_level=risk["risk_level"],
                gpa_trend=risk["gpa_trend"],
                attendance_trend=risk["attendance_trend"],
                factors=json.dumps(risk["factors"]),
            )
            db.add(assessment)
            
            results.append({
                "student_id": student.id,
                "student_name": student.full_name,
                "email": student.email,
                "department": student.department,
                **risk,
            })
        
        db.commit()
        return results


# Singleton instance
risk_scorer = RiskScorer()