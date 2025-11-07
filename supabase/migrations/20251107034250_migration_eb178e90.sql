-- Grant public read access to task types
CREATE POLICY "Allow public read access to task types"
ON "public"."task_types"
FOR SELECT
USING (true);

-- Restrict write operations to authenticated users
CREATE POLICY "Allow insert for authenticated users"
ON "public"."task_types"
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update for authenticated users"
ON "public"."task_types"
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow delete for authenticated users"
ON "public"."task_types"
FOR DELETE
USING (auth.uid() IS NOT NULL);