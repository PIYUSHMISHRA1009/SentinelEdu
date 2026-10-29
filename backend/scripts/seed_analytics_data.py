#!/usr/bin/env python3
"""ETL Pipeline: Data Generation → Validation → Analytics → ML Risk Scoring

This script demonstrates the complete data pipeline:

    Raw/Synthetic Data
         ↓
    Validation (Data Quality Checks)
         ↓
    Cleaning/Transformation
         ↓
    PostgreSQL/SQLite Storage
         ↓
    Analytics Queries
         ↓
    ML Risk Scoring
         ↓
    Dashboard Ready

Usage:
    python scripts/seed_analytics_data.py

Note: Uses synthetic data. See docs/ML_RISK_SCORING.md for details.
"""

import os
import sys

# Add parent dir to path so we can import app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.models import Base, User
from app.db.session import SessionLocal, engine
from app.services.analytics_service import analytics_service
from app.services.data_quality_service import data_quality_service
from app.services.risk_scorer import risk_scorer
from scripts.init_db import init_sample_data


def run_pipeline():
    print("🚀 Starting ETL Pipeline...")

    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Check if data exists
        if db.query(User).count() > 0:
            print("✅ Data already exists. Skipping generation.")
        else:
            print("⏳ Generating synthetic data...")
            init_sample_data()
            print("✅ Data generation complete.")

        # 2. Validation
        print("\n⏳ Running Data Quality Validation...")
        quality_report = data_quality_service.run_quality_checks(db)
        summary_dq = quality_report.get("summary", {})
        print(
            f"✅ Data Quality Summary: Checked {summary_dq.get('total_records_checked', 0)} records, {summary_dq.get('valid_records', 0)} valid, {summary_dq.get('issues_found', 0)} issues."
        )
        categories = quality_report.get("categories", [])
        if categories:
            print(f"⚠️ Found issues across {len(categories)} categories:")
            for cat in categories:
                print(f"  - {cat.get('category')}: {cat.get('issue_count')} issue(s)")

        # 3. Analytics
        print("\n⏳ Generating Analytics Summary...")
        summary = analytics_service.get_summary(db)
        print(f"✅ Analyzed {summary.get('total_students', 0)} total students.")
        print(f"✅ Average Attendance Rate: {summary.get('avg_attendance', 0)}%")
        print(f"✅ Average GPA: {summary.get('avg_gpa', 0)}")

        # 4. ML Risk Scoring
        print("\n⏳ Running Risk Assessments...")
        results = risk_scorer.assess_all_students(db)
        high_risk = sum(
            1 for r in results if r.get("risk_level") in ["high", "critical"]
        )
        print(
            f"✅ Risk assessment complete. Found {high_risk} high/critical risk students out of {len(results)}."
        )

        print("\n🎉 ETL Pipeline completed successfully!")

    except Exception as e:
        print(f"❌ Pipeline failed: {e}")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    run_pipeline()
