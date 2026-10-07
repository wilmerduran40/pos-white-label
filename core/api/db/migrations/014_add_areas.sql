-- Migración 011: áreas del restaurante (Salón, Terraza, Bar, ...).
-- Cada área agrupa un subconjunto de mesas y tiene su propio plano (lienzo).
-- Es aditiva: se crea el área por defecto y se le asignan las mesas existentes.
--
-- Es aplicada por el motor de migraciones (src/db.js) y queda registrada en
-- schema_migrations, así que se ejecuta una sola vez sobre bases existentes.
-- db/schema.sql no se modifica.

CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  width REAL NOT NULL DEFAULT 1600,
  height REAL NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO areas (name, sort_order)
VALUES ('Salón principal', 0)
ON CONFLICT (name) DO NOTHING;

-- Cada mesa pertenece a un área. RESTRICT evita borrar un área con mesas.
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS area_id INT REFERENCES areas(id) ON DELETE RESTRICT;

UPDATE tables
SET area_id = (SELECT id FROM areas ORDER BY sort_order ASC, id ASC LIMIT 1)
WHERE area_id IS NULL;

ALTER TABLE tables ALTER COLUMN area_id SET NOT NULL;
