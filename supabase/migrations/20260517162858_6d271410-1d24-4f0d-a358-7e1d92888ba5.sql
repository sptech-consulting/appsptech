-- Bucket público para imagens da plataforma (logos, capas, ícones, thumbs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('plataforma', 'plataforma', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública (bucket é público mesmo)
CREATE POLICY "plataforma publica leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plataforma');

-- Upload por qualquer admin ativo
CREATE POLICY "plataforma admin upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'plataforma' AND public.is_any_admin());

-- Update por qualquer admin ativo
CREATE POLICY "plataforma admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'plataforma' AND public.is_any_admin());

-- Delete por qualquer admin ativo
CREATE POLICY "plataforma admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'plataforma' AND public.is_any_admin());
