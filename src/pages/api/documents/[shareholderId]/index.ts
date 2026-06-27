import type { APIRoute } from 'astro';
import { ensureDocumentsTable } from '../../../../lib/documents-table';

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const r2 = locals.runtime.env.FILES;
  const { shareholderId } = params;

  await ensureDocumentsTable(db);

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const docType = String(formData.get('docType') || 'Other');

  if (!file || file.size === 0) {
    return new Response('No file provided', { status: 400 });
  }

  const uuid = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const r2Key = `shareholders/${shareholderId}/${uuid}_${safeName}`;

  await r2.put(r2Key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  await db.prepare(
    'INSERT INTO documents (shareholder_id, file_name, doc_type, r2_key, file_size) VALUES (?, ?, ?, ?, ?)'
  ).bind(Number(shareholderId), file.name, docType, r2Key, file.size).run();

  return redirect('/', 303);
};
