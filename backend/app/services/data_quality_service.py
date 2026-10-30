from datetime import datetime

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db.models import Attendance, Class, Enrollment, Grade, User, UserRole


class DataQualityService:
    def run_quality_checks(self, db: Session) -> dict:
        total_records_checked = 0
        issues_found = 0
        categories = []

        # Students query
        students_query = db.query(User).filter(User.role == UserRole.STUDENT)
        student_ids = [s.id for s in students_query.all()]
        total_records_checked += len(student_ids)

        # 1. Missing values
        missing_grades = []
        missing_attendance = []
        for s_id in student_ids:
            has_grade = db.query(Grade).filter(Grade.student_id == s_id).first()
            if not has_grade:
                missing_grades.append(f"Student {s_id} has no grades")

            has_attendance = (
                db.query(Attendance).filter(Attendance.student_id == s_id).first()
            )
            if not has_attendance:
                missing_attendance.append(f"Student {s_id} has no attendance records")

        if missing_grades or missing_attendance:
            categories.append(
                {
                    "category": "Missing Values",
                    "issue_count": len(missing_grades) + len(missing_attendance),
                    "details": missing_grades + missing_attendance,
                }
            )
            issues_found += len(missing_grades) + len(missing_attendance)

        # 2. Invalid grade score
        invalid_gpa_query = db.query(Grade).filter(
            or_(
                Grade.percentage > 100,
                Grade.percentage < 0,
                Grade.score > Grade.max_score,
                Grade.score < 0,
            )
        )
        invalid_gpas = invalid_gpa_query.all()
        if invalid_gpas:
            categories.append(
                {
                    "category": "Invalid grade score",
                    "issue_count": len(invalid_gpas),
                    "details": [
                        f"Grade {g.id} has invalid values: score={g.score}, max={g.max_score}, pct={g.percentage}"
                        for g in invalid_gpas
                    ],
                }
            )
            issues_found += len(invalid_gpas)

        grade_count = db.query(Grade).count()
        total_records_checked += grade_count

        # 3. Invalid attendance (future dates)
        invalid_att_query = db.query(Attendance).filter(
            Attendance.date > datetime.now().date()
        )
        invalid_atts = invalid_att_query.all()
        if invalid_atts:
            categories.append(
                {
                    "category": "Invalid Attendance",
                    "issue_count": len(invalid_atts),
                    "details": [
                        f"Attendance {a.id} has future date {a.date}"
                        for a in invalid_atts
                    ],
                }
            )
            issues_found += len(invalid_atts)

        att_count = db.query(Attendance).count()
        total_records_checked += att_count

        # 4. Duplicate attendance
        dups = (
            db.query(
                Attendance.student_id,
                Attendance.class_id,
                Attendance.date,
                func.count("*").label("c"),
            )
            .group_by(Attendance.student_id, Attendance.class_id, Attendance.date)
            .having(func.count("*") > 1)
            .all()
        )

        if dups:
            categories.append(
                {
                    "category": "Duplicate Attendance",
                    "issue_count": len(dups),
                    "details": [
                        f"Student {d.student_id} class {d.class_id} date {d.date} has {d.c} records"
                        for d in dups
                    ],
                }
            )
            issues_found += len(dups)

        # 5. Orphan grades
        grades = db.query(Grade).all()
        orphan_grades = []
        for g in grades:
            enr = (
                db.query(Enrollment)
                .filter(
                    Enrollment.student_id == g.student_id,
                    Enrollment.class_id == g.class_id,
                    Enrollment.is_active.is_(True),
                )
                .first()
            )
            if not enr:
                orphan_grades.append(
                    f"Grade {g.id} belongs to student {g.student_id} not actively enrolled in class {g.class_id}"
                )
        if orphan_grades:
            categories.append(
                {
                    "category": "Orphan Grades",
                    "issue_count": len(orphan_grades),
                    "details": orphan_grades,
                }
            )
            issues_found += len(orphan_grades)

        # 6. Missing enrollments
        missing_enrollments = []
        for s_id in student_ids:
            enr_count = (
                db.query(Enrollment).filter(Enrollment.student_id == s_id).count()
            )
            if enr_count == 0:
                missing_enrollments.append(f"Student {s_id} has 0 enrollments")
        if missing_enrollments:
            categories.append(
                {
                    "category": "Missing Enrollments",
                    "issue_count": len(missing_enrollments),
                    "details": missing_enrollments,
                }
            )
            issues_found += len(missing_enrollments)

        # 7. Empty classes
        classes = db.query(Class).all()
        empty_classes = []
        total_records_checked += len(classes)
        for c in classes:
            enr_count = (
                db.query(Enrollment)
                .filter(Enrollment.class_id == c.id, Enrollment.is_active.is_(True))
                .count()
            )
            if enr_count == 0:
                empty_classes.append(
                    f"Class {c.id} ({c.code}) has 0 active enrollments"
                )
        if empty_classes:
            categories.append(
                {
                    "category": "Empty Classes",
                    "issue_count": len(empty_classes),
                    "details": empty_classes,
                }
            )
            issues_found += len(empty_classes)

        # 8. Referential integrity
        ref_issues = []
        for g in grades:
            if g.student_id not in student_ids:
                ref_issues.append(
                    f"Grade {g.id} references missing student {g.student_id}"
                )
            if not db.query(Class).filter(Class.id == g.class_id).first():
                ref_issues.append(f"Grade {g.id} references missing class {g.class_id}")

        attendances = db.query(Attendance).all()
        for a in attendances:
            if a.student_id not in student_ids:
                ref_issues.append(
                    f"Attendance {a.id} references missing student {a.student_id}"
                )
            if not db.query(Class).filter(Class.id == a.class_id).first():
                ref_issues.append(
                    f"Attendance {a.id} references missing class {a.class_id}"
                )

        if ref_issues:
            categories.append(
                {
                    "category": "Referential Integrity",
                    "issue_count": len(ref_issues),
                    "details": ref_issues,
                }
            )
            issues_found += len(ref_issues)

        valid_records = total_records_checked - issues_found

        return {
            "summary": {
                "total_records_checked": total_records_checked,
                "valid_records": max(0, valid_records),
                "issues_found": issues_found,
                "check_timestamp": datetime.now().isoformat(),
            },
            "categories": categories,
        }


data_quality_service = DataQualityService()
