-- =========================================================
-- Supabase SQL Schema for Quest & Points Tracker
-- Run this script in the Supabase SQL Editor:
-- Dashboard -> Your Project -> SQL Editor -> New query -> Run
-- =========================================================

-- 1. Create 'gmails' table
CREATE TABLE IF NOT EXISTS public.gmails (
    id TEXT PRIMARY KEY,
    gmail TEXT NOT NULL,
    encrypted_password TEXT NOT NULL DEFAULT '',
    card_added BOOLEAN NOT NULL DEFAULT FALSE,
    points_added BOOLEAN NOT NULL DEFAULT FALSE,
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create 'tasks' table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    gmail_id TEXT REFERENCES public.gmails(id) ON DELETE CASCADE,
    gmail_address TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    quest_type TEXT NOT NULL DEFAULT 'none',
    game_name TEXT DEFAULT '',
    points NUMERIC NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS idx_tasks_date ON public.tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_gmail_id ON public.tasks(gmail_id);
CREATE INDEX IF NOT EXISTS idx_gmails_is_selected ON public.gmails(is_selected);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.gmails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they already exist (idempotent setup)
DROP POLICY IF EXISTS "Allow anon public all on gmails" ON public.gmails;
DROP POLICY IF EXISTS "Allow anon public all on tasks" ON public.tasks;

-- 6. Create permissive RLS policies for web app access
CREATE POLICY "Allow anon public all on gmails" 
ON public.gmails 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow anon public all on tasks" 
ON public.tasks 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- 7. Enable Realtime Sync for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.gmails;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
