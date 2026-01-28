-- Create storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for email attachments bucket
CREATE POLICY "Anyone can view email attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-attachments');

CREATE POLICY "Authenticated users can upload email attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'email-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update email attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'email-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete email attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'email-attachments' AND auth.uid() IS NOT NULL);