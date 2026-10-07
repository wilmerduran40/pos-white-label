-- Migración 012: objetos del plano (puertas, plantas, barra, cocina, ...).
-- Sirven para que el plano de mesas funcione también como mapa real del lugar.
-- Cada objeto pertenece a un área y se elimina en cascada con ella (CASCADE).
-- Es aditiva: no toca mesas ni pedidos. db/schema.sql no se modifica.

CREATE TABLE IF NOT EXISTS floor_objects (
  id SERIAL PRIMARY KEY,
  area_id INT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT,
  pos_x REAL NOT NULL DEFAULT 0,
  pos_y REAL NOT NULL DEFAULT 0,
  width REAL NOT NULL DEFAULT 80,
  height REAL NOT NULL DEFAULT 80,
  rotation INT NOT NULL DEFAULT 0,
  z_index INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_floor_objects_area ON floor_objects(area_id);