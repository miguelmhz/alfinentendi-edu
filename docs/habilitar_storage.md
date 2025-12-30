Opción 1: Desde Supabase Dashboard
Ve a Storage → Policies en tu proyecto Supabase
Selecciona el bucket afe_imgs
Crea las siguientes políticas:
Política de INSERT (para subir archivos):

sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'afe_imgs');
Política de SELECT (para leer archivos):

sql
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'afe_imgs');
Política de UPDATE (para actualizar archivos):

sql
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'afe_imgs');
Política de DELETE (para eliminar archivos):

sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'afe_imgs');

marcar publico el bucket 


-- Permitir lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'afe_imgs');

-- Permitir upload a usuarios autenticados
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'afe_imgs');

-- Permitir actualización a usuarios autenticados
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'afe_imgs');

-- Permitir eliminación a usuarios autenticados
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'afe_imgs');