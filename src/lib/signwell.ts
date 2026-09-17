// SignWell API client — https://developers.signwell.com
// Free tier: up to 25 documents/month. Auth via X-Api-Key header.
//
// NOTE: live webhooks may require a paid plan depending on your SignWell
// plan, so this app polls `getDocumentStatus` on demand (a "Check Status"
// button) instead of relying on a webhook.

export type Signer = { name: string; email: string };

export type CreateSignatureRequestResult = {
  documentId: string;
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

export async function createSignatureRequest(
  env: any,
  opts: { title: string; fileBytes: ArrayBuffer; fileName: string; signers: Signer[] }
): Promise<CreateSignatureRequestResult> {
  const base64 = arrayBufferToBase64(opts.fileBytes);
  const recipients = opts.signers.map((s, i) => ({ id: String(i + 1), name: s.name, email: s.email }));

  // One signature field per signer, stacked on page 1. Reposition once you
  // see how it lands on your actual documents.
  const fields = [
    recipients.map((r, i) => ({
      x: 40,
      y: 680 - i * 40,
      page: 1,
      recipient_id: r.id,
      type: 'signature',
      required: true,
    })),
  ];

  const res = await fetch(`${BASE_URL}/documents`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify({
      test_mode: env.SIGNWELL_TEST_MODE === 'true',
      name: opts.title,
      files: [{ name: opts.fileName, file_base64: base64 }],
      recipients,
      fields,
      draft: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`SignWell create document failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as any;
  if (!data.id) throw new Error('SignWell create document response missing id');

  return { documentId: data.id };
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
