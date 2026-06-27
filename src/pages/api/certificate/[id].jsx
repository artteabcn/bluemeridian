import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { CertificatePdf } from '../../../components/Certificate';

export async function GET({ params, locals }) {
  const { id } = params;
  const db = locals.runtime.env.DB;

  // Fetch shareholder from Cloudflare D1
  const { results } = await db.prepare("SELECT * FROM shareholders WHERE id = ?").bind(id).all();
  const shareholder = results[0];

  if (!shareholder) {
    return new Response("Shareholder not found", { status: 404 });
  }

  // Stream PDF back to browser
  const stream = await renderToStream(
    <CertificatePdf 
      name={shareholder.name} 
      jurisdiction={shareholder.jurisdiction} 
      percentage={shareholder.percentage} 
    />
  );

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="certificate_${shareholder.name.replace(/\s+/g, '_')}.pdf"`
    }
  });
}