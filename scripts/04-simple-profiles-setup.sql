-- Simple profiles table setup for Supabase Auth integration
-- This avoids the infinite recursion issue with RLS policies

-- Create enum types (if not already created)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing profiles table if it exists
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
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
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_block_floor ON profiles(block, floor_number);

-- For now, we'll handle security at the application level
-- RLS can be enabled later with proper policies 