-- Create storage bucket for client documents (email attachments)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects for client-documents bucket
CREATE POLICY "public_read_client_docs" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'client-documents');

CREATE POLICY "auth_insert_client_docs" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'client-documents' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "auth_update_client_docs" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'client-documents' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "auth_delete_client_docs" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'client-documents' 
    AND auth.uid() IS NOT NULL
  );

-- Add comment for documentation
COMMENT ON POLICY "public_read_client_docs" ON storage.objects IS 'Allow public read access to client documents';
COMMENT ON POLICY "auth_insert_client_docs" ON storage.objects IS 'Allow authenticated users to upload client documents';