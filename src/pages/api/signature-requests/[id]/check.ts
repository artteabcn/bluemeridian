import type { APIRoute } from 'astro';
import { processSignatureRequest, type SignatureRequestRow } from '../../../../lib/signature-processing';

export const POST: APIRoute = async ({ params, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const r2 = locals.runtime.env.FILES;
  const { id } = params;

  const { results } = await db.prepare('SELECT * FROM signature_requests WHERE id = ?').bind(Number(id)).all();
  const req = results[0] as SignatureRequestRow | undefined;
  if (!req) return new Response('Signature request not found', { status: 404 });

  try {
    await processSignatureRequest(db, r2, locals.runtime.env, req);
  } catch (e: any) {
    return redirect('/sign?error=' + encodeURIComponent('Check status failed: ' + e.message), 303);
  }

  return redirect('/sign', 303);
};
