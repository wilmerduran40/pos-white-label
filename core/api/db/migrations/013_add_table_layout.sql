-- Migración 010: plano de mesas (layout visual).
-- Añade posición, forma, tamaño y rotación a `tables` para dibujar el plano
-- de la sala en el panel y arrastrar las mesas. Es aditiva: las mesas
-- existentes conservan su número/nombre/capacidad.
--
-- Auto-layout inicial: las mesas ya creadas se colocan en una cuadrícula
-- (4 columnas) calculada desde su número, para que no queden todas apiladas
-- en el origen al abrir el plano por primera vez.

ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS pos_x REAL NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pos_y REAL NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shape TEXT NOT NULL DEFAULT 'square'
    CHECK (shape IN ('round', 'square', 'rect')),
  ADD COLUMN IF NOT EXISTS width REAL NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS height REAL NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rotation INT NOT NULL DEFAULT 0;

-- Tamaño por defecto según la forma (0 = auto en el frontend).
UPDATE tables SET
  width  = CASE WHEN width  > 0 THEN width  ELSE CASE shape WHEN 'round' THEN 120 WHEN 'square' THEN 96 ELSE 180 END END,
  height = CASE WHEN height > 0 THEN height ELSE CASE shape WHEN 'round' THEN 120 WHEN 'square' THEN 96 ELSE 96 END END;

-- Colocar las mesas existentes en una cuadrícula de 4 columnas (solo las que
-- siguen en el origen porque recién se está creando el layout).
UPDATE tables SET
  pos_x = ((no - 1) % 4) * 180 + 40,
  pos_y = floor((no - 1) / 4) * 160 + 40
WHERE pos_x = 0 AND pos_y = 0;