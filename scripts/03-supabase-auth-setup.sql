-- Create profiles table for Supabase Auth integration
-- This table stores additional user information beyond what Supabase Auth provides

-- Create enum types (if not already created)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    block CHAR(1) CHECK (block IN ('A', 'B', 'C', 'D', 'E')),
    floor_number INTEGER,
    room_number VARCHAR(10),
    phone VARCHAR(15),
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_block_floor ON profiles(block, floor_number);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow insert during signup
CREATE POLICY "Allow insert during signup" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- For now, disable RLS to avoid recursion issues
-- We'll implement proper admin policies later
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- This function will be called by a trigger when a new user signs up
    -- The profile will be created by the application code instead
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup (optional - we're handling this in the app)
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 