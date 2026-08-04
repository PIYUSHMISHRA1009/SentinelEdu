-- ========================================
-- InsightFlow EDU - PL/SQL Procedures and Functions
-- Business Logic for Risk Detection and Sentiment Analysis
-- ========================================

-- ========================================
-- PROCEDURE: run_risk_engine
-- Identifies students at risk based on GPA and attendance thresholds
-- ========================================
CREATE OR REPLACE PROCEDURE run_risk_engine(
    p_gpa_threshold IN NUMBER,
    p_att_threshold IN NUMBER
) AS
    v_count NUMBER := 0;
BEGIN
    -- Clear existing risk flags
    DELETE FROM risk_flags;
    
    -- Insert new risk flags for students below thresholds
    INSERT INTO risk_flags (flag_id, student_id, reason, avg_gpa, avg_attendance, flagged_on)
    SELECT 
        risk_flag_seq.NEXTVAL,
        s.student_id,
        CASE 
            WHEN avg_gpa < p_gpa_threshold AND avg_att < p_att_threshold THEN 
                'Low GPA (' || ROUND(avg_gpa, 2) || ') and Low Attendance (' || ROUND(avg_att, 2) || '%)'
            WHEN avg_gpa < p_gpa_threshold THEN 
                'Low GPA (' || ROUND(avg_gpa, 2) || ')'
            WHEN avg_att < p_att_threshold THEN 
                'Low Attendance (' || ROUND(avg_att, 2) || '%)'
        END as reason,
        avg_gpa,
        avg_att,
        CURRENT_TIMESTAMP
    FROM (
        SELECT 
            s.student_id,
            NVL(AVG(e.gpa), 0) as avg_gpa,
            NVL(AVG(a.percentage), 0) as avg_att
        FROM students s
        LEFT JOIN enrollments e ON s.student_id = e.student_id
        LEFT JOIN attendance a ON s.student_id = a.student_id
        GROUP BY s.student_id
    ) s
    WHERE avg_gpa < p_gpa_threshold OR avg_att < p_att_threshold;
    
    v_count := SQL%ROWCOUNT;
    
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('Risk detection complete. Flagged ' || v_count || ' students.');
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'Error in run_risk_engine: ' || SQLERRM);
END run_risk_engine;
/

-- ========================================
-- FUNCTION: classify_sentiment
-- Performs basic sentiment analysis on feedback text
-- ========================================
CREATE OR REPLACE FUNCTION classify_sentiment(
    p_feedback_text IN VARCHAR2
) RETURN VARCHAR2 AS
    v_text VARCHAR2(4000);
    v_positive_count NUMBER := 0;
    v_negative_count NUMBER := 0;
    
    TYPE word_array IS TABLE OF VARCHAR2(50);
    v_positive_words word_array := word_array(
        'excellent', 'great', 'good', 'outstanding', 'brilliant', 
        'wonderful', 'amazing', 'fantastic', 'impressive', 'strong',
        'improved', 'progress', 'dedicated', 'talented', 'exceptional',
        'superior', 'remarkable', 'commendable', 'satisfactory', 'positive'
    );
    
    v_negative_words word_array := word_array(
        'poor', 'bad', 'terrible', 'weak', 'struggling', 
        'failing', 'inadequate', 'disappointing', 'concern', 
        'problem', 'issue', 'difficulty', 'absent', 'lacking',
        'unsatisfactory', 'problematic', 'deficient', 'inferior'
    );
BEGIN
    -- Convert to lowercase for case-insensitive matching
    v_text := LOWER(p_feedback_text);
    
    -- Count positive words
    FOR i IN 1..v_positive_words.COUNT LOOP
        IF INSTR(v_text, v_positive_words(i)) > 0 THEN
            v_positive_count := v_positive_count + 1;
        END IF;
    END LOOP;
    
    -- Count negative words
    FOR i IN 1..v_negative_words.COUNT LOOP
        IF INSTR(v_text, v_negative_words(i)) > 0 THEN
            v_negative_count := v_negative_count + 1;
        END IF;
    END LOOP;
    
    -- Determine sentiment based on word counts
    IF v_positive_count > v_negative_count THEN
        RETURN 'positive';
    ELSIF v_negative_count > v_positive_count THEN
        RETURN 'negative';
    ELSE
        RETURN 'neutral';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'neutral';
