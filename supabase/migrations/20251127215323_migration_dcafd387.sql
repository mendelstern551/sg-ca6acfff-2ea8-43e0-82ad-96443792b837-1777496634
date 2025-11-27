-- Add room_type column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'B';

-- Add a check constraint to ensure room_type is A, B, or C
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS room_type_check;
ALTER TABLE rooms ADD CONSTRAINT room_type_check CHECK (room_type IN ('A', 'B', 'C'));

-- Update Building #1 rooms with specific room types
-- Rooms 101-103 and 107-109 are Type A (4 beds, door at bottom)
UPDATE rooms SET room_type = 'A' 
WHERE name IN ('Room 101', 'Room 102', 'Room 103', 'Room 107', 'Room 108', 'Room 109');

-- Rooms 104-106 are Type B (4 beds, door at top)
UPDATE rooms SET room_type = 'B' 
WHERE name IN ('Room 104', 'Room 105', 'Room 106');

-- Rooms 110-112 are Type C (4 beds, door at top + interior connection door)
UPDATE rooms SET room_type = 'C' 
WHERE name IN ('Room 110', 'Room 111', 'Room 112');