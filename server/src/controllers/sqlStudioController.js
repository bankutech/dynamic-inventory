import { db } from '../db/connection.js';

export const executeQuery = (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ status: 'fail', message: 'Query string is required' });
    }

    const trimmed = query.trim();
    if (!trimmed.toLowerCase().startsWith('select') && !trimmed.toLowerCase().startsWith('with')) {
      return res.status(403).json({ status: 'fail', message: 'Only SELECT and WITH (CTE) queries are allowed in SQL Studio.' });
    }

    // Normalize ANSI/T-SQL datepart keywords like DATEADD(month, -12, ...) or DATE_TRUNC(month, ...)
    const normalized = trimmed
      .replace(/\bDATEADD\s*\(\s*([a-zA-Z]+)\s*,/gi, (m, part) => `DATEADD('${part}',`)
      .replace(/\bDATE_TRUNC\s*\(\s*([a-zA-Z]+)\s*,/gi, (m, part) => `DATE_TRUNC('${part}',`);

    const start = performance.now();
    const rows = db.prepare(normalized).all();
    const executionTimeMs = Math.round((performance.now() - start) * 100) / 100;

    res.json({
      status: 'success',
      executionTimeMs,
      rowCount: rows.length,
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      data: rows.slice(0, 50)
    });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};
