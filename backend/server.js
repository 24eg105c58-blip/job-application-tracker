import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
import fs from 'node:fs';
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'jobs.db'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Applied',
    applied_date TEXT NOT NULL,
    job_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

const statuses = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected'];
function validate(body) {
  const company = String(body.company ?? '').trim();
  const role = String(body.role ?? '').trim();
  const status = String(body.status ?? 'Applied');
  if (!company || !role) return { error: 'Company and role are required.' };
  if (!statuses.includes(status)) return { error: 'Invalid status.' };
  return {
    company, role, status,
    applied_date: String(body.applied_date || new Date().toISOString().slice(0, 10)),
    job_url: String(body.job_url ?? '').trim(),
    notes: String(body.notes ?? '').trim()
  };
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/applications', (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const rows = q
    ? db.prepare(`SELECT * FROM applications WHERE company LIKE ? OR role LIKE ? OR notes LIKE ? ORDER BY created_at DESC`)
        .all(`%${q}%`, `%${q}%`, `%${q}%`)
    : db.prepare('SELECT * FROM applications ORDER BY created_at DESC').all();
  res.json(rows);
});
app.post('/api/applications', (req, res) => {
  const data = validate(req.body);
  if (data.error) return res.status(400).json({ error: data.error });
  const result = db.prepare(`INSERT INTO applications
    (company, role, status, applied_date, job_url, notes) VALUES
    (@company, @role, @status, @applied_date, @job_url, @notes)`).run(data);
  res.status(201).json(db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid));
});
app.patch('/api/applications/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Application not found.' });
  const merged = validate({ ...existing, ...req.body });
  if (merged.error) return res.status(400).json({ error: merged.error });
  db.prepare(`UPDATE applications SET company=@company, role=@role, status=@status,
    applied_date=@applied_date, job_url=@job_url, notes=@notes WHERE id=@id`)
    .run({ ...merged, id: existing.id });
  res.json(db.prepare('SELECT * FROM applications WHERE id = ?').get(existing.id));
});
app.delete('/api/applications/:id', (req, res) => {
  const result = db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Application not found.' });
  res.status(204).end();
});
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Job tracker API listening on http://localhost:${port}`));
