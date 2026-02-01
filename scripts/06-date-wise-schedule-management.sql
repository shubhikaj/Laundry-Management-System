-- Enhanced Date-wise Laundry Schedule Management System
-- This allows admins to set specific dates for laundry schedules

-- Create date-specific schedules table
CREATE TABLE IF NOT EXISTS date_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block CHAR(1) NOT NULL CHECK (block IN ('A', 'B', 'C', 'D', 'E')),
    floor_number INTEGER NOT NULL CHECK (floor_number BETWEEN 1 AND 10),
    schedule_date DATE NOT NULL,
    pickup_time TIME NOT NULL DEFAULT '18:00:00',
    dropoff_start_time TIME NOT NULL DEFAULT '08:00:00',
    dropoff_end_time TIME NOT NULL DEFAULT '10:00:00',
    is_active BOOLEAN DEFAULT true,
    max_batches_per_day INTEGER DEFAULT 50,
    is_holiday BOOLEAN DEFAULT false,
    holiday_name VARCHAR(255),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(block, floor_number, schedule_date)
);

-- Create recurring schedule patterns
CREATE TABLE IF NOT EXISTS recurring_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    pattern_type VARCHAR(20) NOT NULL CHECK (pattern_type IN ('weekly', 'biweekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 1 = Monday, etc.
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    week_of_month INTEGER CHECK (week_of_month BETWEEN 1 AND 4),
    pickup_time TIME NOT NULL DEFAULT '18:00:00',
    dropoff_start_time TIME NOT NULL DEFAULT '08:00:00',
    dropoff_end_time TIME NOT NULL DEFAULT '10:00:00',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recurring schedule assignments
CREATE TABLE IF NOT EXISTS recurring_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_id UUID REFERENCES recurring_patterns(id) ON DELETE CASCADE,
    block CHAR(1) NOT NULL CHECK (block IN ('A', 'B', 'C', 'D', 'E')),
    floor_number INTEGER NOT NULL CHECK (floor_number BETWEEN 1 AND 10),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pattern_id, block, floor_number)
);

-- Create schedule conflicts table
CREATE TABLE IF NOT EXISTS schedule_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES date_schedules(id) ON DELETE CASCADE,
    conflict_type VARCHAR(50) NOT NULL,
    conflict_reason TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_date_schedules_date ON date_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_date_schedules_block_floor ON date_schedules(block, floor_number);
CREATE INDEX IF NOT EXISTS idx_date_schedules_active ON date_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_date_schedules_holiday ON date_schedules(is_holiday);
CREATE INDEX IF NOT EXISTS idx_recurring_patterns_type ON recurring_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_recurring_assignments_block_floor ON recurring_assignments(block, floor_number);
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_resolved ON schedule_conflicts(resolved);

-- Create function to generate recurring schedules
CREATE OR REPLACE FUNCTION generate_recurring_schedules(
    p_start_date DATE,
    p_end_date DATE DEFAULT NULL
) RETURNS void AS $$
DECLARE
    assignment_record RECORD;
    pattern_record RECORD;
    current_date DATE;
    target_date DATE;
    week_count INTEGER;
    month_count INTEGER;
