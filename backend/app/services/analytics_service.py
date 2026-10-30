import logging
from typing import Any, Dict, List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.models import AttendanceStatus, User, UserRole

logger = logging.getLogger(__name__)


class AnalyticsService:
    _PRESENT_STATUS = AttendanceStatus.PRESENT.name
    _STUDENT_ROLE = UserRole.STUDENT.name

    def _is_teacher(self, user: Optional[User]) -> bool:
        if not user:
            return False
        role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
        return role_val.lower() == "teacher"

    def get_summary(self, db: Session, user: Optional[User] = None) -> Dict[str, Any]:
        """
        Get high-level summary statistics across students.
        Scoped to assigned students if caller is a Teacher; institution-wide if Admin.
        """
        if self._is_teacher(user):
            query = text(
                """
                WITH TeacherStudents AS (
                    SELECT DISTINCT e.student_id
                    FROM enrollments e
                    JOIN classes c ON e.class_id = c.id
                    WHERE c.teacher_id = :teacher_id AND e.is_active IS TRUE
                ),
                StudentGrades AS (
                    SELECT g.student_id, AVG(g.percentage) as avg_grade
                    FROM grades g
                    JOIN TeacherStudents ts ON g.student_id = ts.student_id
                    GROUP BY g.student_id
                ),
                StudentAttendance AS (
                    SELECT a.student_id,
                           CAST(SUM(CASE WHEN a.status = :present_status THEN 1 ELSE 0 END) AS FLOAT) /
                           NULLIF(COUNT(a.id), 0) * 100 as attendance_rate
                    FROM attendance a
                    JOIN TeacherStudents ts ON a.student_id = ts.student_id
                    GROUP BY a.student_id
                )
                SELECT 
                    (SELECT COUNT(*) FROM TeacherStudents) as total_students,
                    AVG(g.avg_grade) as avg_gpa,
                    AVG(a.attendance_rate) as avg_attendance,
                    SUM(CASE WHEN g.avg_grade < 70 OR a.attendance_rate < 80 THEN 1 ELSE 0 END) as at_risk_count
                FROM TeacherStudents ts
                LEFT JOIN StudentGrades g ON ts.student_id = g.student_id
                LEFT JOIN StudentAttendance a ON ts.student_id = a.student_id
            """
            )
            result = (
                db.execute(
                    query,
                    {"teacher_id": user.id, "present_status": self._PRESENT_STATUS},
                )
                .mappings()
                .first()
            )

            declining_query = text(
                """
                WITH TeacherStudents AS (
                    SELECT DISTINCT e.student_id
                    FROM enrollments e
                    JOIN classes c ON e.class_id = c.id
                    WHERE c.teacher_id = :teacher_id AND e.is_active IS TRUE
                ),
                RankedGrades AS (
                    SELECT 
                        g.student_id,
                        g.percentage,
                        ROW_NUMBER() OVER (PARTITION BY g.student_id ORDER BY g.graded_at DESC) as rn
                    FROM grades g
                    JOIN TeacherStudents ts ON g.student_id = ts.student_id
                ),
                RecentGrades AS (
                    SELECT student_id, AVG(percentage) as recent_avg
                    FROM RankedGrades
                    WHERE rn <= 3
                    GROUP BY student_id
                ),
                OlderGrades AS (
                    SELECT student_id, AVG(percentage) as older_avg
                    FROM RankedGrades
                    WHERE rn > 3
                    GROUP BY student_id
                )
                SELECT COUNT(r.student_id) as declining_count
                FROM RecentGrades r
                JOIN OlderGrades o ON r.student_id = o.student_id
                WHERE r.recent_avg < o.older_avg - 5
            """
            )
            declining_result = (
                db.execute(declining_query, {"teacher_id": user.id}).mappings().first()
            )
        else:
            query = text(
                """
                WITH StudentGrades AS (
                    SELECT student_id, AVG(percentage) as avg_grade
                    FROM grades
                    GROUP BY student_id
                ),
                StudentAttendance AS (
                    SELECT student_id,
                           CAST(SUM(CASE WHEN status = :present_status THEN 1 ELSE 0 END) AS FLOAT) /
                           NULLIF(COUNT(id), 0) * 100 as attendance_rate
                    FROM attendance
                    GROUP BY student_id
                )
                SELECT 
                    (SELECT COUNT(id) FROM users WHERE CAST(role AS TEXT) = :student_role) as total_students,
                    AVG(g.avg_grade) as avg_gpa,
                    AVG(a.attendance_rate) as avg_attendance,
                    SUM(CASE WHEN g.avg_grade < 70 OR a.attendance_rate < 80 THEN 1 ELSE 0 END) as at_risk_count
                FROM users u
                LEFT JOIN StudentGrades g ON u.id = g.student_id
                LEFT JOIN StudentAttendance a ON u.id = a.student_id
                WHERE CAST(u.role AS TEXT) = :student_role
            """
            )
            result = (
                db.execute(
                    query,
                    {
                        "present_status": self._PRESENT_STATUS,
                        "student_role": self._STUDENT_ROLE,
                    },
                )
                .mappings()
                .first()
            )

            declining_query = text(
                """
                WITH RankedGrades AS (
                    SELECT 
                        student_id,
                        percentage,
                        ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY graded_at DESC) as rn
                    FROM grades
                ),
                RecentGrades AS (
                    SELECT student_id, AVG(percentage) as recent_avg
                    FROM RankedGrades
                    WHERE rn <= 3
                    GROUP BY student_id
                ),
                OlderGrades AS (
                    SELECT student_id, AVG(percentage) as older_avg
                    FROM RankedGrades
                    WHERE rn > 3
                    GROUP BY student_id
                )
                SELECT COUNT(r.student_id) as declining_count
                FROM RecentGrades r
                JOIN OlderGrades o ON r.student_id = o.student_id
                WHERE r.recent_avg < o.older_avg - 5
            """
            )
            declining_result = db.execute(declining_query).mappings().first()

        summary = dict(result) if result else {}
        summary["declining_students"] = (
            declining_result["declining_count"] if declining_result else 0
        )
        return summary

    def get_department_performance(
        self, db: Session, user: Optional[User] = None
    ) -> List[Dict[str, Any]]:
        """
        Get average performance metrics grouped by department.
        """
        if self._is_teacher(user):
            query = text(
                """
                SELECT 
                    u.department,
                    COUNT(DISTINCT u.id) as student_count,
                    AVG(g.percentage) as avg_score
                FROM users u
                JOIN grades g ON u.id = g.student_id
                JOIN enrollments e ON u.id = e.student_id
                JOIN classes c ON e.class_id = c.id
                WHERE CAST(u.role AS TEXT) = :student_role AND u.department IS NOT NULL
                  AND c.teacher_id = :teacher_id AND e.is_active IS TRUE
                GROUP BY u.department
                HAVING COUNT(DISTINCT u.id) > 0
                ORDER BY avg_score DESC
            """
            )
            return [
                dict(row)
                for row in db.execute(
                    query, {"teacher_id": user.id, "student_role": self._STUDENT_ROLE}
                )
                .mappings()
                .all()
            ]
        else:
            query = text(
                """
                SELECT 
                    u.department,
                    COUNT(DISTINCT u.id) as student_count,
                    AVG(g.percentage) as avg_score
                FROM users u
                JOIN grades g ON u.id = g.student_id
                WHERE CAST(u.role AS TEXT) = :student_role AND u.department IS NOT NULL
                GROUP BY u.department
                HAVING COUNT(DISTINCT u.id) > 0
                ORDER BY avg_score DESC
            """
            )
            return [
                dict(row)
                for row in db.execute(query, {"student_role": self._STUDENT_ROLE})
                .mappings()
                .all()
            ]

    def get_class_performance(
        self, db: Session, user: Optional[User] = None
    ) -> List[Dict[str, Any]]:
        """
        Get average performance metrics grouped by class.
        """
        if self._is_teacher(user):
            query = text(
                """
                SELECT 
                    c.code,
                    c.name,
                    c.department,
                    COUNT(DISTINCT e.student_id) as enrolled_students,
                    AVG(g.percentage) as avg_score
                FROM classes c
                LEFT JOIN enrollments e ON c.id = e.class_id AND e.is_active IS TRUE
                LEFT JOIN grades g ON c.id = g.class_id
                WHERE c.teacher_id = :teacher_id
                GROUP BY c.id, c.code, c.name, c.department
                ORDER BY avg_score DESC
            """
            )
            return [
                dict(row)
                for row in db.execute(query, {"teacher_id": user.id}).mappings().all()
            ]
        else:
            query = text(
                """
                SELECT 
                    c.code,
                    c.name,
                    c.department,
                    COUNT(DISTINCT e.student_id) as enrolled_students,
                    AVG(g.percentage) as avg_score
                FROM classes c
                LEFT JOIN enrollments e ON c.id = e.class_id AND e.is_active IS TRUE
                LEFT JOIN grades g ON c.id = g.class_id
                GROUP BY c.id, c.code, c.name, c.department
                ORDER BY avg_score DESC
            """
            )
            return [dict(row) for row in db.execute(query).mappings().all()]

    def get_gpa_distribution(
        self, db: Session, user: Optional[User] = None
    ) -> List[Dict[str, Any]]:
        """
        Get distribution of students across GPA buckets.
        """
        if self._is_teacher(user):
            query = text(
                """
                WITH TeacherStudents AS (
                    SELECT DISTINCT e.student_id
                    FROM enrollments e
                    JOIN classes c ON e.class_id = c.id
                    WHERE c.teacher_id = :teacher_id AND e.is_active IS TRUE
                ),
                StudentGPA AS (
                    SELECT g.student_id, AVG(g.percentage) as avg_score
                    FROM grades g
                    JOIN TeacherStudents ts ON g.student_id = ts.student_id
                    GROUP BY g.student_id
                )
                SELECT 
                    CASE 
                        WHEN avg_score >= 90 THEN 'Excellent (90-100)'
                        WHEN avg_score >= 80 THEN 'Good (80-89)'
                        WHEN avg_score >= 70 THEN 'Average (70-79)'
                        ELSE 'At Risk (<70)'
                    END as bucket,
                    COUNT(student_id) as student_count,
                    COUNT(student_id) as count
                FROM StudentGPA
                GROUP BY 
                    CASE 
                        WHEN avg_score >= 90 THEN 'Excellent (90-100)'
                        WHEN avg_score >= 80 THEN 'Good (80-89)'
                        WHEN avg_score >= 70 THEN 'Average (70-79)'
                        ELSE 'At Risk (<70)'
                    END
            """
            )
            return [
                dict(row)
                for row in db.execute(query, {"teacher_id": user.id}).mappings().all()
            ]
        else:
            query = text(
                """
                WITH StudentGPA AS (
                    SELECT student_id, AVG(percentage) as avg_score
                    FROM grades
                    GROUP BY student_id
                )
                SELECT 
                    CASE 
                        WHEN avg_score >= 90 THEN 'Excellent (90-100)'
                        WHEN avg_score >= 80 THEN 'Good (80-89)'
                        WHEN avg_score >= 70 THEN 'Average (70-79)'
                        ELSE 'At Risk (<70)'
                    END as bucket,
                    COUNT(student_id) as student_count,
                    COUNT(student_id) as count
                FROM StudentGPA
                GROUP BY 
                    CASE 
                        WHEN avg_score >= 90 THEN 'Excellent (90-100)'
                        WHEN avg_score >= 80 THEN 'Good (80-89)'
                        WHEN avg_score >= 70 THEN 'Average (70-79)'
                        ELSE 'At Risk (<70)'
                    END
            """
            )
            return [dict(row) for row in db.execute(query).mappings().all()]

    def get_attendance_vs_gpa(
        self, db: Session, user: Optional[User] = None
    ) -> List[Dict[str, Any]]:
        """
        Correlation between attendance and GPA per student.
        """
        if self._is_teacher(user):
            query = text(
                """
                WITH TeacherStudents AS (
                    SELECT DISTINCT e.student_id
                    FROM enrollments e
                    JOIN classes c ON e.class_id = c.id
                    WHERE c.teacher_id = :teacher_id AND e.is_active IS TRUE
                ),
                StudentGPA AS (
                    SELECT g.student_id, AVG(g.percentage) as avg_gpa
                    FROM grades g
                    JOIN TeacherStudents ts ON g.student_id = ts.student_id
                    GROUP BY g.student_id
                ),
                StudentAttendance AS (
                    SELECT a.student_id,
                           CAST(SUM(CASE WHEN a.status = :present_status THEN 1 ELSE 0 END) AS FLOAT) /
                           NULLIF(COUNT(a.id), 0) * 100 as attendance_rate
                    FROM attendance a
                    JOIN TeacherStudents ts ON a.student_id = ts.student_id
                    GROUP BY a.student_id
                )
                SELECT 
                    u.full_name as student_name,
                    ROUND(CAST(g.avg_gpa AS NUMERIC), 2) as gpa,
                    ROUND(CAST(a.attendance_rate AS NUMERIC), 2) as attendance_rate
                FROM TeacherStudents ts
                JOIN users u ON ts.student_id = u.id
                JOIN StudentGPA g ON ts.student_id = g.student_id
                JOIN StudentAttendance a ON ts.student_id = a.student_id
            """
            )
            return [
                dict(row)
                for row in db.execute(
                    query,
                    {"teacher_id": user.id, "present_status": self._PRESENT_STATUS},
                )
                .mappings()
                .all()
            ]
        else:
            query = text(
                """
                WITH StudentGPA AS (
                    SELECT student_id, AVG(percentage) as avg_gpa
                    FROM grades
                    GROUP BY student_id
                ),
                StudentAttendance AS (
                    SELECT student_id,
                           CAST(SUM(CASE WHEN status = :present_status THEN 1 ELSE 0 END) AS FLOAT) /
                           NULLIF(COUNT(id), 0) * 100 as attendance_rate
                    FROM attendance
                    GROUP BY student_id
                )
                SELECT 
                    u.full_name as student_name,
                    ROUND(CAST(g.avg_gpa AS NUMERIC), 2) as gpa,
                    ROUND(CAST(a.attendance_rate AS NUMERIC), 2) as attendance_rate
                FROM users u
                JOIN StudentGPA g ON u.id = g.student_id
                JOIN StudentAttendance a ON u.id = a.student_id
                WHERE CAST(u.role AS TEXT) = :student_role
            """
            )
            return [
                dict(row)
                for row in db.execute(
                    query,
                    {
                        "present_status": self._PRESENT_STATUS,
                        "student_role": self._STUDENT_ROLE,
                    },
                )
                .mappings()
                .all()
            ]

    def get_declining_students(
        self, db: Session, user: Optional[User] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Students with declining recent performance.
        """
        if self._is_teacher(user):
            query = text(
                """
                WITH TeacherStudents AS (
                    SELECT DISTINCT e.student_id
                    FROM enrollments e
                    JOIN classes c ON e.class_id = c.id
                    WHERE c.teacher_id = :teacher_id AND e.is_active IS TRUE
                ),
                RankedGrades AS (
                    SELECT 
                        g.student_id,
                        g.percentage,
                        ROW_NUMBER() OVER (PARTITION BY g.student_id ORDER BY g.graded_at DESC) as rn
                    FROM grades g
                    JOIN TeacherStudents ts ON g.student_id = ts.student_id
                ),
                RecentGrades AS (
                    SELECT student_id, AVG(percentage) as recent_avg
                    FROM RankedGrades
                    WHERE rn <= 3
                    GROUP BY student_id
                ),
                OlderGrades AS (
                    SELECT student_id, AVG(percentage) as older_avg
                    FROM RankedGrades
                    WHERE rn > 3
                    GROUP BY student_id
                )
                SELECT 
                    u.id as student_id,
                    u.full_name as student_name,
                    u.department,
                    ROUND(CAST(r.recent_avg AS NUMERIC), 2) as recent_avg,
                    ROUND(CAST(o.older_avg AS NUMERIC), 2) as older_avg,
                    ROUND(CAST(o.older_avg - r.recent_avg AS NUMERIC), 2) as decline_amount
                FROM RecentGrades r
                JOIN OlderGrades o ON r.student_id = o.student_id
                JOIN users u ON r.student_id = u.id
                WHERE r.recent_avg < o.older_avg - 5
                ORDER BY decline_amount DESC
                LIMIT :limit
            """
            )
            return [
                dict(row)
                for row in db.execute(query, {"teacher_id": user.id, "limit": limit})
                .mappings()
                .all()
            ]
        else:
            query = text(
                """
                WITH RankedGrades AS (
                    SELECT 
                        student_id,
                        percentage,
                        ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY graded_at DESC) as rn
                    FROM grades
                ),
                RecentGrades AS (
                    SELECT student_id, AVG(percentage) as recent_avg
                    FROM RankedGrades
                    WHERE rn <= 3
                    GROUP BY student_id
                ),
                OlderGrades AS (
                    SELECT student_id, AVG(percentage) as older_avg
                    FROM RankedGrades
                    WHERE rn > 3
                    GROUP BY student_id
                )
                SELECT 
                    u.id as student_id,
                    u.full_name as student_name,
                    u.department,
                    ROUND(CAST(r.recent_avg AS NUMERIC), 2) as recent_avg,
                    ROUND(CAST(o.older_avg AS NUMERIC), 2) as older_avg,
                    ROUND(CAST(o.older_avg - r.recent_avg AS NUMERIC), 2) as decline_amount
                FROM RecentGrades r
                JOIN OlderGrades o ON r.student_id = o.student_id
                JOIN users u ON r.student_id = u.id
                WHERE r.recent_avg < o.older_avg - 5
                ORDER BY decline_amount DESC
                LIMIT :limit
            """
            )
            return [
                dict(row)
                for row in db.execute(query, {"limit": limit}).mappings().all()
            ]

    def get_intervention_priority(
        self, db: Session, user: Optional[User] = None, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Ranked priority list of students needing intervention.
        """
        if self._is_teacher(user):
            query = text(
                """
                WITH TeacherStudents AS (
                    SELECT DISTINCT e.student_id
                    FROM enrollments e
                    JOIN classes c ON e.class_id = c.id
                    WHERE c.teacher_id = :teacher_id AND e.is_active IS TRUE
                ),
                StudentMetrics AS (
                    SELECT 
                        ts.student_id,
                        AVG(g.percentage) as gpa,
                        CAST(SUM(CASE WHEN a.status = :present_status THEN 1 ELSE 0 END) AS FLOAT) /
                        NULLIF(COUNT(a.id), 0) * 100 as attendance
                    FROM TeacherStudents ts
                    LEFT JOIN grades g ON ts.student_id = g.student_id
                    LEFT JOIN attendance a ON ts.student_id = a.student_id
                    GROUP BY ts.student_id
                ),
                LatestRisk AS (
                    SELECT student_id, risk_score, risk_level
                    FROM risk_assessments
                    WHERE id IN (SELECT MAX(id) FROM risk_assessments GROUP BY student_id)
                )
                SELECT 
                    u.id as student_id,
                    u.full_name as student_name,
                    u.department,
                    ROUND(CAST(m.gpa AS NUMERIC), 2) as gpa,
                    ROUND(CAST(m.attendance AS NUMERIC), 2) as attendance,
                    COALESCE(r.risk_score, 0.5) as risk_score,
                    COALESCE(r.risk_level, 'medium') as risk_level,
                    CASE 
                        WHEN r.risk_level = 'critical' OR m.gpa < 60 THEN 'Immediate'
                        WHEN r.risk_level = 'high' OR m.gpa < 70 THEN 'Urgent'
                        WHEN r.risk_level = 'medium' OR m.attendance < 80 THEN 'Monitor'
                        ELSE 'Normal'
                    END as priority,
                    ROW_NUMBER() OVER (ORDER BY COALESCE(r.risk_score, 0.5) DESC, m.gpa ASC) as rank
                FROM StudentMetrics m
                JOIN users u ON m.student_id = u.id
                LEFT JOIN LatestRisk r ON m.student_id = r.student_id
                ORDER BY rank ASC
                LIMIT :limit
            """
            )
            return [
                dict(row)
                for row in db.execute(
                    query,
                    {
                        "teacher_id": user.id,
                        "limit": limit,
                        "present_status": self._PRESENT_STATUS,
                    },
                )
                .mappings()
                .all()
            ]
        else:
            query = text(
                """
                WITH StudentMetrics AS (
                    SELECT 
                        u.id as student_id,
                        AVG(g.percentage) as gpa,
                        CAST(SUM(CASE WHEN a.status = :present_status THEN 1 ELSE 0 END) AS FLOAT) /
                        NULLIF(COUNT(a.id), 0) * 100 as attendance
                    FROM users u
                    LEFT JOIN grades g ON u.id = g.student_id
                    LEFT JOIN attendance a ON u.id = a.student_id
                    WHERE CAST(u.role AS TEXT) = :student_role
                    GROUP BY u.id
                ),
                LatestRisk AS (
                    SELECT student_id, risk_score, risk_level
                    FROM risk_assessments
                    WHERE id IN (SELECT MAX(id) FROM risk_assessments GROUP BY student_id)
                )
                SELECT 
                    u.id as student_id,
                    u.full_name as student_name,
                    u.department,
                    ROUND(CAST(m.gpa AS NUMERIC), 2) as gpa,
                    ROUND(CAST(m.attendance AS NUMERIC), 2) as attendance,
                    COALESCE(r.risk_score, 0.5) as risk_score,
                    COALESCE(r.risk_level, 'medium') as risk_level,
                    CASE 
                        WHEN r.risk_level = 'critical' OR m.gpa < 60 THEN 'Immediate'
                        WHEN r.risk_level = 'high' OR m.gpa < 70 THEN 'Urgent'
                        WHEN r.risk_level = 'medium' OR m.attendance < 80 THEN 'Monitor'
                        ELSE 'Normal'
                    END as priority,
                    ROW_NUMBER() OVER (ORDER BY COALESCE(r.risk_score, 0.5) DESC, m.gpa ASC) as rank
                FROM StudentMetrics m
                JOIN users u ON m.student_id = u.id
                LEFT JOIN LatestRisk r ON m.student_id = r.student_id
                ORDER BY rank ASC
                LIMIT :limit
            """
            )
            return [
                dict(row)
                for row in db.execute(
                    query,
                    {
                        "limit": limit,
                        "present_status": self._PRESENT_STATUS,
                        "student_role": self._STUDENT_ROLE,
                    },
                )
                .mappings()
                .all()
            ]

    def get_at_risk_summary(
        self, db: Session, user: Optional[User] = None
    ) -> List[Dict[str, Any]]:
        return self.get_risk_distribution(db, user)

    def get_semester_trends(
        self, db: Session, user: Optional[User] = None
    ) -> List[Dict[str, Any]]:
        """
        Average GPA by semester.
        """
        if self._is_teacher(user):
            query = text(
                """
                SELECT 
                    c.semester,
                    AVG(g.percentage) as avg_score,
                    COUNT(DISTINCT g.student_id) as students_graded
                FROM classes c
                JOIN grades g ON c.id = g.class_id
                WHERE c.semester IS NOT NULL AND c.teacher_id = :teacher_id
                GROUP BY c.semester
                ORDER BY c.semester
            """
            )
            return [
                dict(row)
                for row in db.execute(query, {"teacher_id": user.id}).mappings().all()
            ]
        else:
            query = text(
                """
                SELECT 
                    c.semester,
                    AVG(g.percentage) as avg_score,
                    COUNT(DISTINCT g.student_id) as students_graded
                FROM classes c
                JOIN grades g ON c.id = g.class_id
                WHERE c.semester IS NOT NULL
                GROUP BY c.semester
                ORDER BY c.semester
            """
            )
            return [dict(row) for row in db.execute(query).mappings().all()]

    def get_risk_distribution(
        self, db: Session, user: Optional[User] = None
    ) -> List[Dict[str, Any]]:
        """
        Count of risk assessments by level.
        """
        if self._is_teacher(user):
            query = text(
                """
                WITH TeacherStudents AS (
                    SELECT DISTINCT e.student_id
                    FROM enrollments e
                    JOIN classes c ON e.class_id = c.id
                    WHERE c.teacher_id = :teacher_id AND e.is_active IS TRUE
                )
                SELECT 
                    ra.risk_level,
                    COUNT(*) as count
                FROM risk_assessments ra
                JOIN TeacherStudents ts ON ra.student_id = ts.student_id
                WHERE ra.risk_level IS NOT NULL
                GROUP BY ra.risk_level
            """
            )
            return [
                dict(row)
                for row in db.execute(query, {"teacher_id": user.id}).mappings().all()
            ]
        else:
            query = text(
                """
                SELECT 
                    risk_level,
                    COUNT(*) as count
                FROM risk_assessments
                WHERE risk_level IS NOT NULL
                GROUP BY risk_level
            """
            )
            return [dict(row) for row in db.execute(query).mappings().all()]


analytics_service = AnalyticsService()
