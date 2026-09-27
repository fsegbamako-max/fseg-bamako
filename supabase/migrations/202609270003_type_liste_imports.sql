ALTER TABLE public.imports_etudiants
  ADD COLUMN IF NOT EXISTS type_liste TEXT NOT NULL DEFAULT 'partielle';
