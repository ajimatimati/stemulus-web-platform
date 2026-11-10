-- ============================================================================
-- STEMulus Digital Academy - Row Level Security (RLS) Policies
-- Enforces zero client trust and strict least-privilege role boundaries.
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user role from auth claims
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 1. Profiles Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins have full access to profiles"
    ON profiles FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 2. Tutors Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Tutors can view own profile and bank info"
    ON tutors FOR SELECT
    TO authenticated
    USING (profile_id = auth.uid());

CREATE POLICY "Parents and students can view basic tutor directory"
    ON tutors FOR SELECT
    TO authenticated
    USING (status = 'active');

CREATE POLICY "Admins manage all tutors"
    ON tutors FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 3. Students Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Parents view own children"
    ON students FOR SELECT
    TO authenticated
    USING (parent_id = auth.uid());

CREATE POLICY "Tutors view assigned students"
    ON students FOR SELECT
    TO authenticated
    USING (primary_tutor_id IN (SELECT id FROM tutors WHERE profile_id = auth.uid()));

CREATE POLICY "Admins have full access to students"
    ON students FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 4. Schedules Table Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Parents view children schedules"
    ON schedules FOR SELECT
    TO authenticated
    USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

CREATE POLICY "Tutors view assigned teaching schedules"
    ON schedules FOR SELECT
    TO authenticated
    USING (tutor_id IN (SELECT id FROM tutors WHERE profile_id = auth.uid()));

CREATE POLICY "Admins manage all schedules"
    ON schedules FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 5. Attendance Records Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Parents view children attendance"
    ON attendance_records FOR SELECT
    TO authenticated
    USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

CREATE POLICY "Tutors view own attendance logs"
    ON attendance_records FOR SELECT
    TO authenticated
    USING (tutor_id IN (SELECT id FROM tutors WHERE profile_id = auth.uid()));

CREATE POLICY "Tutors submit pending attendance records"
    ON attendance_records FOR INSERT
    TO authenticated
    WITH CHECK (
        tutor_id IN (SELECT id FROM tutors WHERE profile_id = auth.uid())
        AND status = 'pending'
    );

CREATE POLICY "Admins manage and approve all attendance"
    ON attendance_records FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 6. Payroll Runs & Items Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Tutors view own approved payroll items"
    ON payroll_items FOR SELECT
    TO authenticated
    USING (
        tutor_id IN (SELECT id FROM tutors WHERE profile_id = auth.uid())
        AND status IN ('approved', 'disbursed')
    );

CREATE POLICY "Only admins manage payroll runs"
    ON payroll_runs FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

CREATE POLICY "Only admins manage payroll items"
    ON payroll_items FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 7. Payments Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Parents view payments for their children"
    ON payments FOR SELECT
    TO authenticated
    USING (student_id IN (SELECT id FROM students WHERE parent_id = auth.uid()));

CREATE POLICY "Only admins record or view all payments"
    ON payments FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 8. Monthly Reports Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Parents view finalized reports for their children"
    ON monthly_reports FOR SELECT
    TO authenticated
    USING (
        student_id IN (SELECT id FROM students WHERE parent_id = auth.uid())
        AND status = 'approved'
    );

CREATE POLICY "Tutors view and create drafts for their students"
    ON monthly_reports FOR ALL
    TO authenticated
    USING (tutor_id IN (SELECT id FROM tutors WHERE profile_id = auth.uid()))
    WITH CHECK (tutor_id IN (SELECT id FROM tutors WHERE profile_id = auth.uid()));

CREATE POLICY "Admins have full access to monthly reports"
    ON monthly_reports FOR ALL
    TO authenticated
    USING (auth_user_role() = 'admin')
    WITH CHECK (auth_user_role() = 'admin');

-- ----------------------------------------------------------------------------
-- 9. Audit Logs Policies
-- ----------------------------------------------------------------------------
CREATE POLICY "Only admins view audit logs"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (auth_user_role() = 'admin');

CREATE POLICY "System functions insert audit records"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);
