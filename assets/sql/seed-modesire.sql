-- ==============================================================
-- SQL Script to Seed Modesire Abdusalam Shittu's Certificate
-- ==============================================================
-- INSTRUCTIONS:
-- 1. Copy this script.
-- 2. Go to your Supabase Dashboard -> SQL Editor.
-- 3. Paste and click "Run".
-- ==============================================================

INSERT INTO public.certificates (
    credential_id, 
    student_name, 
    program_name, 
    issue_date, 
    grade_level,
    metadata
)
VALUES (
    'STEM-2026-M7A9', -- Default Credential ID (Change this to match your QR code if different)
    'Modesire Abdusalam Shittu',
    'Python Data App Academy: Building Web Apps with Streamlit', -- Recommended Program Name
    '2026-05-30', -- Issue Date (May 30, 2026)
    'Distinction',
    '{"course_description": "A comprehensive hands-on program covering core Python concepts, interactive web app development, and data visualization using the Streamlit framework for students aged 14-17."}'::jsonb
)
ON CONFLICT (credential_id) 
DO UPDATE SET 
    student_name = EXCLUDED.student_name,
    program_name = EXCLUDED.program_name,
    issue_date = EXCLUDED.issue_date,
    grade_level = EXCLUDED.grade_level,
    metadata = EXCLUDED.metadata;

-- Verify the row has been added
SELECT * FROM public.certificates WHERE student_name = 'Modesire Abdusalam Shittu';
