-- Create date-specific schedules table if it doesn't exist
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
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(block, floor_number, schedule_date)
);

-- Insert some sample date-specific schedules
INSERT INTO date_schedules (block, floor_number, schedule_date, pickup_time, dropoff_start_time, dropoff_end_time, notes)
VALUES 
    ('A', 1, CURRENT_DATE + INTERVAL '1 day', '18:00:00', '08:00:00', '10:00:00', 'Special schedule for tomorrow'),
    ('B', 2, CURRENT_DATE + INTERVAL '2 days', '17:00:00', '09:00:00', '11:00:00', 'Extended drop-off window')
ON CONFLICT (block, floor_number, schedule_date) DO NOTHING;