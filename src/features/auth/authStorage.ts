export const AUTH_STORAGE_PREFIX = 'kuquest';
export const AUTH_COOKIE_STORAGE_KEY = `${AUTH_STORAGE_PREFIX}_cookie`;
export const AUTH_SESSION_CACHE_STORAGE_KEY = `${AUTH_STORAGE_PREFIX}_session_data`;

const supportedCookieNames = new Set([
  'better-auth.session_token',
  '__Secure-better-auth.session_token',
  'better-auth.session_data',
  '__Secure-better-auth.session_data',
]);

type StoredCookie = {
  value: string;
  expires: null;
};

export function parseSessionCookieHeader(cookieHeader: string): Record<string, StoredCookie> {
  const cookies: Record<string, StoredCookie> = {};

  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex <= 0) continue;

    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (!supportedCookieNames.has(name) || !value) continue;

    cookies[name] = { value, expires: null };
  }

  if (!Object.keys(cookies).some((name) => name.endsWith('.session_token'))) {
    throw new Error('Cookie must contain a Better Auth session token');
  }

  return cookies;
}
