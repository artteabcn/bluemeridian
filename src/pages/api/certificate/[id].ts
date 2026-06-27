import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { CertificatePdf } from '../../../components/certificate';

export async function GET({ params, locals }: { params: { id: string }; locals: App.Locals }): Promise<Response> {
  const { id } = params;
  const db = locals.runtime.env.DB;

  const { results } = await db.prepare("SELECT * FROM shareholders WHERE id = ?").bind(id).all();
  const shareholder = results[0] as { name: string; jurisdiction: string; percentage: number } | undefined;

  if (!shareholder) {
    return new Response("Shareholder not found", { status: 404 });
  }

  try {
    const blob = await pdf(
      React.createElement(CertificatePdf, {
        name: shareholder.name,
        jurisdiction: shareholder.jurisdiction,
        percentage: shareholder.percentage,
      })
    ).toBlob();

    const arrayBuffer = await blob.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificate_${shareholder.name.replace(/\s+/g, '_')}.pdf"`
      }
    });
  } catch (err) {
    const message = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    return new Response(message, { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
