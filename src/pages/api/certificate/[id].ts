import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { CertificatePdf } from '../../../components/certificate';

export async function GET({ params, locals }: { params: { id: string }; locals: App.Locals }): Promise<Response> {
  const { id } = params;
  const db = locals.runtime.env.DB;

  const { results } = await db.prepare("SELECT * FROM shareholders WHERE id = ?").bind(id).all();
  const shareholder = results[0] as { name: string; jurisdiction: string; percentage: number } | undefined;

  if (!shareholder) {
    return new Response("Shareholder not found", { status: 404 });
  }

  const stream = await renderToStream(
    React.createElement(CertificatePdf, {
      name: shareholder.name,
      jurisdiction: shareholder.jurisdiction,
      percentage: shareholder.percentage,
    })
  );

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="certificate_${shareholder.name.replace(/\s+/g, '_')}.pdf"`
    }
  });
}
