// Cloudflare Access sits in front of this app and injects the authenticated
// identity on every request once a policy is configured for the domain.
export function getAccessEmail(request: Request): string | null {
  return request.headers.get('Cf-Access-Authenticated-User-Email');
}
