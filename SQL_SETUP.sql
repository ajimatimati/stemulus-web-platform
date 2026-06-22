-- ==========================================
-- STEMulus Backend Setup Script
-- Run this in the Supabase SQL Editor
-- ==========================================

-- 1. Leads Table (For Newsletter & Popups)
CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  email text NOT NULL,
  name text,
  source text DEFAULT 'website',
  metadata jsonb
);

-- 2. Enrollments Table (For Enroll.html)
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  student_first_name text,
  student_last_name text,
  student_age integer,
  student_gender text,
  parent_name text,
  email text,
  phone text,
  program_interest text,
  experience_level text,
  referral_source text,
  status text DEFAULT 'pending', -- pending, contacted, enrolled
  payment_status text DEFAULT 'unpaid',
  children_data jsonb -- Stores full array if multiple children
);

-- 3. Messages Table (For Contact.html)
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  first_name text,
  last_name text,
  email text,
  subject text,
  message text,
  status text DEFAULT 'unread' -- unread, read, replied
);

-- ==========================================
-- Row Level Security (RLS) Policies
-- This allows the public to INSERT but NOT SELECT
-- ==========================================

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Public Insert (Anon Key)
CREATE POLICY "Public leads insert" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Public enrollments insert" ON enrollments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public messages insert" ON messages FOR INSERT WITH CHECK (true);

-- Policy: Allow Admin Select (Service Role Only)
-- This prevents random users from querying your database
CREATE POLICY "Admin select leads" ON leads FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Admin select enrollments" ON enrollments FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Admin select messages" ON messages FOR SELECT USING (auth.role() = 'service_role');

-- 4. Certificates Table (For QR Code Verification)
CREATE TABLE IF NOT EXISTS certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  credential_id text UNIQUE NOT NULL, -- e.g., STEM-2026-X8F3
  student_name text NOT NULL,
  program_name text NOT NULL,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  grade_level text DEFAULT 'Distinction', -- Distinction, Honors, Pass
  metadata jsonb DEFAULT '{}'::jsonb -- Stores hash, course description, etc.
);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Allow Public SELECT (Anyone scanning the QR code can verify)
CREATE POLICY "Allow public select certificates" ON certificates
  FOR SELECT USING (true);

-- Policy: Allow Authenticated Users (Admins) to manage certificates
CREATE POLICY "Allow admin manage certificates" ON certificates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Done!

