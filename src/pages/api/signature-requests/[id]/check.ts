import type { APIRoute } from 'astro';
import { getDocumentStatus } from '../../../../lib/opensign';
import { ensureCompanyDocumentsTable } from '../../../../lib/company-documents-table';

type SigReqRow = {
  id: number;
  title: string;
  doc_type: string;
  file_name: string;
  opensign_document_id: string;
};

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const r2 = locals.runtime.env.FILES;
  const { id } = params;

  const { results } = await db.prepare('SELECT * FROM signature_requests WHERE id = ?').bind(Number(id)).all();
  const req = results[0] as SigReqRow | undefined;
  if (!req) return new Response('Signature request not found', { status: 404 });

  const status = await getDocumentStatus(locals.runtime.env, req.opensign_document_id);

  await db.prepare('UPDATE signature_requests SET signer_emails = ? WHERE id = ?')
    .bind(JSON.stringify(status.signedEmails), req.id).run();

  if (status.completed && status.fileUrl) {
    await ensureCompanyDocumentsTable(db);

    const signedPdf = await fetch(status.fileUrl);
    if (!signedPdf.ok) return new Response('Could not download signed document from OpenSign', { status: 502 });
    const bytes = await signedPdf.arrayBuffer();

    const finalKey = `company/signed_${crypto.randomUUID()}_${req.file_name}`;
    await r2.put(finalKey, bytes, { httpMetadata: { contentType: 'application/pdf' } });

    await db.prepare(
      'INSERT INTO company_documents (title, doc_type, file_name, r2_key, file_size) VALUES (?, ?, ?, ?, ?)'
    ).bind(`${req.title} (Signed)`, req.doc_type, req.file_name, finalKey, bytes.byteLength).run();

    await db.prepare(
      "UPDATE signature_requests SET status = 'completed', final_r2_key = ?, completed_at = datetime('now') WHERE id = ?"
    ).bind(finalKey, req.id).run();
  }

  return redirect('/sign', 303);
};
