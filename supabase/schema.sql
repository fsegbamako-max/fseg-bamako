-- ============================================================
-- FSEG Bamako — Schéma PostgreSQL pour Supabase
-- Migré depuis SQLite
-- ============================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
  id         SERIAL PRIMARY KEY,
  niveau     TEXT NOT NULL,
  filiere    TEXT NOT NULL,
  option_nom TEXT,
  nom_classe TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÉTUDIANTS OFFICIELS (registre)
-- ============================================================
CREATE TABLE IF NOT EXISTS etudiants_officiels (
  id             SERIAL PRIMARY KEY,
  numero_ordre   TEXT,
  matricule      TEXT UNIQUE NOT NULL,
  cenou          TEXT,
  prenom         TEXT NOT NULL,
  nom            TEXT NOT NULL,
  date_naissance TEXT,
  lieu_naissance TEXT,
  passage        TEXT,
  amphi          TEXT,
  id_classe      INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPTES ÉTUDIANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comptes_etudiants (
  id             SERIAL PRIMARY KEY,
  id_etudiant    INTEGER REFERENCES etudiants_officiels(id) ON DELETE CASCADE,
  id_classe      INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  telephone      TEXT,
  photo_profil   TEXT,
  mot_de_passe   TEXT, -- bcrypt hash
  actif          BOOLEAN DEFAULT true,
  supprime       BOOLEAN DEFAULT false,
  date_creation  TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  mot_de_passe  TEXT NOT NULL, -- bcrypt hash
  nom_complet   TEXT,
  is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEMESTRES
-- ============================================================
CREATE TABLE IF NOT EXISTS semestres (
  id     SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL UNIQUE
);
INSERT INTO semestres (numero) VALUES (1),(2),(3),(4),(5),(6)
  ON CONFLICT DO NOTHING;

-- ============================================================
-- COURS (publications)
-- ============================================================
CREATE TABLE IF NOT EXISTS cours (
  id          SERIAL PRIMARY KEY,
  titre       TEXT NOT NULL,
  description TEXT,
  id_classe   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fichiers_cours (
  id           SERIAL PRIMARY KEY,
  cours_id     INTEGER REFERENCES cours(id) ON DELETE CASCADE,
  fichier      TEXT NOT NULL,  -- Chemin de l’objet dans Supabase Storage
  type_fichier TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTES (publications de documents de résultats)
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id          SERIAL PRIMARY KEY,
  titre       TEXT NOT NULL,
  description TEXT,
  id_classe   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fichiers_notes (
  id           SERIAL PRIMARY KEY,
  note_id      INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  fichier      TEXT NOT NULL,
  type_fichier TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOIS DU TEMPS
-- ============================================================
CREATE TABLE IF NOT EXISTS emplois (
  id          SERIAL PRIMARY KEY,
  titre       TEXT NOT NULL,
  description TEXT,
  id_classe   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fichiers_emplois (
  id           SERIAL PRIMARY KEY,
  emploi_id    INTEGER REFERENCES emplois(id) ON DELETE CASCADE,
  fichier      TEXT NOT NULL,
  type_fichier TEXT,
  is_pinned    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- IMPORTS ÉTUDIANTS (bulk Excel)
-- ============================================================
CREATE TABLE IF NOT EXISTS imports_etudiants (
  id           SERIAL PRIMARY KEY,
  id_classe    INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  fichier      TEXT,
  type_fichier TEXT,
  nom_fichier  TEXT,
  type_liste   TEXT NOT NULL DEFAULT 'partielle',
  suivi_active BOOLEAN NOT NULL DEFAULT FALSE,
  date_import  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS imports_etudiants_lignes (
  id_import   INTEGER NOT NULL REFERENCES imports_etudiants(id) ON DELETE CASCADE,
  id_etudiant INTEGER NOT NULL REFERENCES etudiants_officiels(id) ON DELETE CASCADE,
  PRIMARY KEY (id_import, id_etudiant)
);

CREATE INDEX IF NOT EXISTS idx_imports_etudiants_lignes_import
  ON imports_etudiants_lignes(id_import);

-- ============================================================
-- IMPORTS NOTES (bulk Excel)
-- ============================================================
CREATE TABLE IF NOT EXISTS imports_notes (
  id          SERIAL PRIMARY KEY,
  id_classe   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  id_semestre INTEGER REFERENCES semestres(id),
  fichier     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MATIÈRES
-- ============================================================
CREATE TABLE IF NOT EXISTS matieres (
  id           SERIAL PRIMARY KEY,
  id_import    INTEGER REFERENCES imports_notes(id) ON DELETE CASCADE,
  id_classe    INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  id_semestre  INTEGER REFERENCES semestres(id),
  code_colonne TEXT,
  nom_matiere  TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTES ÉTUDIANTS (relevés de notes individuels)
-- ============================================================
CREATE TABLE IF NOT EXISTS notes_etudiants (
  id          SERIAL PRIMARY KEY,
  id_etudiant INTEGER REFERENCES etudiants_officiels(id) ON DELETE CASCADE,
  id_matiere  INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
  note        NUMERIC(5,2),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_etudiant, id_matiere)
);

-- ============================================================
-- ACTUALITÉS
-- ============================================================
CREATE TABLE IF NOT EXISTS actualites (
  id                SERIAL PRIMARY KEY,
  titre             TEXT NOT NULL,
  contenu           TEXT,
  categorie         TEXT DEFAULT 'Général',
  date_publication  TIMESTAMPTZ DEFAULT NOW(),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fichiers_actualites (
  id           SERIAL PRIMARY KEY,
  actualite_id INTEGER REFERENCES actualites(id) ON DELETE CASCADE,
  fichier      TEXT NOT NULL,
  type_fichier TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS OFFICIELS
-- ============================================================
-- Publications groupées conservées pour reproduire le fonctionnement
-- de documents/documents.php (une publication peut contenir plusieurs fichiers).
CREATE TABLE IF NOT EXISTS publications_documents (
  id          SERIAL PRIMARY KEY,
  titre       TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fichiers_documents (
  id             SERIAL PRIMARY KEY,
  publication_id INTEGER REFERENCES publications_documents(id) ON DELETE CASCADE,
  fichier        TEXT NOT NULL,
  type_fichier   TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Documents unitaires utilisés par les anciennes routes/API.
CREATE TABLE IF NOT EXISTS documents (
  id           SERIAL PRIMARY KEY,
  titre        TEXT NOT NULL,
  fichier      TEXT NOT NULL,
  type_fichier TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX DE PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_eo_matricule     ON etudiants_officiels(matricule);
CREATE INDEX IF NOT EXISTS idx_eo_classe        ON etudiants_officiels(id_classe);
CREATE INDEX IF NOT EXISTS idx_ce_etudiant      ON comptes_etudiants(id_etudiant);
CREATE INDEX IF NOT EXISTS idx_cours_classe     ON cours(id_classe);
CREATE INDEX IF NOT EXISTS idx_notes_classe     ON notes(id_classe);
CREATE INDEX IF NOT EXISTS idx_emplois_classe   ON emplois(id_classe);
CREATE INDEX IF NOT EXISTS idx_fichiers_documents_publication ON fichiers_documents(publication_id);
CREATE INDEX IF NOT EXISTS idx_matieres_classe  ON matieres(id_classe, id_semestre);
CREATE INDEX IF NOT EXISTS idx_notes_etu        ON notes_etudiants(id_etudiant);

-- ============================================================
-- ROW LEVEL SECURITY (activé par les migrations; accès API via service_role)
-- ============================================================
-- SUPABASE_SERVICE_ROLE_KEY reste exclusivement côté serveur.
