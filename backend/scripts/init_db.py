#!/usr/bin/env python3
"""Initialize database with sample data for development/testing."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import engine, SessionLocal
from app.db.models import Base, User, UserRole, Class, Enrollment, Grade, Attendance, AuditLog
from app.schemas import AttendanceStatus
from app.core.security import get_password_hash
from datetime import datetime, date, timedelta
import random


def init_sample_data():
    db = SessionLocal()
    
    try:
        # Create tables
        Base.metadata.create_all(bind=engine)
        print("Tables created.")
        
        # Check if data already exists
        if db.query(User).first():
            print("Data already exists, skipping seed.")
            return
        
        # Create users
        print("Creating users...")
        
        # Admin
        admin = User(
            email="admin@university.edu",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. Rajesh Kumar",
            role=UserRole.ADMIN,
            department="Administration",
        )
        db.add(admin)
        
        # Teachers
        teachers = [
            User(
                email="priya.sharma@university.edu",
                hashed_password=get_password_hash("faculty123"),
                full_name="Dr. Priya Sharma",
                role=UserRole.TEACHER,
                department="Computer Science",
            ),
            User(
                email="sunita.reddy@university.edu",
                hashed_password=get_password_hash("faculty123"),
                full_name="Prof. Sunita Reddy",
                role=UserRole.TEACHER,
                department="Computer Science",
            ),
            User(
                email="arun.verma@university.edu",
                hashed_password=get_password_hash("faculty123"),
                full_name="Dr. Arun Verma",
                role=UserRole.TEACHER,
                department="Electronics",
            ),
        ]
        for t in teachers:
            db.add(t)
        
        # Students
        students = []
        cs_students = [
            ("CS2021001", "Rahul Sharma", "rahul.sharma@student.edu", "Computer Science", 3),
            ("CS2021002", "Priya Patel", "priya.patel@student.edu", "Computer Science", 3),
            ("CS2021003", "Arjun Desai", "arjun.desai@student.edu", "Computer Science", 3),
            ("CS2021004", "Ananya Singh", "ananya.singh@student.edu", "Computer Science", 3),
            ("CS2021005", "Vikram Rao", "vikram.rao@student.edu", "Computer Science", 3),
            ("CS2021006", "Neha Gupta", "neha.gupta@student.edu", "Computer Science", 3),
            ("CS2021007", "Karan Mehta", "karan.mehta@student.edu", "Computer Science", 3),
            ("CS2021008", "Sneha Iyer", "sneha.iyer@student.edu", "Computer Science", 3),
            ("CS2021009", "Kabir Khanna", "kabir.khanna@student.edu", "Computer Science", 3),
            ("CS2021010", "Isha Nair", "isha.nair@student.edu", "Computer Science", 3),
        ]
        
        ec_students = [
            ("EC2021001", "Rohan Kumar", "rohan.kumar@student.edu", "Electronics", 2),
            ("EC2021002", "Divya Joshi", "divya.joshi@student.edu", "Electronics", 2),
        ]
        
        cs5_students = [
            ("CS2020001", "Aditya Saxena", "aditya.saxena@student.edu", "Computer Science", 5),
            ("CS2020002", "Megha Pillai", "megha.pillai@student.edu", "Computer Science", 5),
            ("CS2020003", "Siddharth Malhotra", "siddharth.malhotra@student.edu", "Computer Science", 5),
        ]
        
        all_student_data = cs_students + ec_students + cs5_students
        
        for roll, name, email, dept, sem in all_student_data:
            s = User(
                email=email,
                hashed_password=get_password_hash("student123"),
                full_name=name,
                role=UserRole.STUDENT,
                department=dept,
                semester=sem,
            )
            db.add(s)
            students.append(s)
        
        db.commit()
        print(f"Created {len(students) + len(teachers) + 1} users.")
        
        # Create classes
        print("Creating classes...")
        
        cs_teacher = db.query(User).filter(User.email == "priya.sharma@university.edu").first()
        cs_teacher2 = db.query(User).filter(User.email == "sunita.reddy@university.edu").first()
        ec_teacher = db.query(User).filter(User.email == "arun.verma@university.edu").first()
        
        classes = [
            Class(code="CS301", name="Database Management Systems", department="Computer Science", semester=3, credits=4, teacher_id=cs_teacher.id),
            Class(code="CS302", name="Software Engineering", department="Computer Science", semester=3, credits=4, teacher_id=cs_teacher.id),
            Class(code="CS303", name="Computer Networks", department="Computer Science", semester=3, credits=3, teacher_id=cs_teacher2.id),
            Class(code="CS304", name="Operating Systems", department="Computer Science", semester=3, credits=4, teacher_id=cs_teacher2.id),
            Class(code="CS305", name="Machine Learning", department="Computer Science", semester=5, credits=3, teacher_id=cs_teacher.id),
            Class(code="EC201", name="Digital Electronics", department="Electronics", semester=2, credits=4, teacher_id=ec_teacher.id),
            Class(code="EC202", name="Signals and Systems", department="Electronics", semester=2, credits=3, teacher_id=ec_teacher.id),
        ]
        for c in classes:
            db.add(c)
        db.commit()
        print(f"Created {len(classes)} classes.")
        
        # Enroll students
        print("Creating enrollments...")
        cs_class_ids = [c.id for c in classes if c.department == "Computer Science" and c.semester == 3]
        cs5_class_ids = [c.id for c in classes if c.department == "Computer Science" and c.semester == 5]
        ec_class_ids = [c.id for c in classes if c.department == "Electronics"]
        
        cs_student_objs = db.query(User).filter(User.department == "Computer Science", User.semester == 3, User.role == UserRole.STUDENT).all()
        cs5_student_objs = db.query(User).filter(User.department == "Computer Science", User.semester == 5, User.role == UserRole.STUDENT).all()
        ec_student_objs = db.query(User).filter(User.department == "Electronics", User.role == UserRole.STUDENT).all()
        
        for student in cs_student_objs:
            for class_id in cs_class_ids:
                e = Enrollment(student_id=student.id, class_id=class_id)
                db.add(e)
        
        for student in cs5_student_objs:
            for class_id in cs5_class_ids:
                e = Enrollment(student_id=student.id, class_id=class_id)
                db.add(e)
        
        for student in ec_student_objs:
            for class_id in ec_class_ids:
                e = Enrollment(student_id=student.id, class_id=class_id)
                db.add(e)
        
        db.commit()
        print("Enrollments created.")
        
        # Create grades with trends
        print("Creating grades...")
        
        # Grade patterns for different student types
        # Good students: high grades, stable or improving
        # At-risk students: low grades, declining
        # Average students: medium grades, slight variation
        
        student_ids = [s.id for s in students]
        
        for student_id in student_ids:
            student = db.query(User).filter(User.id == student_id).first()
            enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id, Enrollment.is_active == True).all()
            
            for enrollment in enrollments:
                class_obj = db.query(Class).filter(Class.id == enrollment.class_id).first()
                
                # Determine student performance profile based on name (for demo)
                name = student.full_name.lower()
                
                if "priya" in name or "ananya" in name or "rohan" in name:
                    # At-risk: low grades, declining trend
                    base_score = random.uniform(45, 65)
                    trend = random.uniform(-3, -1)
                elif "rahul" in name or "vikram" in name or "aditya" in name or "megha" in name:
                    # Good: high grades, stable/improving
                    base_score = random.uniform(80, 95)
                    trend = random.uniform(-0.5, 1.5)
                else:
                    # Average
                    base_score = random.uniform(65, 80)
                    trend = random.uniform(-1, 1)
                
                # Create 8-12 assignments over the semester
                num_assignments = random.randint(8, 12)
                start_date = datetime(2024, 1, 15)
                
                for i in range(num_assignments):
                    # Score with trend
                    score_pct = base_score + trend * i + random.uniform(-5, 5)
                    score_pct = max(30, min(100, score_pct))  # Clamp
                    
                    max_score = 100
                    score = score_pct
                    weight = random.uniform(0.8, 1.2)
                    
                    grade = Grade(
                        student_id=student_id,
                        class_id=enrollment.class_id,
                        assignment_name=f"Assignment {i+1}",
                        score=score,
                        max_score=max_score,
                        percentage=score_pct,
                        weight=weight,
                        graded_at=start_date + timedelta(days=i*7 + random.randint(0, 3)),
                    )
                    db.add(grade)
        
        db.commit()
        print("Grades created.")
        
        # Create attendance
        print("Creating attendance...")
        
        for student_id in student_ids:
            student = db.query(User).filter(User.id == student_id).first()
            enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id, Enrollment.is_active == True).all()
            
            for enrollment in enrollments:
                class_obj = db.query(Class).filter(Class.id == enrollment.class_id).first()
                
                name = student.full_name.lower()
                
                if "priya" in name or "ananya" in name or "rohan" in name:
                    # At-risk: poor attendance, declining
                    base_attendance = 0.55
                    trend = -0.02
                elif "rahul" in name or "vikram" in name or "aditya" in name or "megha" in name:
                    # Good: excellent attendance
                    base_attendance = 0.95
                    trend = 0.005
                else:
                    # Average
                    base_attendance = 0.75
                    trend = random.uniform(-0.01, 0.01)
                
                # Create attendance for ~12 weeks, 2 sessions per week
                start_date = date(2024, 1, 15)
                session_num = 0
                
                for week in range(12):
                    for session in range(2):
                        session_date = start_date + timedelta(days=week*7 + session*3)
                        if session_date > date(2024, 4, 30):
                            break
                        
                        # Probability of attending
                        attend_prob = base_attendance + trend * week + random.uniform(-0.1, 0.1)
                        attend_prob = max(0.2, min(0.99, attend_prob))
                        
                        if random.random() < attend_prob:
                            status = random.choices(
                                [AttendanceStatus.PRESENT, AttendanceStatus.LATE],
                                weights=[0.85, 0.15]
                            )[0]
                        else:
                            status = random.choices(
                                [AttendanceStatus.ABSENT, AttendanceStatus.EXCUSED],
                                weights=[0.8, 0.2]
                            )[0]
                        
                        attendance = Attendance(
                            student_id=student_id,
                            class_id=enrollment.class_id,
                            date=datetime.combine(session_date, datetime.min.time()),
                            status=status,
                        )
                        db.add(attendance)
        
        db.commit()
        print("Attendance created.")
        
        print("\n✅ Sample data initialization complete!")
        print("\nLogin credentials:")
        print("  Admin: admin@university.edu / admin123")
        print("  Teacher: priya.sharma@university.edu / faculty123")
        print("  Student: rahul.sharma@student.edu / student123")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_sample_data()