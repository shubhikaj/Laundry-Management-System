-- Notification System Setup
-- This script ensures the notification system is properly configured

-- Create notification types enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('email', 'sms');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create activity types enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM ('login', 'status_change', 'notification_sent', 'schedule_update');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create laundry status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE laundry_status AS ENUM ('scheduled', 'dropped_off', 'washing', 'ready_for_pickup', 'picked_up');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    batch_id UUID,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered BOOLEAN DEFAULT false
);

-- Create laundry_batches table if it doesn't exist (for reference)
CREATE TABLE IF NOT EXISTS laundry_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    status laundry_status NOT NULL DEFAULT 'scheduled',
    scheduled_date DATE NOT NULL,
    dropped_off_at TIMESTAMP WITH TIME ZONE,
    ready_at TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    staff_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    activity_type activity_type NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints if they don't exist
DO $$ BEGIN
    -- Only add foreign key to auth.users if profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_user_id;
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
            
        ALTER TABLE laundry_batches DROP CONSTRAINT IF EXISTS fk_laundry_batches_student_id;
        ALTER TABLE laundry_batches ADD CONSTRAINT fk_laundry_batches_student_id 
            FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;
            
        ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS fk_activity_logs_user_id;
        ALTER TABLE activity_logs ADD CONSTRAINT fk_activity_logs_user_id 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint for batch_id if it doesn't exist
DO $$ BEGIN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS fk_notifications_batch_id;
    ALTER TABLE notifications ADD CONSTRAINT fk_notifications_batch_id 
        FOREIGN KEY (batch_id) REFERENCES laundry_batches(id) ON DELETE CASCADE;
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_batch ON notifications(batch_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_notifications_delivered ON notifications(delivered);
CREATE INDEX IF NOT EXISTS idx_laundry_batches_student ON laundry_batches(student_id);
CREATE INDEX IF NOT EXISTS idx_laundry_batches_status ON laundry_batches(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Create a function to send pickup notifications
CREATE OR REPLACE FUNCTION send_pickup_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only send notification when status changes to 'ready_for_pickup'
    IF NEW.status = 'ready_for_pickup' AND OLD.status != 'ready_for_pickup' THEN
        INSERT INTO notifications (user_id, batch_id, type, message, delivered)
        VALUES (
            NEW.student_id,
            NEW.id,
            'email',
            'Your laundry batch ' || NEW.batch_number || ' is ready for pickup!',
            true
        );
        
        -- Log the activity
        INSERT INTO activity_logs (user_id, activity_type, description, metadata)
        VALUES (
            NEW.student_id,
            'notification_sent',
            'Pickup notification sent for batch ' || NEW.batch_number,
            jsonb_build_object('batch_id', NEW.id, 'batch_number', NEW.batch_number)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically send notifications
DROP TRIGGER IF EXISTS trigger_send_pickup_notification ON laundry_batches;
CREATE TRIGGER trigger_send_pickup_notification
    AFTER UPDATE ON laundry_batches
    FOR EACH ROW
    EXECUTE FUNCTION send_pickup_notification();

-- Insert some sample notifications for demo purposes (only if no notifications exist)
INSERT INTO notifications (user_id, batch_id, type, message, delivered)
SELECT 
    'demo-user-id',
    NULL,
    'email',
    'Welcome to the Laundry Management System! You will receive notifications when your laundry is ready for pickup.',
    true
WHERE NOT EXISTS (SELECT 1 FROM notifications LIMIT 1);

-- Grant necessary permissions (adjust as needed for your setup)
-- These grants assume you're using Supabase's default setup
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON laundry_batches TO authenticated;
GRANT SELECT, INSERT ON activity_logs TO authenticated;

-- Enable RLS on notifications table (optional, for enhanced security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for notifications (users can only see their own notifications)
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policy for notifications (users can insert their own notifications)
CREATE POLICY "Users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policy for notifications (users can update their own notifications)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON TABLE notifications IS 'Stores notifications sent to users about laundry status updates';
COMMENT ON COLUMN notifications.delivered IS 'Whether the notification has been delivered/read by the user';
COMMENT ON FUNCTION send_pickup_notification() IS 'Automatically sends notifications when laundry status changes to ready_for_pickup';
