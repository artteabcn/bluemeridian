import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const lang = url.searchParams.get('lang') === 'fr' ? 'fr' : 'en';
  cookies.set('lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 });

  const returnTo = url.searchParams.get('returnTo') || '/';
  return redirect(returnTo.startsWith('/') ? returnTo : '/', 303);
};
