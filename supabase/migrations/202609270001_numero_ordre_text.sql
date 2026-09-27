ALTER TABLE public.etudiants_officiels
  ALTER COLUMN numero_ordre TYPE TEXT
  USING numero_ordre::TEXT;