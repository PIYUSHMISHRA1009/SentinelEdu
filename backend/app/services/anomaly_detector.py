"""
Anomalous Access Detection Service for InsightFlow Edu.

Uses Isolation Forest (unsupervised) to detect anomalous access patterns
from audit logs. Runs locally with scikit-learn - no external dependencies.
"""

import os
import json
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from sqlalchemy.orm import Session

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split

from app.db.models import User, AuditLog
from app.db.session import SessionLocal


class AnomalyDetector:
    """
    ML-powered anomaly detection for security events.
    
    Detects:
    - Impossible travel (login from distant locations in short time)
    - Privilege escalation attempts
    - Unusual access times
    - Unusual resource access patterns
    - Brute force login attempts
    """
    
    def __init__(self, model_path: str = "app/ml/anomaly_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = [
            "hour_of_day",
            "day_of_week",
            "is_weekend",
            "user_id_encoded",
            "action_encoded",
            "resource_encoded",
            "outcome_encoded",
            "ip_encoded",
            "user_agent_encoded",
            "time_since_last_event",
            "events_last_hour",
            "unique_resources_last_hour",
            "failed_login_ratio",
            "geo_distance_from_last_login",
            "time_since_last_login"
        ]
        self._load_or_train()
    
    def _load_or_train(self):
        """Load existing model or train a new one."""
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    saved = pickle.load(f)
                    self.model = saved["model"]
                    self.scaler = saved["scaler"]
                    self.label_encoders = saved["label_encoders"]
                print(f"Loaded anomaly model from {self.model_path}")
                return
            except Exception as e:
                print(f"Failed to load model: {e}")
        
        # Train new model
        self._train_initial()
        self._save()
    
    def _train_initial(self):
        """Train initial model on synthetic normal data."""
        print("Training initial anomaly detection model...")
        
        # Generate synthetic normal behavior data
        X_normal = self._generate_normal_behavior(10000)
        
        # Train Isolation Forest (unsupervised - only normal data)
        self.model = IsolationForest(
            n_estimators=200,
            contamination=0.01,  # Expect ~1% anomalies
            max_samples="auto",
            random_state=42,
            n_jobs=-1
        )
        
        X_scaled = self.scaler.fit_transform(X_normal)
        self.model.fit(X_scaled)
        
        print(f"Anomaly model trained on {len(X_normal)} normal samples")
    
    def _generate_normal_behavior(self, n_samples: int) -> np.ndarray:
        """Generate synthetic normal behavior data for initial training."""
        np.random.seed(42)
        
        features = []
        
        # Normal behavior patterns
        for _ in range(n_samples):
            # Time features - normal business hours
            hour = np.random.choice(range(8, 19), p=[1/11]*11)  # 8AM-6PM (11 hours, equal probability)
            day_of_week = np.random.choice(range(5), p=[0.2]*5)  # Mon-Fri
            
            feature = [
                hour,                    # hour_of_day
                day_of_week,             # day_of_week
                0,                       # is_weekend (0 for Mon-Fri)
                np.random.randint(0, 100),  # user_id_encoded
                np.random.randint(0, 5),    # action_encoded (read, write, login, etc.)
                np.random.randint(0, 20),   # resource_encoded
                0,                       # outcome_encoded (success)
                np.random.randint(0, 50),   # ip_encoded
                np.random.randint(0, 10),   # user_agent_encoded
                np.random.exponential(300), # time_since_last_event (seconds)
                np.random.poisson(10),      # events_last_hour
                np.random.poisson(5),       # unique_resources_last_hour
                0.0,                       # failed_login_ratio
                0.0,                       # geo_distance_from_last_login
                np.random.exponential(3600) # time_since_last_login
            ]
            features.append(feature)
        
        return np.array(features)
    
    def _save(self):
        """Save model to disk."""
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        with open(self.model_path, "wb") as f:
            pickle.dump({
                "model": self.model,
                "scaler": self.scaler,
                "label_encoders": self.label_encoders,
                "feature_names": self.feature_names,
            }, f)
        print(f"Saved anomaly model to {self.model_path}")
    
    def _extract_features_from_audit_logs(
        self,
        db: Session,
        hours_back: int = 24,
        user_id: Optional[int] = None
    ) -> Tuple[np.ndarray, List[Dict]]:
        """
        Extract ML features from audit logs.
        
        Returns:
            Tuple of (feature_matrix, log_entries)
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours_back)
        
        query = db.query(AuditLog).filter(AuditLog.timestamp >= cutoff)
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        logs = query.order_by(AuditLog.timestamp.asc()).all()
        
        if not logs:
            return np.array([]), []
        
        # Group by user for sequential features
        user_logs = defaultdict(list)
        for log in logs:
            user_logs[log.user_id].append(log)
        
        features_list = []
        log_entries = []
        
        for uid, user_log_list in user_logs.items():
            user_log_list.sort(key=lambda x: x.timestamp)
            
            for i, log in enumerate(user_log_list):
                # Extract features for this log entry
                feature = self._extract_single_event_features(
                    log, user_log_list, i, uid
                )
                features_list.append(feature)
                log_entries.append({
                    "log_id": log.id,
                    "user_id": log.user_id,
                    "timestamp": log.timestamp.isoformat(),
                    "event_type": log.event_type,
                    "resource": log.resource,
                    "action": log.action,
                    "outcome": log.outcome
                })
        
        return np.array(features_list), log_entries
    
    def _extract_single_event_features(
            self,
            log: "AuditLog",
            user_logs: List,
            index: int,
            user_id: int
        ) -> List[float]:
            """Extract features for a single audit log entry."""
        
            ts = log.timestamp
        
            # Time features
            hour_of_day = int(ts.hour)
            day_of_week = int(ts.weekday())  # 0=Mon
            is_weekend = 1 if day_of_week >= 5 else 0
        
            # Encode categorical features (use hash for unseen values)
            user_id_encoded = int(hash(str(log.user_id)) % 10000)
            action_encoded = int(hash(log.action or "unknown") % 100)
            resource_encoded = int(hash(log.resource or "unknown") % 1000)
            outcome_encoded = 0 if log.outcome == "success" else 1
            ip_encoded = int(hash(log.client_ip or "unknown") % 1000)
            user_agent_encoded = int(hash(log.user_agent or "unknown") % 1000)
        
            # Sequential features
            if index > 0:
                prev_log = user_logs[index - 1]
                time_since_last_event = float((log.timestamp - prev_log.timestamp).total_seconds())
            else:
                time_since_last_event = 0.0
        
            # Events in last hour
            hour_ago = log.timestamp - timedelta(hours=1)
            events_last_hour = int(sum(
                1 for l in user_logs 
                if l.timestamp >= hour_ago and l.timestamp <= log.timestamp
            ))
        
            # Unique resources in last hour
            unique_resources = int(len(set(
                l.resource for l in user_logs
                if l.timestamp >= hour_ago and l.timestamp <= log.timestamp
            )))
        
            # Failed login ratio (last 10 events)
            recent = user_logs[max(0, user_logs.index(log)):max(0, user_logs.index(log))-10:-1]
            if recent:
                failed = sum(1 for l in recent if l.outcome == "failure")
                failed_login_ratio = float(failed / len(recent))
            else:
                failed_login_ratio = 0.0
        
            # Geo distance (simplified - use IP hash difference)
            if index > 0:
                geo_distance = float(abs(hash(log.client_ip or "") - hash(user_logs[index-1].client_ip or "")) % 10000)
            else:
                geo_distance = 0.0
        
            # Time since last login
            last_login = None
            for l in reversed(user_logs[:index]):
                if l.action == "login" and l.outcome == "success":
                    last_login = l.timestamp
                    break
            if last_login:
                time_since_last_login = float((log.timestamp - last_login).total_seconds())
            else:
                time_since_last_login = 86400.0  # 24 hours default
        
            return [
                float(hour_of_day),
                float(day_of_week),
                float(is_weekend),
                float(user_id_encoded),
                float(action_encoded),
                float(resource_encoded),
                float(outcome_encoded),
                float(ip_encoded),
                float(user_agent_encoded),
                time_since_last_event,
                float(events_last_hour),
                float(unique_resources),
                failed_login_ratio,
                geo_distance,
                time_since_last_login
            ]
    
    def detect_anomalies(
        self,
        db: Session,
        hours_back: int = 24,
        user_id: Optional[int] = None,
        threshold: float = -0.5
    ) -> List[Dict]:
        """
        Detect anomalies in audit logs.
        
        Args:
            db: Database session
            hours_back: Hours of logs to analyze
            user_id: Optional specific user
            threshold: Anomaly score threshold (more negative = more anomalous)
        
        Returns:
            List of detected anomalies with details
        """
        X, log_entries = self._extract_features_from_audit_logs(db, hours_back, user_id)
        
        if len(X) == 0:
            return []
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get anomaly scores (negative = more anomalous)
        scores = self.model.decision_function(X_scaled)
        predictions = self.model.predict(X_scaled)  # -1 = anomaly, 1 = normal
        
        anomalies = []
        for i, (score, pred, log_entry) in enumerate(zip(scores, predictions, log_entries)):
            # Convert numpy types to Python native
            is_anomaly = bool(int(pred) == -1)
            if is_anomaly or score < threshold:
                anomaly = {
                    "log_id": int(log_entry["log_id"]),
                    "user_id": int(log_entry["user_id"]),
                    "timestamp": log_entry["timestamp"],
                    "event_type": log_entry["event_type"],
                    "resource": log_entry["resource"],
                    "action": log_entry["action"],
                    "outcome": log_entry["outcome"],
                    "anomaly_score": float(score),
                    "is_anomaly": is_anomaly,
                    "severity": self._calculate_severity(score),
                    "description": self._generate_description(log_entry, score)
                }
                anomalies.append(anomaly)
        
        # Sort by anomaly score (most anomalous first)
        anomalies.sort(key=lambda x: x["anomaly_score"])
        
        return anomalies
    
    def _calculate_severity(self, score: float) -> str:
        """Calculate severity based on anomaly score."""
        if score < -0.8:
            return "critical"
        elif score < -0.5:
            return "high"
        elif score < -0.2:
            return "medium"
        else:
            return "low"
    
    def _generate_description(self, log_entry: Dict, score: float) -> str:
        """Generate human-readable description of anomaly."""
        action = log_entry.get("action", "unknown")
        resource = log_entry.get("resource", "unknown")
        outcome = log_entry.get("outcome", "unknown")
        
        if outcome == "failure":
            return f"Failed {action} on {resource} - possible attack attempt"
        elif log_entry.get("action") == "login":
            return f"Unusual login pattern detected"
        else:
            return f"Anomalous {action} on {resource} (score: {score:.3f})"
    
    def detect_impossible_travel(
        self,
        db: Session,
        hours_back: int = 24
    ) -> List[Dict]:
        """
        Detect impossible travel - login from distant locations in short time.
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours_back)
        
        logins = db.query(AuditLog).filter(
            AuditLog.timestamp >= cutoff,
            AuditLog.action == "login",
            AuditLog.outcome == "success"
        ).order_by(AuditLog.user_id, AuditLog.timestamp.asc()).all()
        
        alerts = []
        user_last_login = {}
        
        for login in logins:
            uid = login.user_id
            current_ip = login.client_ip
            current_time = login.timestamp
            
            if uid in user_last_login:
                last_ip = user_last_login[uid]["ip"]
                last_time = user_last_login[uid]["time"]
                
                # Simplified geo distance using IP hash difference
                # In production, use real GeoIP database
                ip_distance = abs(hash(current_ip or "") - hash(last_ip or "")) % 100000
                time_diff_hours = (login.timestamp - last_time).total_seconds() / 3600
                
                # Impossible travel: high IP distance in short time
                # Rough threshold: >10000 IP distance in <2 hours
                if ip_distance > 10000 and time_diff_hours < 2:
                    alerts.append({
                        "type": "impossible_travel",
                        "user_id": int(uid),
                        "user_email": login.user_email,
                        "first_location_ip": last_ip,
                        "second_location_ip": current_ip,
                        "first_time": last_time.isoformat(),
                        "second_time": current_time.isoformat(),
                        "time_diff_hours": float(round(time_diff_hours, 2)),
                        "ip_distance": int(ip_distance),
                        "severity": "high" if time_diff_hours < 1 else "medium",
                        "description": f"Impossible travel: {ip_distance} IP distance in {time_diff_hours:.1f} hours"
                    })
            
            user_last_login[uid] = {"ip": current_ip, "time": login.timestamp}
        
        return alerts
    
    def detect_privilege_escalation(
        self,
        db: Session,
        hours_back: int = 24
    ) -> List[Dict]:
        """
        Detect privilege escalation attempts.
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours_back)
        
        # Look for failed permission checks followed by config changes
        events = db.query(AuditLog).filter(
            AuditLog.timestamp >= cutoff,
            AuditLog.event_type.in_(["authorization.check", "config.change", "auth.login"])
        ).order_by(AuditLog.user_id, AuditLog.timestamp.asc()).all()
        
        alerts = []
        user_failed_authz = defaultdict(int)
        
        for event in events:
            uid = event.user_id
            
            if event.event_type == "authorization.check" and event.outcome == "denied":
                user_failed_authz[uid] += 1
            
            elif event.event_type == "config.change" and event.outcome == "success":
                if user_failed_authz[uid] >= 3:
                    alerts.append({
                        "type": "privilege_escalation",
                        "user_id": int(uid),
                        "user_email": event.user_email,
                        "failed_authz_count": int(user_failed_authz[uid]),
                        "config_change": event.details,
                        "timestamp": event.timestamp.isoformat(),
                        "severity": "critical",
                        "description": f"Config change after {user_failed_authz[uid]} failed authorization checks"
                    })
        
        return alerts
    
    def detect_brute_force(
        self,
        db: Session,
        hours_back: int = 1
    ) -> List[Dict]:
        """
        Detect brute force login attempts.
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours_back)
        
        failed_logins = db.query(AuditLog).filter(
            AuditLog.timestamp >= cutoff,
            AuditLog.action == "login",
            AuditLog.outcome == "failure"
        ).all()
        
        # Group by IP
        ip_failures = defaultdict(list)
        for login in failed_logins:
            ip_failures[login.client_ip].append(login)
        
        alerts = []
        for ip, failures in ip_failures.items():
            if len(failures) >= 5:  # 5+ failed attempts in 1 hour
                alerts.append({
                    "type": "brute_force",
                    "ip": ip,
                    "failure_count": int(len(failures)),
                    "time_window_hours": 1,
                    "targeted_users": [int(f.user_id) for f in failures],
                    "severity": "high" if len(failures) >= 10 else "medium",
                    "description": f"Brute force attack from {ip}: {len(failures)} failed logins"
                })
        
        return alerts
    
    def run_full_detection(
        self,
        db: Session,
        hours_back: int = 24
    ) -> Dict:
        """
        Run all detection algorithms and return combined results.
        """
        anomalies = self.detect_anomalies(db, hours_back)
        impossible_travel = self.detect_impossible_travel(db, hours_back)
        privilege_escalation = self.detect_privilege_escalation(db, hours_back)
        brute_force = self.detect_brute_force(db, hours_back)
        
        all_alerts = anomalies + impossible_travel + privilege_escalation + brute_force
        
        # Convert all numpy types to Python native types
        def convert_to_native(obj):
            if isinstance(obj, dict):
                return {k: convert_to_native(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_to_native(v) for v in obj]
            elif hasattr(obj, 'item'):  # numpy scalar
                return obj.item()
            elif hasattr(obj, 'tolist'):  # numpy array
                return obj.tolist()
            return obj
        
        all_alerts = convert_to_native(all_alerts)
        
        # Sort by severity
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        all_alerts.sort(key=lambda x: severity_order.get(x.get("severity", "low"), 3))
        
        return {
            "total_alerts": len(all_alerts),
            "by_severity": {
                "critical": len([a for a in all_alerts if a.get("severity") == "critical"]),
                "high": len([a for a in all_alerts if a.get("severity") == "high"]),
                "medium": len([a for a in all_alerts if a.get("severity") == "medium"]),
                "low": len([a for a in all_alerts if a.get("severity") == "low"])
            },
            "by_type": {
                "anomaly": len([a for a in all_alerts if a.get("type") == "anomaly"]),
                "impossible_travel": len([a for a in all_alerts if a.get("type") == "impossible_travel"]),
                "privilege_escalation": len([a for a in all_alerts if a.get("type") == "privilege_escalation"]),
                "brute_force": len([a for a in all_alerts if a.get("type") == "brute_force"])
            },
            "alerts": all_alerts[:50],  # Top 50
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    
    def retrain_with_feedback(
        self,
        db: Session,
        confirmed_anomalies: List[int],  # log_ids confirmed as true anomalies
        false_positives: List[int],     # log_ids confirmed as false positives
        hours_back: int = 168  # 1 week
    ):
        """
        Retrain model with analyst feedback.
        """
        # Extract features for confirmed anomalies and false positives
        # This is a simplified version - in production, use proper active learning
        print(f"Retraining with {len(confirmed_anomalies)} confirmed anomalies and {len(false_positives)} false positives")
        
        # For now, just retrain on all recent data with adjusted contamination
        X, _ = self._extract_features_from_audit_logs(db, hours_back)
        
        if len(X) > 100:
            X_scaled = self.scaler.fit_transform(X)
            self.model = IsolationForest(
                n_estimators=200,
                contamination=0.02,  # Slightly higher after feedback
                random_state=42,
                n_jobs=-1
            )
            self.model.fit(X_scaled)
            self._save()


# Global instance
anomaly_detector = AnomalyDetector()