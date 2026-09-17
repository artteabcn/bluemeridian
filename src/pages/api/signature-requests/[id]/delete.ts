import type { APIRoute } from 'astro';
import { deleteDocument } from '../../../../lib/signwell';

type SigReqRow = { id: number; r2_key: string; esign_document_id: string };

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const r2 = locals.runtime.env.FILES;
  const { id } = params;

  const { results } = await db.prepare('SELECT * FROM signature_requests WHERE id = ?').bind(Number(id)).all();
  const req = results[0] as SigReqRow | undefined;
  if (!req) return new Response('Signature request not found', { status: 404 });

  try {
    if (req.esign_document_id) {
      await deleteDocument(locals.runtime.env, req.esign_document_id);
    }
  } catch (e: any) {
    return redirect('/sign?error=' + encodeURIComponent('Could not delete on SignWell: ' + e.message), 303);
  }

  await r2.delete(req.r2_key).catch(() => {});
  await db.prepare('DELETE FROM signature_requests WHERE id = ?').bind(req.id).run();

  return redirect('/sign', 303);
};
