-- Reminders and Notifications
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'snoozed'
    category TEXT,
    snoozed_until TIMESTAMP WITH TIME ZONE,
    auto_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    email_type TEXT NOT NULL, -- e.g., 'confirmation', 'invoice', 'reminder'
    sent_to TEXT NOT NULL,
    status TEXT NOT NULL, -- 'sent', 'failed'
    subject TEXT,
    body TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage email logs" ON email_logs FOR ALL USING (true); -- Simplified

-- Manager Compensation
CREATE TABLE IF NOT EXISTS manager_compensation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_salary NUMERIC NOT NULL DEFAULT 0,
    commission_rate NUMERIC NOT NULL DEFAULT 0, -- e.g., 0.10 for 10%
    calculation_logic TEXT, -- 'percentage_of_total', 'fixed_amount_per_booking'
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE manager_compensation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage compensation" ON manager_compensation FOR ALL USING (true); -- Simplified

CREATE TABLE IF NOT EXISTS manager_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compensation_id UUID REFERENCES manager_compensation(id) ON DELETE SET NULL,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    total_booking_revenue NUMERIC,
    commission_earned NUMERIC,
    salary_paid NUMERIC,
    total_payment NUMERIC,
    payment_date DATE DEFAULT CURRENT_DATE,
    status TEXT, -- 'pending', 'paid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE manager_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage manager payments" ON manager_payments FOR ALL USING (true); -- Simplified

CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    reminder_type TEXT NOT NULL, -- e.g., '30_day', '7_day', 'custom'
    sent_to TEXT,
    status TEXT, -- 'sent', 'failed'
    notes TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage payment reminders" ON payment_reminders FOR ALL USING (true); -- Simplified