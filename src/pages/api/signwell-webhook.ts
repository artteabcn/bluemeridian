import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { processSignatureRequest, type SignatureRequestRow } from '../../lib/signature-processing';

type SignWellEvent = { type: string; time: number; hash: string };

// Verifies the request actually came from SignWell before we trust it.
// Per SignWell's docs: HMAC-SHA256 keyed by the webhook id (issued when the
// webhook was registered), over `${event.type}@${event.time}`, compared to
// event.hash with a constant-time comparison.
function isValidSignWellEvent(event: SignWellEvent, webhookId: string): boolean {
  const expected = Buffer.from(event.hash, 'hex');
  const actual = Buffer.from(
    createHmac('sha256', webhookId).update(`${event.type}@${event.time}`).digest('hex'),
    'hex'
  );
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime.env;
  const db = env.DB;
  const r2 = env.FILES;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = payload?.event as SignWellEvent | undefined;
  const webhookId = env.SIGNWELL_WEBHOOK_ID;

  if (!event || !webhookId || !isValidSignWellEvent(event, webhookId)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const documentId = payload?.data?.object?.id;
  if (!documentId) return new Response('OK', { status: 200 });

  const { results } = await db.prepare('SELECT * FROM signature_requests WHERE esign_document_id = ?')
    .bind(documentId).all();
  const req = results[0] as SignatureRequestRow | undefined;

  if (req) {
    try {
      await processSignatureRequest(db, r2, env, req);
    } catch (e: any) {
      // Return 500 so SignWell retries the delivery instead of silently
      // dropping this event.
      console.error('signwell-webhook processing failed', e);
      return new Response('Processing failed', { status: 500 });
    }
  }

  return new Response('OK', { status: 200 });
};