BEGIN
    -- Set default end date to 3 months from start if not provided
    IF p_end_date IS NULL THEN
        p_end_date := p_start_date + INTERVAL '3 months';
    END IF;
    
    -- Loop through all active recurring assignments
    FOR assignment_record IN 
        SELECT ra.*, rp.* 
        FROM recurring_assignments ra
        JOIN recurring_patterns rp ON ra.pattern_id = rp.id
        WHERE ra.is_active = true AND rp.is_active = true
        AND (ra.end_date IS NULL OR ra.end_date >= p_start_date)
        AND ra.start_date <= p_end_date
    LOOP
        current_date := GREATEST(p_start_date, assignment_record.start_date);
        
        WHILE current_date <= LEAST(p_end_date, COALESCE(assignment_record.end_date, p_end_date)) LOOP
            target_date := NULL;
            
            -- Generate date based on pattern type
            CASE assignment_record.pattern_type
                WHEN 'weekly' THEN
                    -- Weekly pattern: same day of week
                    IF EXTRACT(DOW FROM current_date) = assignment_record.day_of_week THEN
                        target_date := current_date;
                    END IF;
                    
                WHEN 'biweekly' THEN
                    -- Biweekly pattern: every other week on same day
                    IF EXTRACT(DOW FROM current_date) = assignment_record.day_of_week THEN
                        week_count := EXTRACT(WEEK FROM current_date) - EXTRACT(WEEK FROM assignment_record.start_date);
                        IF week_count % 2 = 0 THEN
                            target_date := current_date;
                        END IF;
                    END IF;
                    
                WHEN 'monthly' THEN
                    -- Monthly pattern: specific day of month or week of month
                    IF assignment_record.day_of_month IS NOT NULL THEN
                        -- Specific day of month
                        IF EXTRACT(DAY FROM current_date) = assignment_record.day_of_month THEN
                            target_date := current_date;
                        END IF;
                    ELSIF assignment_record.day_of_week IS NOT NULL AND assignment_record.week_of_month IS NOT NULL THEN
                        -- Specific week of month (e.g., first Monday of month)
                        IF EXTRACT(DOW FROM current_date) = assignment_record.day_of_week THEN
                            month_count := EXTRACT(DAY FROM current_date) / 7;
                            IF month_count + 1 = assignment_record.week_of_month THEN
                                target_date := current_date;
                            END IF;
                        END IF;
                    END IF;
            END CASE;
            
            -- Insert schedule if target date is found and doesn't already exist
            IF target_date IS NOT NULL THEN
                INSERT INTO date_schedules (
                    block, floor_number, schedule_date, 
                    pickup_time, dropoff_start_time, dropoff_end_time,
                    max_batches_per_day, created_by
                ) VALUES (
                    assignment_record.block, 
                    assignment_record.floor_number, 
                    target_date,
                    assignment_record.pickup_time,
                    assignment_record.dropoff_start_time,
                    assignment_record.dropoff_end_time,
                    50, -- Default max batches
                    assignment_record.created_by
                ) ON CONFLICT (block, floor_number, schedule_date) DO NOTHING;
            END IF;
            
            current_date := current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Generated recurring schedules from % to %', p_start_date, p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to check for schedule conflicts
CREATE OR REPLACE FUNCTION check_schedule_conflicts(
    p_block CHAR(1),
    p_floor INTEGER,
    p_date DATE,
    p_exclude_id UUID DEFAULT NULL
) RETURNS TABLE(conflict_type VARCHAR, conflict_reason TEXT) AS $$
BEGIN
    -- Check for overlapping schedules
    RETURN QUERY
    SELECT 
        'overlap'::VARCHAR,
        'Schedule already exists for this block, floor, and date'::TEXT
    FROM date_schedules ds
    WHERE ds.block = p_block 
    AND ds.floor_number = p_floor 
    AND ds.schedule_date = p_date
    AND (p_exclude_id IS NULL OR ds.id != p_exclude_id);
    
    -- Check for holiday conflicts
    RETURN QUERY
    SELECT 
        'holiday'::VARCHAR,
        'Date falls on a holiday: ' || ds.holiday_name::TEXT
    FROM date_schedules ds
    WHERE ds.block = p_block 
    AND ds.floor_number = p_floor 
    AND ds.schedule_date = p_date
    AND ds.is_holiday = true
    AND (p_exclude_id IS NULL OR ds.id != p_exclude_id);
    
    -- Check for weekend schedules (if needed)
    IF EXTRACT(DOW FROM p_date) IN (0, 6) THEN -- Sunday or Saturday
        RETURN QUERY
        SELECT 
            'weekend'::VARCHAR,
            'Schedule is set for weekend'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for calendar overview
