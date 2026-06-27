export async function ensureDocumentsTable(db: any): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shareholder_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      doc_type TEXT NOT NULL DEFAULT 'Other',
      r2_key TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}
