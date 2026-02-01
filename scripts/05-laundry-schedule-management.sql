-- Enhanced Laundry Schedule Management System
-- This allows admins to set and manage laundry schedules for each block and floor

-- Drop existing laundry_schedules table if it exists
DROP TABLE IF EXISTS laundry_schedules CASCADE;

-- Create enhanced laundry schedules table
CREATE TABLE laundry_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block CHAR(1) NOT NULL CHECK (block IN ('A', 'B', 'C', 'D', 'E')),
    floor_number INTEGER NOT NULL CHECK (floor_number BETWEEN 1 AND 10),
    scheduled_day VARCHAR(10) NOT NULL CHECK (scheduled_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    pickup_time TIME NOT NULL DEFAULT '18:00:00',
    dropoff_start_time TIME NOT NULL DEFAULT '08:00:00',
    dropoff_end_time TIME NOT NULL DEFAULT '10:00:00',
    is_active BOOLEAN DEFAULT true,
    max_batches_per_day INTEGER DEFAULT 50,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(block, floor_number, scheduled_day)
);

-- Create schedule exceptions table for holidays/special days
CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES laundry_schedules(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    is_cancelled BOOLEAN DEFAULT false,
    alternative_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule templates for easy replication
CREATE TABLE schedule_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create template schedules
CREATE TABLE template_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES schedule_templates(id) ON DELETE CASCADE,
    scheduled_day VARCHAR(10) NOT NULL CHECK (scheduled_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    pickup_time TIME NOT NULL DEFAULT '18:00:00',
    dropoff_start_time TIME NOT NULL DEFAULT '08:00:00',
    dropoff_end_time TIME NOT NULL DEFAULT '10:00:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_laundry_schedules_block_floor ON laundry_schedules(block, floor_number);
CREATE INDEX idx_laundry_schedules_day ON laundry_schedules(scheduled_day);
CREATE INDEX idx_laundry_schedules_active ON laundry_schedules(is_active);
CREATE INDEX idx_schedule_exceptions_date ON schedule_exceptions(exception_date);
CREATE INDEX idx_template_schedules_template ON template_schedules(template_id);

-- Insert default schedule template
INSERT INTO schedule_templates (id, name, description, is_default) VALUES 
(gen_random_uuid(), 'Standard Weekly Schedule', 'Default schedule for all blocks and floors', true);

-- Insert default schedules for the template
INSERT INTO template_schedules (template_id, scheduled_day, pickup_time, dropoff_start_time, dropoff_end_time)
SELECT 
    t.id,
    day,
    '18:00:00'::time,
    '08:00:00'::time,
    '10:00:00'::time
FROM schedule_templates t
CROSS JOIN (VALUES ('monday'), ('tuesday'), ('wednesday'), ('thursday'), ('friday')) AS days(day)
WHERE t.is_default = true;

-- Create function to apply template to specific block/floor
CREATE OR REPLACE FUNCTION apply_schedule_template(
    p_template_id UUID,
    p_block CHAR(1),
    p_floor_number INTEGER
) RETURNS void AS $$
BEGIN
    -- Delete existing schedules for this block/floor
    DELETE FROM laundry_schedules 
    WHERE block = p_block AND floor_number = p_floor_number;
    
    -- Insert new schedules based on template
    INSERT INTO laundry_schedules (block, floor_number, scheduled_day, pickup_time, dropoff_start_time, dropoff_end_time)
    SELECT 
        p_block,
        p_floor_number,
        ts.scheduled_day,
        ts.pickup_time,
        ts.dropoff_start_time,
        ts.dropoff_end_time
    FROM template_schedules ts
    WHERE ts.template_id = p_template_id;
    
    RAISE NOTICE 'Applied template % to Block % Floor %', p_template_id, p_block, p_floor_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to bulk apply template to multiple blocks/floors
CREATE OR REPLACE FUNCTION bulk_apply_schedule_template(
    p_template_id UUID,
    p_blocks CHAR(1)[],
    p_floors INTEGER[]
) RETURNS void AS $$
DECLARE
    block_val CHAR(1);
    floor_val INTEGER;
BEGIN
    FOREACH block_val IN ARRAY p_blocks LOOP
        FOREACH floor_val IN ARRAY p_floors LOOP
            PERFORM apply_schedule_template(p_template_id, block_val, floor_val);
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Bulk applied template % to % blocks and % floors', p_template_id, array_length(p_blocks, 1), array_length(p_floors, 1);
END;
$$ LANGUAGE plpgsql;

-- Create view for easy schedule viewing
CREATE VIEW schedule_overview AS
SELECT 
    ls.block,
    ls.floor_number,
    ls.scheduled_day,
    ls.pickup_time,
    ls.dropoff_start_time,
    ls.dropoff_end_time,
    ls.is_active,
    ls.max_batches_per_day,
    u.full_name as created_by_name,
    ls.created_at
FROM laundry_schedules ls
LEFT JOIN profiles u ON ls.created_by = u.id
ORDER BY ls.block, ls.floor_number, 
    CASE ls.scheduled_day 
        WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2 WHEN 'wednesday' THEN 3 
        WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5 WHEN 'saturday' THEN 6 
        WHEN 'sunday' THEN 7 END;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON laundry_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_exceptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON schedule_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON template_schedules TO authenticated;
GRANT SELECT ON schedule_overview TO authenticated;


