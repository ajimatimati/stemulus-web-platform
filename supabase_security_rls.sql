-- ==============================================================================
-- STEMulus Silicon Valley Row-Level Security (RLS) Policy for Supabase / PostgreSQL
-- Mitigates Prajwal Tomar's Vector #1: "Exposed Database Rows & Open RLS Tables"
-- ==============================================================================

-- 1. Enable RLS on every table (Never leave open tables)
ALTER TABLE IF EXISTS leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tutor_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedules ENABLE ROW LEVEL SECURITY;

-- 2. Public Intake Tables: Write-Only for anonymous visitors, Read/Manage for Admins only
DROP POLICY IF EXISTS "Public can submit leads" ON leads;
CREATE POLICY "Public can submit leads" ON leads
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Only admin can view leads" ON leads;
CREATE POLICY "Only admin can view leads" ON leads
    FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@stemuluskidstech.com');

DROP POLICY IF EXISTS "Public can submit enrollments" ON enrollments;
CREATE POLICY "Public can submit enrollments" ON enrollments
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Only admin can view enrollments" ON enrollments;
CREATE POLICY "Only admin can view enrollments" ON enrollments
    FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@stemuluskidstech.com');

DROP POLICY IF EXISTS "Public can submit tutor applications" ON tutor_applications;
CREATE POLICY "Public can submit tutor applications" ON tutor_applications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Only admin can view tutor applications" ON tutor_applications;
CREATE POLICY "Only admin can view tutor applications" ON tutor_applications
    FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@stemuluskidstech.com');

-- 3. Student Records (COPPA & FERPA): Strict Isolation
DROP POLICY IF EXISTS "Parents can view only their children" ON students;
CREATE POLICY "Parents can view only their children" ON students
    FOR SELECT USING (
        parent_email = auth.jwt() ->> 'email' OR
        auth.jwt() ->> 'email' = 'admin@stemuluskidstech.com'
    );

DROP POLICY IF EXISTS "Tutors can view assigned students" ON students;
CREATE POLICY "Tutors can view assigned students" ON students
    FOR SELECT USING (
        tutor_email = auth.jwt() ->> 'email' OR
        auth.jwt() ->> 'email' = 'admin@stemuluskidstech.com'
    );

DROP POLICY IF EXISTS "Only admin can modify students" ON students;
CREATE POLICY "Only admin can modify students" ON students
    FOR ALL USING (auth.jwt() ->> 'email' = 'admin@stemuluskidstech.com');

-- 4. Attendance Records: Tutors can insert, Admins manage all, Parents view own
DROP POLICY IF EXISTS "Tutors can insert attendance" ON attendance;
CREATE POLICY "Tutors can insert attendance" ON attendance
    FOR INSERT WITH CHECK (
        tutor_email = auth.jwt() ->> 'email' OR
        auth.jwt() ->> 'email' = 'admin@stemuluskidstech.com'
    );

DROP POLICY IF EXISTS "Parents view child attendance" ON attendance;
CREATE POLICY "Parents view child attendance" ON attendance
    FOR SELECT USING (
        parent_email = auth.jwt() ->> 'email' OR
        tutor_email = auth.jwt() ->> 'email' OR
        auth.jwt() ->> 'email' = 'admin@stemuluskidstech.com'
    );
