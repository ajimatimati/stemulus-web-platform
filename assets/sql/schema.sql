-- Supabase Database Schema for STEMulus

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Students Table
create table public.students (
    id uuid default uuid_generate_v4() primary key,
    studentId text, -- Optional custom ID like ST-2024-001
    name text not null,
    age integer,
    email text,
    phone text,
    parentName text,
    parentEmail text,
    parentPhone text,
    course text,
    status text default 'Active', -- Active, Inactive, Graduated
    notes text,
    gradeLevel text,
    courses jsonb default '[]'::jsonb, -- Array of course objects
    recentGrades jsonb default '[]'::jsonb, -- Array of grade objects
    badges jsonb default '[]'::jsonb, -- Array of badge objects
    createdAt timestamptz default now(),
    updatedAt timestamptz default now()
);

-- 2. Users Table (Linked to Auth)
-- Note: Trigger usually handles creation, but this is the table structure
create table public.users (
    id uuid references auth.users not null primary key,
    name text,
    email text,
    role text default 'parent', -- parent, admin, student
    linkedStudentIds text[] default array[]::text[],
    createdAt timestamptz default now()
);

-- 3. Leads Table (Lead Magnet)
create table public.leads (
    id uuid default uuid_generate_v4() primary key,
    name text,
    email text,
    phone text,
    childAge text,
    interest text,
    source text,
    domain text,
    timestamp timestamptz default now(),
    createdAt timestamptz default now()
);

-- 4. Projects (Portfolio)
create table public.projects (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    studentName text,
    description text,
    imageUrl text,
    projectUrl text,
    category text,
    date timestamptz default now(),
    featured boolean default false
);

-- 5. Enrollments (Social Proof)
create table public.enrollments (
    id uuid default uuid_generate_v4() primary key,
    student_name text,
    location text,
    course_name text,
    created_at timestamptz default now()
);

-- 6. Content/Announcements (Cloud Sync)
create table public.content (
    id uuid default uuid_generate_v4() primary key,
    title text,
    body text,
    type text, -- blog, announcement
    timestamp timestamptz default now()
);

-- Row Level Security (RLS) - Basic Policies
alter table public.students enable row level security;
alter table public.users enable row level security;
alter table public.leads enable row level security;
alter table public.projects enable row level security;
alter table public.enrollments enable row level security;
alter table public.content enable row level security;

-- Allow read access to public data (adjust as needed)
create policy "Public projects are viewable by everyone" on public.projects for select using (true);
create policy "Social proof is viewable by everyone" on public.enrollments for select using (true);

-- Allow authenticated users to view their data (simplified)
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);

-- Admin access would require a custom claim or role check
-- For now, allowing all authenticated to READ students (Refine this for production!)
create policy "Auth users can view students" on public.students for select to authenticated using (true);

