-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('yom_tov', 'shabaton', 'night_event')),
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  number_of_guests INTEGER NOT NULL DEFAULT 0,
  base_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  per_person_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cleaning_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  additional_cleaning_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
  confirmed BOOLEAN NOT NULL DEFAULT false,
  custom_price NUMERIC(10, 2),
  discount_percent NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT NOT NULL,
  vendor TEXT,
  payment_method TEXT NOT NULL,
  expense_date TIMESTAMP WITH TIME ZONE NOT NULL,
  receipt_urls TEXT[],
  proof_urls TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create manager_compensation table
CREATE TABLE IF NOT EXISTS manager_compensation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  compensation_type TEXT NOT NULL CHECK (compensation_type IN ('commission', 'maintenance')),
  amount NUMERIC(10, 2) NOT NULL,
  calculation_basis TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create manager_payments table
CREATE TABLE IF NOT EXISTS manager_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compensation_id UUID NOT NULL REFERENCES manager_compensation(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_compensation ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bookings (public read/write for now)
CREATE POLICY "Anyone can view bookings" ON bookings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update bookings" ON bookings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete bookings" ON bookings FOR DELETE USING (true);

-- Create RLS policies for payments
CREATE POLICY "Anyone can view payments" ON payments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payments" ON payments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete payments" ON payments FOR DELETE USING (true);

-- Create RLS policies for expenses
CREATE POLICY "Anyone can view expenses" ON expenses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert expenses" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update expenses" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete expenses" ON expenses FOR DELETE USING (true);

-- Create RLS policies for manager_compensation
CREATE POLICY "Anyone can view manager compensation" ON manager_compensation FOR SELECT USING (true);
CREATE POLICY "Anyone can insert manager compensation" ON manager_compensation FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update manager compensation" ON manager_compensation FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete manager compensation" ON manager_compensation FOR DELETE USING (true);

-- Create RLS policies for manager_payments
CREATE POLICY "Anyone can view manager payments" ON manager_payments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert manager payments" ON manager_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update manager payments" ON manager_payments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete manager payments" ON manager_payments FOR DELETE USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS bookings_start_date_idx ON bookings(start_date);
CREATE INDEX IF NOT EXISTS bookings_end_date_idx ON bookings(end_date);
CREATE INDEX IF NOT EXISTS bookings_confirmed_idx ON bookings(confirmed);
CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON payments(booking_id);
CREATE INDEX IF NOT EXISTS expenses_booking_id_idx ON expenses(booking_id);
CREATE INDEX IF NOT EXISTS manager_compensation_booking_id_idx ON manager_compensation(booking_id);
CREATE INDEX IF NOT EXISTS manager_payments_compensation_id_idx ON manager_payments(compensation_id);