END classify_sentiment;
/

-- ========================================
-- PROCEDURE: log_intervention
-- Creates an intervention record with validation
-- ========================================
CREATE OR REPLACE PROCEDURE log_intervention(
    p_student_id IN NUMBER,
    p_faculty_id IN NUMBER,
    p_intervention_type IN VARCHAR2,
    p_notes IN CLOB,
    p_intervention_id OUT NUMBER
) AS
BEGIN
    -- Validate student exists
    DECLARE
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM students WHERE student_id = p_student_id;
        IF v_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20002, 'Student not found');
        END IF;
    END;
    
    -- Validate faculty exists
    DECLARE
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM faculty WHERE faculty_id = p_faculty_id;
        IF v_count = 0 THEN
            RAISE_APPLICATION_ERROR(-20003, 'Faculty not found');
        END IF;
    END;
    
    -- Insert intervention
    INSERT INTO interventions (
        intervention_id, student_id, faculty_id, intervention_type, notes, status, created_on
    ) VALUES (
        intervention_seq.NEXTVAL, p_student_id, p_faculty_id, p_intervention_type, 
        p_notes, 'pending', CURRENT_TIMESTAMP
    ) RETURNING intervention_id INTO p_intervention_id;
    
    COMMIT;
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20004, 'Error creating intervention: ' || SQLERRM);
END log_intervention;
/

-- ========================================
-- FUNCTION: get_student_analytics
-- Returns comprehensive analytics for a student
-- ========================================
CREATE OR REPLACE FUNCTION get_student_analytics(
    p_student_id IN NUMBER
) RETURN SYS_REFCURSOR AS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT 
            s.student_id,
            s.name,
            s.roll_number,
            s.department,
            s.semester,
            NVL(ROUND(AVG(e.gpa), 2), 0) as avg_gpa,
            NVL(ROUND(AVG(a.percentage), 2), 0) as avg_attendance,
            COUNT(DISTINCT e.course_id) as courses_enrolled,
            COUNT(DISTINCT i.intervention_id) as interventions_count,
            COUNT(DISTINCT rf.flag_id) as risk_flags_count
        FROM students s
        LEFT JOIN enrollments e ON s.student_id = e.student_id
        LEFT JOIN attendance a ON s.student_id = a.student_id
        LEFT JOIN interventions i ON s.student_id = i.student_id
        LEFT JOIN risk_flags rf ON s.student_id = rf.student_id
        WHERE s.student_id = p_student_id
        GROUP BY s.student_id, s.name, s.roll_number, s.department, s.semester;
    
    RETURN v_cursor;
END get_student_analytics;
/

-- ========================================
-- TRIGGER: auto_calculate_attendance_percentage
-- Automatically calculates attendance percentage on insert/update
-- ========================================
CREATE OR REPLACE TRIGGER trg_calc_attendance_pct
BEFORE INSERT OR UPDATE ON attendance
FOR EACH ROW
BEGIN
    IF :NEW.classes_held > 0 THEN
        :NEW.percentage := ROUND((:NEW.classes_attended / :NEW.classes_held) * 100, 2);
    ELSE
        :NEW.percentage := 0;
    END IF;
END;
/

-- ========================================
-- TRIGGER: validate_gpa_range
-- Ensures GPA is within valid range
-- ========================================
CREATE OR REPLACE TRIGGER trg_validate_gpa
BEFORE INSERT OR UPDATE ON enrollments
FOR EACH ROW
BEGIN
    IF :NEW.gpa IS NOT NULL AND (:NEW.gpa < 0 OR :NEW.gpa > 4.0) THEN
        RAISE_APPLICATION_ERROR(-20005, 'GPA must be between 0 and 4.0');
    END IF;
END;
/

-- Grant execute permissions
GRANT EXECUTE ON run_risk_engine TO INSIGHTFLOW;
GRANT EXECUTE ON classify_sentiment TO INSIGHTFLOW;
GRANT EXECUTE ON log_intervention TO INSIGHTFLOW;
GRANT EXECUTE ON get_student_analytics TO INSIGHTFLOW;

COMMIT;
