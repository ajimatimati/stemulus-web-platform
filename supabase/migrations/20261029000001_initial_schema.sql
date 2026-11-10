-- ============================================================================
-- STEMulus Digital Academy - PostgreSQL Database Migration
-- Initial Relational Schema Definition
-- ============================================================================

-- 1. Custom Types & Enumerations
CREATE TYPE user_role AS ENUM ('admin', 'tutor', 'parent');
CREATE TYPE session_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE payroll_status AS ENUM ('draft', 'approved', 'disbursed', 'cancelled');
CREATE TYPE billing_status AS ENUM ('active', 'due', 'overdue', 'paused');

-- 2. User Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'parent',
    phone TEXT,
    country TEXT DEFAULT 'Nigeria',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tutors Directory & Compensation
CREATE TABLE IF NOT EXISTS tutors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    hourly_rate_kobo BIGINT NOT NULL DEFAULT 500000, -- ₦5,000.00 / hr
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    subjects TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Students Directory
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    primary_tutor_id UUID REFERENCES tutors(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birthday DATE,
    program TEXT NOT NULL,
    track TEXT,
    status TEXT DEFAULT 'active',
    tuition_rate_kobo BIGINT NOT NULL DEFAULT 4500000, -- ₦45,000.00 / cycle
    next_due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Weekly Recurring Class Schedules
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_schedule_time CHECK (start_time < end_time)
);

-- 6. Lesson Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    duration_minutes SMALLINT NOT NULL DEFAULT 60 CHECK (duration_minutes > 0 AND duration_minutes <= 180),
    topic TEXT,
    notes TEXT,
    status session_status DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tutor_student_session UNIQUE (tutor_id, student_id, session_date)
);

-- 7. Monthly Payroll Batches
CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_month SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year SMALLINT NOT NULL CHECK (period_year >= 2025),
    status payroll_status DEFAULT 'draft',
    total_disbursed_kobo BIGINT DEFAULT 0,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_payroll_period UNIQUE (period_month, period_year)
);

-- 8. Granular Tutor Payroll Items
CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE RESTRICT,
    approved_hours NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (approved_hours >= 0),
    hourly_rate_kobo BIGINT NOT NULL CHECK (hourly_rate_kobo >= 0),
    gross_pay_kobo BIGINT NOT NULL CHECK (gross_pay_kobo >= 0),
    deductions_kobo BIGINT NOT NULL DEFAULT 0 CHECK (deductions_kobo >= 0),
    net_pay_kobo BIGINT NOT NULL,
    payment_ref TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_net_pay CHECK (net_pay_kobo >= 0),
    CONSTRAINT uq_run_tutor UNIQUE (payroll_run_id, tutor_id)
);

-- 9. Tuition Payments & Receipts
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount_kobo BIGINT NOT NULL CHECK (amount_kobo > 0),
    currency TEXT DEFAULT 'NGN',
    payment_method TEXT NOT NULL,
    external_reference TEXT UNIQUE NOT NULL,
    notes TEXT,
    verified_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Student Monthly Evaluations
CREATE TABLE IF NOT EXISTS monthly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    period_month SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year SMALLINT NOT NULL CHECK (period_year >= 2025),
    attendance_score SMALLINT CHECK (attendance_score BETWEEN 0 AND 100),
    technical_growth SMALLINT CHECK (technical_growth BETWEEN 0 AND 100),
    comprehension_score SMALLINT CHECK (comprehension_score BETWEEN 0 AND 100),
    curriculum_milestone TEXT,
    tutor_remarks TEXT,
    status TEXT DEFAULT 'draft',
    endorsed_by UUID REFERENCES profiles(id),
    endorsed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_monthly_report UNIQUE (student_id, period_month, period_year)
);

-- 11. Immutable Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id TEXT NOT NULL,
    state_before JSONB,
    state_after JSONB,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for High-Velocity Queries
CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_tutor ON students(primary_tutor_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tutor ON attendance_records(tutor_id, session_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_schedules_tutor ON schedules(tutor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_student ON schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_table, target_id);
