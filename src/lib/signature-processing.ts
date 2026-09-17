import { getDocumentStatus, downloadCompletedPdf } from './signwell';
import { ensureCompanyDocumentsTable } from './company-documents-table';

export type SignatureRequestRow = {
  id: number;
  title: string;
  doc_type: string;
  file_name: string;
  esign_document_id: string;
  status: string;
};

// Pulls the latest status from SignWell for one signature request and, the
// first time it comes back completed, downloads the signed PDF into
// Official Documents. Called both from the manual "Check Status" button and
// from the SignWell webhook.
export async function processSignatureRequest(
  db: any,
  r2: any,
  env: any,
  req: SignatureRequestRow
): Promise<void> {
  const status = await getDocumentStatus(env, req.esign_document_id);

  await db.prepare('UPDATE signature_requests SET signer_emails = ? WHERE id = ?')
    .bind(JSON.stringify(status.signedEmails), req.id).run();

  if (status.completed && req.status !== 'completed') {
    await ensureCompanyDocumentsTable(db);

    const bytes = await downloadCompletedPdf(env, req.esign_document_id);

    const finalKey = `company/signed_${crypto.randomUUID()}_${req.file_name}`;
    await r2.put(finalKey, bytes, { httpMetadata: { contentType: 'application/pdf' } });

    await db.prepare(
      'INSERT INTO company_documents (title, doc_type, file_name, r2_key, file_size) VALUES (?, ?, ?, ?, ?)'
    ).bind(`${req.title} (Signed)`, req.doc_type, req.file_name, finalKey, bytes.byteLength).run();

    await db.prepare(
      "UPDATE signature_requests SET status = 'completed', final_r2_key = ?, completed_at = datetime('now') WHERE id = ?"
    ).bind(finalKey, req.id).run();
  }
}
