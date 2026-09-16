export async function ensureCompanyDocumentsTable(db: any): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS company_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL DEFAULT 'Other',
      file_name TEXT NOT NULL,
      r2_key TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `).run();
}
