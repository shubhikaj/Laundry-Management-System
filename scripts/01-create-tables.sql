-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'staff', 'admin');
CREATE TYPE laundry_status AS ENUM ('scheduled', 'dropped_off', 'washing', 'ready_for_pickup', 'picked_up');
CREATE TYPE notification_type AS ENUM ('email', 'sms');
CREATE TYPE activity_type AS ENUM ('login', 'status_change', 'notification_sent', 'schedule_update');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
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

-- Laundry schedules table
CREATE TABLE laundry_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block CHAR(1) NOT NULL CHECK (block IN ('A', 'B', 'C', 'D', 'E')),
    floor_number INTEGER NOT NULL,
    scheduled_day VARCHAR(10) NOT NULL, -- 'monday', 'tuesday', etc.
    pickup_time TIME NOT NULL DEFAULT '18:00:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(block, floor_number)
);

-- Laundry batches table
CREATE TABLE laundry_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES laundry_batches(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered BOOLEAN DEFAULT false
);

-- Activity logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type activity_type NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_block_floor ON users(block, floor_number);
CREATE INDEX idx_laundry_batches_student ON laundry_batches(student_id);
CREATE INDEX idx_laundry_batches_status ON laundry_batches(status);
CREATE INDEX idx_laundry_batches_scheduled_date ON laundry_batches(scheduled_date);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
