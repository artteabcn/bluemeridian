import type { APIRoute } from 'astro';

type DocRow = { id: number; r2_key: string; file_name: string };

export const GET: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.DB;
  const r2 = locals.runtime.env.FILES;
  const { docId } = params;

  const { results } = await db.prepare('SELECT * FROM documents WHERE id = ?').bind(Number(docId)).all();
  const doc = results[0] as DocRow | undefined;
  if (!doc) return new Response('Document not found', { status: 404 });

  const object = await r2.get(doc.r2_key);
  if (!object) return new Response('File not found in storage', { status: 404 });

  return new Response(await object.arrayBuffer(), {
    headers: {
      'Content-Type': (object.httpMetadata as any)?.contentType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${doc.file_name}"`,
    },
  });
};

export const POST: APIRoute = async ({ params, request, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const r2 = locals.runtime.env.FILES;
  const { docId } = params;

  const formData = await request.formData();
  if (String(formData.get('action')) === 'delete') {
    const { results } = await db.prepare('SELECT r2_key FROM documents WHERE id = ?').bind(Number(docId)).all();
    const doc = results[0] as { r2_key: string } | undefined;
    if (doc) {
      await r2.delete(doc.r2_key);
      await db.prepare('DELETE FROM documents WHERE id = ?').bind(Number(docId)).run();
    }
  }

  return redirect('/', 303);
};
