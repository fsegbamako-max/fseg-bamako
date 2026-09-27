ALTER TABLE public.imports_etudiants
  ADD COLUMN IF NOT EXISTS nom_fichier TEXT,
  ADD COLUMN IF NOT EXISTS suivi_active BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.imports_etudiants_lignes (
  id_import   INTEGER NOT NULL REFERENCES public.imports_etudiants(id) ON DELETE CASCADE,
  id_etudiant INTEGER NOT NULL REFERENCES public.etudiants_officiels(id) ON DELETE CASCADE,
  PRIMARY KEY (id_import, id_etudiant)
);

CREATE INDEX IF NOT EXISTS idx_imports_etudiants_lignes_import
  ON public.imports_etudiants_lignes(id_import);