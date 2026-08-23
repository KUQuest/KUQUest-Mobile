import { parseSessionCookieHeader } from '../authStorage';

describe('parseSessionCookieHeader', () => {
  test('stores a signed secure Better Auth session cookie', () => {
    expect(parseSessionCookieHeader(
      '__Secure-better-auth.session_token=signed.token.value==',
    )).toEqual({
      '__Secure-better-auth.session_token': {
        value: 'signed.token.value==',
        expires: null,
      },
    });
  });

  test('supports additional Better Auth cookies without exposing unrelated cookies', () => {
    expect(parseSessionCookieHeader(
      'tracking=ignored; better-auth.session_token=session; better-auth.session_data=data',
    )).toEqual({
      'better-auth.session_token': { value: 'session', expires: null },
      'better-auth.session_data': { value: 'data', expires: null },
    });
  });

  test('rejects a cookie without a Better Auth session token', () => {
    expect(() => parseSessionCookieHeader('tracking=value')).toThrow(
      'Cookie must contain a Better Auth session token',
    );
  });
});
