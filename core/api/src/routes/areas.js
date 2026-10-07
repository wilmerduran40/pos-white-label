'use strict';

// CRUD de áreas del restaurante (Salón, Terraza, Bar, ...).
//
// Cada área agrupa un subconjunto de mesas y tiene su propio plano (lienzo),
// con ancho/alto configurables.
//
//   R      GET    /api/areas        (admin, mesero) listar con conteo de mesas
//   C      POST   /api/areas        (admin) crear área
//   U      PUT    /api/areas/:id    (admin) editar nombre/orden/tamaño del lienzo
//   D      DELETE /api/areas/:id    (admin) eliminar (solo sin mesas)

const express = require('express');
const { query } = require('../db');
const { requireRole, requireAdmin } = require('../auth');
const { wrap } = require('../http');

const router = express.Router();

const AREA_COLS = 'id, name, sort_order, width, height, created_at, updated_at';

function clampNum(v, min, max, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

function mapArea(row) {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    width: Number(row.width),
    height: Number(row.height),
    tableCount: row.table_count !== undefined ? Number(row.table_count) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function bad(msg) {
  const err = new Error(msg);
  err.status = 400;
  throw err;
}

function notFound() {
  const err = new Error('Área no encontrada.');
  err.status = 404;
  throw err;
}

function sanitize(body, existing) {
  const cur = existing || { name: '', sort_order: 0, width: 1600, height: 1000 };
  const pick = (f, fallback) => (body && body[f] !== undefined ? body[f] : fallback);

  const name = String(pick('name', cur.name)).trim();
  if (!name) bad('El nombre del área es obligatorio.');

  const sortOrder = Math.round(clampNum(pick('sortOrder', cur.sort_order), -10000, 10000, 0));
  const width = Math.round(clampNum(pick('width', cur.width), 600, 8000, 1600));
  const height = Math.round(clampNum(pick('height', cur.height), 400, 8000, 1000));

  return { name: name.slice(0, 60), sortOrder, width, height };
}

async function nameTaken(name, exceptId) {
  const { rows } = await query(
    'SELECT id FROM areas WHERE lower(name) = lower($1) AND ($2::int IS NULL OR id <> $2)',
    [name, exceptId || null]
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// R — GET /api/areas (admin, mesero)
// ---------------------------------------------------------------------------
router.get('/areas', requireRole('admin', 'mesero'), wrap(async (req, res) => {
  const { rows } = await query(
    `SELECT a.id, a.name, a.sort_order, a.width, a.height, a.created_at, a.updated_at,
            COUNT(t.id) AS table_count
       FROM areas a
       LEFT JOIN tables t ON t.area_id = a.id
      GROUP BY a.id
      ORDER BY a.sort_order ASC, a.name ASC`
  );
  res.json({ areas: rows.map(mapArea) });
}));

// ---------------------------------------------------------------------------
// C — POST /api/areas (admin)
// ---------------------------------------------------------------------------
router.post('/areas', requireAdmin, wrap(async (req, res) => {
  const a = sanitize(req.body, null);
  if (await nameTaken(a.name, null)) {
    return res.status(409).json({ error: `Ya existe un área "${a.name}".` });
  }
  const { rows } = await query(
    `INSERT INTO areas (name, sort_order, width, height)
     VALUES ($1, $2, $3, $4) RETURNING ${AREA_COLS}`,
    [a.name, a.sortOrder, a.width, a.height]
  );
  res.status(201).json({ area: mapArea(rows[0]) });
}));

// ---------------------------------------------------------------------------
// U — PUT /api/areas/:id (admin)
// ---------------------------------------------------------------------------
router.put('/areas/:id', requireAdmin, wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) bad('Área inválida.');
  const { rows: found } = await query(`SELECT ${AREA_COLS} FROM areas WHERE id = $1`, [id]);
  const existing = found[0];
  if (!existing) notFound();

  const a = sanitize(req.body || {}, existing);
  if (await nameTaken(a.name, id)) {
    return res.status(409).json({ error: `Ya existe un área "${a.name}".` });
  }
  const { rows } = await query(
    `UPDATE areas SET name = $1, sort_order = $2, width = $3, height = $4, updated_at = now()
      WHERE id = $5 RETURNING ${AREA_COLS}`,
    [a.name, a.sortOrder, a.width, a.height, id]
  );
  res.json({ area: mapArea(rows[0]) });
}));

// ---------------------------------------------------------------------------
// D — DELETE /api/areas/:id (admin)
// ---------------------------------------------------------------------------
router.delete('/areas/:id', requireAdmin, wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) bad('Área inválida.');
  const { rows } = await query('SELECT id FROM areas WHERE id = $1', [id]);
  if (!rows.length) notFound();

  const { rows: used } = await query(
    'SELECT COUNT(*)::int AS n FROM tables WHERE area_id = $1',
    [id]
  );
  if (used[0].n > 0) {
    const err = new Error('El área tiene mesas. Mueve o elimina sus mesas antes de borrarla.');
    err.status = 409;
    throw err;
  }
  await query('DELETE FROM areas WHERE id = $1', [id]);
  res.json({ ok: true });
}));

module.exports = router;
