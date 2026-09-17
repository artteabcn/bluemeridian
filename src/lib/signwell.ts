// SignWell API client — https://developers.signwell.com
// Free tier: up to 25 documents/month. Auth via X-Api-Key header.
//
// NOTE: live webhooks may require a paid plan depending on your SignWell
// plan, so this app polls `getDocumentStatus` on demand (a "Check Status"
// button) instead of relying on a webhook.

export type Signer = { name: string; email: string };

export type CreateDraftResult = {
  documentId: string;
  embeddedEditUrl: string;
};

export type DocumentStatus = {
  completed: boolean;
  declined: boolean;
  signedEmails: string[];
};

const BASE_URL = 'https://www.signwell.com/api/v1';

function headers(env: any): Record<string, string> {
  return {
    'X-Api-Key': env.SIGNWELL_API_KEY,
    'Content-Type': 'application/json',
  };
}

// Creates the document as a draft (not sent yet) with no fields placed.
// SignWell returns an `embedded_edit_url` for a draft document — load that
// in their own embedded editor (SignWellEmbed JS) so a human drags each
// signature field onto the actual rendered PDF, per document, instead of
// us guessing pixel coordinates blind. The document is only actually sent
// once the sender clicks Send inside that embedded editor.
export async function createDraftSignatureRequest(
  env: any,
  opts: { title: string; fileBytes: ArrayBuffer; fileName: string; signers: Signer[] }
): Promise<CreateDraftResult> {
  const base64 = arrayBufferToBase64(opts.fileBytes);
  const recipients = opts.signers.map((s, i) => ({ id: String(i + 1), name: s.name, email: s.email }));

  const res = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify({
      test_mode: env.SIGNWELL_TEST_MODE === 'true',
      name: opts.title,
      files: [{ name: opts.fileName, file_base64: base64 }],
      recipients,
      draft: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`SignWell create draft failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as any;
  if (!data.id || !data.embedded_edit_url) {
    throw new Error('SignWell draft response missing id or embedded_edit_url');
  }

  return { documentId: data.id, embeddedEditUrl: data.embedded_edit_url };
}

export async function getDocumentStatus(env: any, documentId: string): Promise<DocumentStatus> {
  const res = await fetch(`${BASE_URL}/documents/${documentId}`, {
    method: 'GET',
    headers: headers(env),
  });

  if (!res.ok) {
    throw new Error(`SignWell get document failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as any;
  const status = String(data.status ?? '').toLowerCase();
  const recipients = (data.recipients ?? []) as Array<{ email: string; status?: string }>;

  return {
    completed: status === 'completed',
    declined: status === 'declined',
    signedEmails: recipients.filter(r => (r.status ?? '').toLowerCase() === 'signed').map(r => r.email),
  };
}

export async function downloadCompletedPdf(env: any, documentId: string): Promise<ArrayBuffer> {
  const res = await fetch(`${BASE_URL}/documents/${documentId}/completed_pdf`, {
    method: 'GET',
    headers: headers(env),
  });

  if (!res.ok) {
    throw new Error(`SignWell completed_pdf failed: ${res.status} ${await res.text()}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json() as any;
    const b64 = data.file_base64 ?? data.pdf ?? data.file;
    if (!b64) throw new Error('SignWell completed_pdf response missing file data');
    return base64ToArrayBuffer(b64);
  }

  return res.arrayBuffer();
}

export async function deleteDocument(env: any, documentId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/documents/${documentId}`, {
    method: 'DELETE',
    headers: headers(env),
  });

  // 404 just means it's already gone on SignWell's side — fine to proceed.
  if (!res.ok && res.status !== 404) {
    throw new Error(`SignWell delete document failed: ${res.status} ${await res.text()}`);
  }
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
