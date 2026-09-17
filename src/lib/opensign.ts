// OpenSign hosted API client — https://docs.opensignlabs.com
//
// NOTE: field names below are the best-effort reading of OpenSign's public
// docs. Live webhooks require a paid OpenSign plan, so this app polls
// `getDocumentStatus` on demand instead of relying on a webhook. Once you
// have a real API token, test `createSignatureRequest` against the sandbox
// (https://sandbox.opensignlabs.com/api/v1.2) and adjust field names here if
// OpenSign's actual schema differs.

export type OpenSignSigner = { name: string; email: string };

export type CreateSignatureRequestResult = {
  documentId: string;
};

export type DocumentStatus = {
  completed: boolean;
  fileUrl?: string;
  signedEmails: string[];
};

function baseUrl(env: any): string {
  return env.OPENSIGN_BASE_URL || 'https://app.opensignlabs.com/api/v1.2';
}

function headers(env: any): Record<string, string> {
  return {
    'x-api-token': env.OPENSIGN_API_TOKEN,
    'Content-Type': 'application/json',
  };
}

export async function createSignatureRequest(
  env: any,
  opts: { title: string; note?: string; fileBytes: ArrayBuffer; fileName: string; signers: OpenSignSigner[] }
): Promise<CreateSignatureRequestResult> {
  const base64 = arrayBufferToBase64(opts.fileBytes);
  const contentType = opts.fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';

  const res = await fetch(`${baseUrl(env)}/createdocument`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify({
      title: opts.title,
      note: opts.note ?? 'Please review and sign this document.',
      file: `data:${contentType};base64,${base64}`,
      signers: opts.signers.map(s => ({ name: s.name, email: s.email })),
      sendMail: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenSign createdocument failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as any;
  const documentId = data.objectId ?? data.documentId ?? data.id;
  if (!documentId) throw new Error('OpenSign createdocument response missing document id');

  return { documentId };
}

export async function getDocumentStatus(env: any, documentId: string): Promise<DocumentStatus> {
  const res = await fetch(`${baseUrl(env)}/getdocument?documentId=${encodeURIComponent(documentId)}`, {
    method: 'GET',
    headers: headers(env),
  });

  if (!res.ok) {
    throw new Error(`OpenSign getdocument failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as any;
  const status = String(data.status ?? data.event ?? '').toLowerCase();
  const signers = (data.signers ?? []) as Array<{ email: string; status?: string }>;

  return {
    completed: status === 'completed' || status === 'complete',
    fileUrl: data.file ?? data.signedUrl,
    signedEmails: signers.filter(s => (s.status ?? '').toLowerCase() === 'signed').map(s => s.email),
  };
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
