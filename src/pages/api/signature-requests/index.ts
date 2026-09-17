import type { APIRoute } from 'astro';
import { ensureSignatureRequestsTable } from '../../../lib/signature-requests-table';
import { createSignatureRequest } from '../../../lib/signwell';
import { ensureShareholderEmailColumn } from '../../../lib/shareholders-table';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const r2 = locals.runtime.env.FILES;

  await ensureSignatureRequestsTable(db);
  await ensureShareholderEmailColumn(db);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const title = String(formData.get('title') || '').trim();
  const docType = String(formData.get('docType') || 'Other');
  const signaturePage = Math.max(1, parseInt(String(formData.get('signaturePage') || '1'), 10) || 1);

  if (!file || file.size === 0) return redirect('/sign?error=' + encodeURIComponent('No file provided'), 303);
  if (!title) return redirect('/sign?error=' + encodeURIComponent('Title is required'), 303);

  const { results: shareholders } = await db.prepare(
    'SELECT name, email FROM shareholders WHERE email IS NOT NULL AND email != \'\''
  ).all() as { results: Array<{ name: string; email: string }> };

  if (shareholders.length === 0) {
    return redirect('/sign?error=' + encodeURIComponent('No shareholder has an email on file yet — add emails on the Shareholders page first.'), 303);
  }

  const fileBytes = await file.arrayBuffer();
  const uuid = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const r2Key = `signature/${uuid}_${safeName}`;

  try {
    await r2.put(r2Key, fileBytes, {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    });

    const { documentId } = await createSignatureRequest(locals.runtime.env, {
      title,
      fileBytes,
      fileName: file.name,
      signers: shareholders.map(s => ({ name: s.name, email: s.email })),
      signaturePage,
    });

    await db.prepare(
      'INSERT INTO signature_requests (title, doc_type, file_name, r2_key, esign_document_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(title, docType, file.name, r2Key, documentId).run();
  } catch (e: any) {
    await r2.delete(r2Key).catch(() => {});
    return redirect('/sign?error=' + encodeURIComponent('SignWell error: ' + e.message), 303);
  }

  return redirect('/sign', 303);
};