CREATE OR REPLACE VIEW calendar_overview AS
SELECT 
    ds.schedule_date,
    ds.block,
    ds.floor_number,
    ds.pickup_time,
    ds.dropoff_start_time,
    ds.dropoff_end_time,
    ds.is_active,
    ds.is_holiday,
    ds.holiday_name,
    ds.max_batches_per_day,
    ds.notes,
    u.full_name as created_by_name,
    ds.created_at,
    CASE 
        WHEN ds.is_holiday THEN 'Holiday'
        WHEN EXTRACT(DOW FROM ds.schedule_date) IN (0, 6) THEN 'Weekend'
        ELSE 'Regular'
    END as schedule_type
FROM date_schedules ds
LEFT JOIN profiles u ON ds.created_by = u.id
ORDER BY ds.schedule_date DESC, ds.block, ds.floor_number

-- Create view for upcoming schedules
CREATE OR REPLACE VIEW upcoming_schedules AS
SELECT 
    ds.schedule_date,
    ds.block,
    ds.floor_number,
    ds.pickup_time,
    ds.dropoff_start_time,
    ds.dropoff_end_time,
    ds.is_active,
    ds.is_holiday,
    ds.holiday_name,
    ds.max_batches_per_day,
    ds.notes,
    EXTRACT(DOW FROM ds.schedule_date) as day_of_week,
    TO_CHAR(ds.schedule_date, 'Day') as day_name,
    CASE 
        WHEN ds.schedule_date = CURRENT_DATE THEN 'Today'
        WHEN ds.schedule_date = CURRENT_DATE + INTERVAL '1 day' THEN 'Tomorrow'
        WHEN ds.schedule_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'This Week'
        WHEN ds.schedule_date BETWEEN CURRENT_DATE + INTERVAL '8 days' AND CURRENT_DATE + INTERVAL '30 days' THEN 'Next Month'
        ELSE 'Future'
    END as time_category
FROM date_schedules ds
WHERE ds.schedule_date >= CURRENT_DATE
AND ds.is_active = true
ORDER BY ds.schedule_date ASC, ds.block, ds.floor_number;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON date_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_conflicts TO authenticated;
GRANT SELECT ON calendar_overview TO authenticated;
GRANT SELECT ON upcoming_schedules TO authenticated;
GRANT EXECUTE ON FUNCTION generate_recurring_schedules TO authenticated;
GRANT EXECUTE ON FUNCTION check_schedule_conflicts TO authenticated;

-- Insert some sample recurring patterns
INSERT INTO recurring_patterns (name, description, pattern_type, day_of_week, pickup_time, dropoff_start_time, dropoff_end_time) VALUES
('Weekly Monday', 'Every Monday pickup', 'weekly', 1, '18:00:00', '08:00:00', '10:00:00'),
('Weekly Wednesday', 'Every Wednesday pickup', 'weekly', 3, '18:00:00', '08:00:00', '10:00:00'),
('Weekly Friday', 'Every Friday pickup', 'weekly', 5, '18:00:00', '08:00:00', '10:00:00'),
('Biweekly Monday', 'Every other Monday pickup', 'biweekly', 1, '18:00:00', '08:00:00', '10:00:00'),
('First Monday of Month', 'First Monday of each month', 'monthly', 1, '18:00:00', '08:00:00', '10:00:00');

-- Insert sample recurring assignments
INSERT INTO recurring_assignments (pattern_id, block, floor_number, start_date, end_date)
SELECT 
    p.id,
    'A',
    1,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months'
FROM recurring_patterns p 
WHERE p.name = 'Weekly Monday';

INSERT INTO recurring_assignments (pattern_id, block, floor_number, start_date, end_date)
SELECT 
    p.id,
    'A',
    2,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months'
FROM recurring_patterns p 
WHERE p.name = 'Weekly Wednesday';
