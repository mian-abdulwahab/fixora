
-- Create storage bucket for issue images
INSERT INTO storage.buckets (id, name, public) VALUES ('issue-images', 'issue-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload issue images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'issue-images' AND auth.uid() IS NOT NULL);

-- Allow public read access to issue images
CREATE POLICY "Public can view issue images"
ON storage.objects FOR SELECT
USING (bucket_id = 'issue-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own issue images"
ON storage.objects FOR DELETE
USING (bucket_id = 'issue-images' AND auth.uid()::text = (storage.foldername(name))[1]);
