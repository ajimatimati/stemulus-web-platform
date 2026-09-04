-- ==============================================================
-- SQL Script to Seed Modesire Abdusalam Shittu's STEMulus ID & Certificate
-- ==============================================================
-- INSTRUCTIONS:
-- 1. Copy this script.
-- 2. Go to your Supabase / PostgreSQL Dashboard -> SQL Editor.
-- 3. Paste and click "Run".
-- ==============================================================

-- 1. Seed Certificate / Credential Entry
INSERT INTO public.certificates (
    credential_id, 
    student_name, 
    program_name, 
    issue_date, 
    grade_level,
    metadata
)
VALUES (
    'STEM-2025-QWHF', -- Official Certificate Credential ID (Registered 2025)
    'Modesire Abdusalam Shittu',
    'Python Data App Academy: Building Web Apps with Streamlit',
    '2025-12-15', -- Issue Date (2025)
    'Distinction',
    '{"student_id": "std-1003", "stemulus_id": "STEM-2025-MS03", "registration_year": 2025, "course_description": "A comprehensive hands-on program covering core Python concepts, interactive web app development, and data visualization using the Streamlit framework for students aged 14-17."}'::jsonb
)
ON CONFLICT (credential_id) 
DO UPDATE SET 
    student_name = EXCLUDED.student_name,
    program_name = EXCLUDED.program_name,
    issue_date = EXCLUDED.issue_date,
    grade_level = EXCLUDED.grade_level,
    metadata = EXCLUDED.metadata;

-- Verify the certificate row
SELECT * FROM public.certificates WHERE student_name = 'Modesire Abdusalam Shittu';


