import type { ConfigContext, ExpoConfig } from 'expo/config';

import configureApp from './app.config';

const baseConfig: ExpoConfig = {
  name: 'KUQuest',
  slug: 'KUQUest-Mobile',
  version: '1.0.0',
  android: { versionCode: 1 },
  ios: {},
};

function configure(variant?: string, versionCode?: string) {
  if (variant === undefined) {
    delete process.env.APP_VARIANT;
  } else {
    process.env.APP_VARIANT = variant;
  }
  if (versionCode === undefined) {
    delete process.env.ANDROID_VERSION_CODE;
  } else {
    process.env.ANDROID_VERSION_CODE = versionCode;
  }
  return configureApp({ config: baseConfig } as ConfigContext);
}

describe('app config variants', () => {
  afterEach(() => {
    delete process.env.APP_VARIANT;
    delete process.env.ANDROID_VERSION_CODE;
  });

  test('uses the coinstallable debug identity by default', () => {
    const config = configure();

    expect(config.name).toBe('KUQuest Debug');
    expect(config.scheme).toBe('kuquestmobile-debug');
    expect(config.android?.package).toBe('com.kuquest.mobile.debug');
    expect(config.ios?.bundleIdentifier).toBe('com.kuquest.mobile.debug');
    expect(config.android?.versionCode).toBe(1);
  });

  test('uses the CI build number for staging', () => {
    const config = configure('staging', '247');

    expect(config.name).toBe('KUQuest Staging');
    expect(config.scheme).toBe('kuquestmobile-staging');
    expect(config.android?.package).toBe('com.kuquest.mobile.staging');
    expect(config.android?.versionCode).toBe(247);
  });

  test('keeps the explicit app version code for production', () => {
    const config = configure('production', '999');

    expect(config.name).toBe('KUQuest');
    expect(config.scheme).toBe('kuquestmobile');
    expect(config.android?.package).toBe('com.kuquest.mobile');
    expect(config.android?.versionCode).toBe(1);
  });

  test('rejects invalid variants and staging version codes', () => {
    expect(() => configure('preview')).toThrow('APP_VARIANT must be debug, staging, or production');
    expect(() => configure('staging', '0')).toThrow('ANDROID_VERSION_CODE must be an integer');
  });
});
