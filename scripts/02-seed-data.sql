-- Insert default laundry schedules for all blocks and floors
INSERT INTO laundry_schedules (block, floor_number, scheduled_day, pickup_time) VALUES
-- Block A
('A', 1, 'monday', '18:00:00'),
('A', 2, 'tuesday', '18:00:00'),
('A', 3, 'wednesday', '18:00:00'),
('A', 4, 'thursday', '18:00:00'),
('A', 5, 'friday', '18:00:00'),

-- Block B
('B', 1, 'tuesday', '18:00:00'),
('B', 2, 'wednesday', '18:00:00'),
('B', 3, 'thursday', '18:00:00'),
('B', 4, 'friday', '18:00:00'),
('B', 5, 'monday', '18:00:00'),

-- Block C
('C', 1, 'wednesday', '18:00:00'),
('C', 2, 'thursday', '18:00:00'),
('C', 3, 'friday', '18:00:00'),
('C', 4, 'monday', '18:00:00'),
('C', 5, 'tuesday', '18:00:00'),

-- Block D
('D', 1, 'thursday', '18:00:00'),
('D', 2, 'friday', '18:00:00'),
('D', 3, 'monday', '18:00:00'),
('D', 4, 'tuesday', '18:00:00'),
('D', 5, 'wednesday', '18:00:00'),

-- Block E
('E', 1, 'friday', '18:00:00'),
('E', 2, 'monday', '18:00:00'),
('E', 3, 'tuesday', '18:00:00'),
('E', 4, 'wednesday', '18:00:00'),
('E', 5, 'thursday', '18:00:00');

-- Insert sample admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@college.edu', '$2b$10$rQZ8kHWiZ8qExampleHashForAdmin123', 'System Administrator', 'admin');

-- Insert sample staff user (password: staff123)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('staff@college.edu', '$2b$10$rQZ8kHWiZ8qExampleHashForStaff123', 'Laundry Staff', 'staff');

-- Insert sample students
INSERT INTO users (email, password_hash, full_name, role, block, floor_number, room_number, phone) VALUES
('john.doe@student.college.edu', '$2b$10$rQZ8kHWiZ8qExampleHashForStudent123', 'John Doe', 'student', 'A', 1, '101', '+1234567890'),
('jane.smith@student.college.edu', '$2b$10$rQZ8kHWiZ8qExampleHashForStudent123', 'Jane Smith', 'student', 'B', 2, '205', '+1234567891'),
('mike.johnson@student.college.edu', '$2b$10$rQZ8kHWiZ8qExampleHashForStudent123', 'Mike Johnson', 'student', 'C', 3, '312', '+1234567892');
