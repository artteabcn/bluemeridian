export async function ensureSignatureRequestsTable(db: any): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS signature_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      doc_type TEXT NOT NULL DEFAULT 'Other',
      file_name TEXT NOT NULL,
      r2_key TEXT NOT NULL,
      opensign_document_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      signer_emails TEXT NOT NULL DEFAULT '[]',
      final_r2_key TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    )
  `).run();
}
