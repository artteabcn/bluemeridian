import { generateCertificate } from '../../../lib/certificate';

export async function GET({ params, locals }: { params: { id: string }; locals: App.Locals }): Promise<Response> {
  const id = Number(params.id);
  const db = locals.runtime.env.DB;

  const { results } = await db.prepare('SELECT * FROM shareholders WHERE id = ?').bind(id).all();
  const sh = results[0] as { name: string; jurisdiction: string; percentage: number } | undefined;

  if (!sh) return new Response('Shareholder not found', { status: 404 });

  try {
    const pdfBytes = await generateCertificate(sh.name, sh.jurisdiction, sh.percentage, id);
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificate_${sh.name.replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    return new Response(msg, { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
