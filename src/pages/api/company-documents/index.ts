import type { APIRoute } from 'astro';
import { ensureCompanyDocumentsTable } from '../../../lib/company-documents-table';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const r2 = locals.runtime.env.FILES;

  await ensureCompanyDocumentsTable(db);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const title = String(formData.get('title') || '').trim();
  const docType = String(formData.get('docType') || 'Other');

  if (!file || file.size === 0) {
    return new Response('No file provided', { status: 400 });
  }
  if (!title) {
    return new Response('Title is required', { status: 400 });
  }

  const uuid = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const r2Key = `company/${uuid}_${safeName}`;

  await r2.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  await db.prepare(
    'INSERT INTO company_documents (title, doc_type, file_name, r2_key, file_size) VALUES (?, ?, ?, ?, ?)'
  ).bind(title, docType, file.name, r2Key, file.size).run();

  return redirect('/documents', 303);
};
