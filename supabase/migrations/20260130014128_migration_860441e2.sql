-- Force schema cache refresh by renaming column temporarily
ALTER TABLE invoices RENAME COLUMN amount TO amount_temp;