-- ================================================================
-- Columnas de producto del modelo ampliado (compartidas por todas las marcas)
-- ================================================================
-- `flavors`      : sabores multi-selección (p. ej. alitas) { options: [], max: N }
-- `sin_pan`      : opción "sin pan (envuelto en lechuga)"
-- `variant_title`: título del selector de variantes (p. ej. "Elige tu Bebida")
--
-- Antes vivían en la semilla de cada marca; se mueven al esquema base para que
-- el guardado de productos funcione en instalaciones nuevas sin depender de
-- una semilla concreta.

ALTER TABLE products ADD COLUMN IF NOT EXISTS flavors JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sin_pan BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variant_title TEXT;
