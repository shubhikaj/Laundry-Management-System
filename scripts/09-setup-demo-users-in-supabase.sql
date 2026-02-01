-- Setup Demo Users in Real Supabase
-- IMPORTANT: This script assumes you've already created the users in Supabase Auth
-- Follow the steps below before running this script

-- STEP 1: Create users in Supabase Dashboard first
-- Go to Authentication > Users > Add User
-- Create these users with their passwords:
-- 
-- 1. admin@college.edu
--    - Password: admin123
--    - Email: admin@college.edu
--    - Auto Confirm: Yes (for testing)
--
-- 2. staff@college.edu
--    - Password: staff123
--    - Email: staff@college.edu
--    - Auto Confirm: Yes (for testing)
--
-- 3. john.doe@student.college.edu
--    - Password: student123
--    - Email: john.doe@student.college.edu
--    - Auto Confirm: Yes (for testing)

-- STEP 2: After creating users, run this query to get their IDs:
-- SELECT id, email FROM auth.users WHERE email IN (
--   'admin@college.edu',
--   'staff@college.edu',
--   'john.doe@student.college.edu'
-- );

-- STEP 3: Update the INSERT statements below with the actual user IDs from STEP 2
-- Replace 'a5c5c043-1fed-4ce7-b3a7-6815eb2a9be5', '369df9c7-a9ae-47f4-b261-357d98951752', '4cc60d21-bb7a-46b2-a793-19e1b1b21c25'
-- with the actual UUIDs from the query above

-- Insert profiles for demo users
-- Make sure the profiles table exists and has proper structure

-- Admin Profile
INSERT INTO profiles (
    id,
    full_name,
    role,
    email_notifications,
    sms_notifications
)
VALUES (
    'YOUR-ADMIN-ID-HERE',  -- Replace with actual UUID from auth.users
    'System Administrator',
    'admin',
    true,
    false
)
ON CONFLICT (id) DO UPDATE
SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email_notifications = EXCLUDED.email_notifications,
    sms_notifications = EXCLUDED.sms_notifications;

-- Staff Profile
INSERT INTO profiles (
    id,
    full_name,
    role,
    email_notifications,
    sms_notifications
)
VALUES (
    'YOUR-STAFF-ID-HERE',  -- Replace with actual UUID from auth.users
    'Laundry Staff',
    'staff',
    true,
    false
)
ON CONFLICT (id) DO UPDATE
SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email_notifications = EXCLUDED.email_notifications,
    sms_notifications = EXCLUDED.sms_notifications;

-- Student Profile
INSERT INTO profiles (
    id,
    full_name,
    role,
    block,
    floor_number,
    room_number,
    email_notifications,
    sms_notifications
)
VALUES (
    'YOUR-STUDENT-ID-HERE',  -- Replace with actual UUID from auth.users
    'John Doe',
    'student',
    'A',
    1,
    '101',
    true,
    false
)
ON CONFLICT (id) DO UPDATE
SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    block = EXCLUDED.block,
    floor_number = EXCLUDED.floor_number,
    room_number = EXCLUDED.room_number,
    email_notifications = EXCLUDED.email_notifications,
    sms_notifications = EXCLUDED.sms_notifications;

-- Verify the profiles were created
SELECT 
    p.id,
    p.full_name,
    p.role,
    u.email,
    p.block,
    p.floor_number,
    p.room_number
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email IN (
    'admin@college.edu',
    'staff@college.edu',
    'john.doe@student.college.edu'
);
