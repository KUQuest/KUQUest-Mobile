/* global describe, test, expect */

const { extractUserSessionCookie, buildSessionImportLink, parseArgs } = require('../switch-demo-account');

describe('switch-demo-account', () => {
  test('extracts the complete userSessionCookie from a Bruno environment', () => {
    expect(extractUserSessionCookie(`vars {
  userSessionCookie: __Secure-better-auth.session_token=signed.token==
}`)).toBe('__Secure-better-auth.session_token=signed.token==');
  });

  test('preserves multiple cookies while validating the session cookie', () => {
    expect(extractUserSessionCookie(`vars {
  userSessionCookie: __Secure-better-auth.session_token=session; better-auth.session_data=data
}`)).toBe('__Secure-better-auth.session_token=session; better-auth.session_data=data');
  });

  test('does not support a raw token without a cookie name', () => {
    expect(() => extractUserSessionCookie(`vars {
  userSessionCookie: raw-token
}`)).toThrow('must contain a Better Auth session token');
  });

  test('parses the cookie file and device flags', () => {
    expect(parseArgs([
      '--cookie-file', 'demo.bru',
      '--serial', 'emulator-5554',
      '--json',
    ])).toEqual({
      cookieFile: 'demo.bru',
      serial: 'emulator-5554',
      json: true,
    });
  });

  test('builds a filename-only handoff link', () => {
    const link = buildSessionImportLink('.kuquest-session-abc');

    expect(link).toBe('kuquestmobile-debug://dev/import-session?file=.kuquest-session-abc');
    expect(link).not.toContain('session_token');
  });
});
