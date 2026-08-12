describe('loadNativeGoogleSignin', () => {
  test('returns null when the current binary does not contain RNGoogleSignin', () => {
    jest.isolateModules(() => {
      jest.doMock('@react-native-google-signin/google-signin', () => {
        throw new Error('RNGoogleSignin could not be found');
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadNativeGoogleSignin } = require('../nativeGoogleSignin') as typeof import('../nativeGoogleSignin');

      expect(loadNativeGoogleSignin()).toBeNull();
    });
  });
});
