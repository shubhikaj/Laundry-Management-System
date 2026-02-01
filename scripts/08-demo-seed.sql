-- Demo seed data for presentation (uses your existing logins)
-- This script will insert example laundry_batches tied to existing users:
-- admin@college.edu, staff@college.edu, john.doe@student.college.edu
-- Idempotent: each INSERT uses a WHERE NOT EXISTS check by batch_number

-- NOTE: Run this in Supabase SQL editor. It will attempt to find the user id
-- by email in the `users` table; if your project uses `profiles` instead, the
-- script will try `profiles` as a fallback.

-- 1) Insert example laundry_batches for presentation (idempotent by batch_number)
DO $$
DECLARE
  student_uuid UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'laundry_batches') THEN

    -- Look up John's id from users, fallback to profiles
    SELECT id INTO student_uuid FROM users WHERE email = 'john.doe@student.college.edu' LIMIT 1;
    IF student_uuid IS NULL THEN
      SELECT id INTO student_uuid FROM profiles WHERE full_name = 'John Doe' OR id = (SELECT id FROM profiles WHERE id IN (SELECT id FROM profiles LIMIT 1) LIMIT 1) LIMIT 1;
    END IF;

    -- Only insert if John's id was found
    IF student_uuid IS NOT NULL THEN
      -- Dropped off by John (recently dropped)
      INSERT INTO laundry_batches (id, student_id, batch_number, status, scheduled_date, dropped_off_at, staff_notes)
      SELECT gen_random_uuid(), student_uuid, 'LB-DEMO-0001', 'dropped_off', current_date, now() - interval '1 hour', 'Dropped off by student John'
      WHERE NOT EXISTS (SELECT 1 FROM laundry_batches WHERE batch_number = 'LB-DEMO-0001');

      -- Washing
      INSERT INTO laundry_batches (id, student_id, batch_number, status, scheduled_date, dropped_off_at, staff_notes)
      SELECT gen_random_uuid(), student_uuid, 'LB-DEMO-0002', 'washing', current_date, now() - interval '3 hours', 'In washing cycle'
      WHERE NOT EXISTS (SELECT 1 FROM laundry_batches WHERE batch_number = 'LB-DEMO-0002');

      -- Ready for pickup (John)
      INSERT INTO laundry_batches (id, student_id, batch_number, status, scheduled_date, dropped_off_at, ready_at, staff_notes)
      SELECT gen_random_uuid(), student_uuid, 'LB-DEMO-0003', 'ready_for_pickup', current_date - interval '1 day', now() - interval '12 hours', now() - interval '2 hours', 'Ready and folded'
      WHERE NOT EXISTS (SELECT 1 FROM laundry_batches WHERE batch_number = 'LB-DEMO-0003');
    END IF;

    -- Find Jane if she exists (use student demo if not present)
    SELECT id INTO student_uuid FROM users WHERE email = 'jane.smith@student.college.edu' LIMIT 1;
    IF student_uuid IS NULL THEN
      SELECT id INTO student_uuid FROM profiles WHERE full_name = 'Jane Smith' LIMIT 1;
    END IF;

    IF student_uuid IS NOT NULL THEN
      -- Picked up (Jane)
      INSERT INTO laundry_batches (id, student_id, batch_number, status, scheduled_date, dropped_off_at, ready_at, picked_up_at, staff_notes)
      SELECT gen_random_uuid(), student_uuid, 'LB-DEMO-0004', 'picked_up', current_date - interval '3 days', now() - interval '3 days', now() - interval '2 days', now() - interval '1 day', 'Picked up by student Jane'
      WHERE NOT EXISTS (SELECT 1 FROM laundry_batches WHERE batch_number = 'LB-DEMO-0004');
    END IF;

  END IF;
END$$;

-- 2) Insert a sample activity log entry (if activity_logs exists) to show staff action
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
    INSERT INTO activity_logs (id, user_id, activity_type, description, metadata)
    SELECT gen_random_uuid(), (SELECT id FROM users WHERE email = 'staff@college.edu' LIMIT 1), 'status_change', 'Staff marked LB-DEMO-0003 as ready_for_pickup', jsonb_build_object('batch_number','LB-DEMO-0003')
    WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE description LIKE '%LB-DEMO-0003%');
  END IF;
END$$;

-- Quick verification selects (run these after executing the script):
-- SELECT id, email, full_name, role FROM users WHERE email IN ('admin@college.edu','staff@college.edu','john.doe@student.college.edu');
-- SELECT * FROM laundry_batches WHERE batch_number LIKE 'LB-DEMO-%' ORDER BY created_at DESC;

-- End of demo seed
