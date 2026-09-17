export async function ensureSignatureRequestsTable(db: any): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS signature_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL DEFAULT 'Other',
      file_name TEXT NOT NULL,
      r2_key TEXT NOT NULL,
      esign_document_id TEXT,
      embedded_edit_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      signer_emails TEXT NOT NULL DEFAULT '[]',
      final_r2_key TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    )
  `).run();

  const { results } = await db.prepare('PRAGMA table_info(signature_requests)').all();
  const columns = (results as Array<{ name: string }>).map(col => col.name);

  if (!columns.includes('esign_document_id')) {
    await db.prepare('ALTER TABLE signature_requests ADD COLUMN esign_document_id TEXT').run();
  }
  if (!columns.includes('embedded_edit_url')) {
    await db.prepare('ALTER TABLE signature_requests ADD COLUMN embedded_edit_url TEXT').run();
  }
}
