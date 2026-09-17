import type { APIRoute } from 'astro';

// SignWell's embedded editor redirects the browser here (via
// requestingRedirectUrl) once the sender finishes placing fields and clicks
// Send inside the editor. At that point the document is genuinely sent, so
// flip our local record from 'draft' to 'pending'.
export const GET: APIRoute = async ({ params, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const { id } = params;

  await db.prepare(
    "UPDATE signature_requests SET status = 'pending', embedded_edit_url = NULL WHERE id = ? AND status = 'draft'"
  ).bind(Number(id)).run();

  return redirect('/sign', 303);
};
