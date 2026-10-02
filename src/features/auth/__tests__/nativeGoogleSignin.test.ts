describe("loadNativeGoogleSignin", () => {
  test("returns null when the current binary does not contain RNGoogleSignin", () => {
    jest.isolateModules(() => {
      jest.doMock("@react-native-google-signin/google-signin", () => {
        throw new Error("RNGoogleSignin could not be found");
      });

      const { loadNativeGoogleSignin } =
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("../nativeGoogleSignin") as typeof import("../nativeGoogleSignin");

      expect(loadNativeGoogleSignin()).toBeNull();
    });
  });
  test("returns null on web before loading the unsupported native implementation", () => {
    const mockConfigure = jest.fn(() => {
      throw new Error("RNGoogleSignIn: not implemented on web");
    });

    jest.isolateModules(() => {
      jest.doMock("react-native", () => ({
        Platform: { OS: "web" },
      }));
      jest.doMock("@react-native-google-signin/google-signin", () => ({
        GoogleSignin: {
          configure: mockConfigure,
          hasPlayServices: jest.fn(),
          signIn: jest.fn(),
          signOut: jest.fn(),
        },
        isSuccessResponse: jest.fn(),
      }));

      const { loadNativeGoogleSignin } =
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("../nativeGoogleSignin") as typeof import("../nativeGoogleSignin");

      expect(loadNativeGoogleSignin()).toBeNull();
      expect(mockConfigure).not.toHaveBeenCalled();
    });
  });
});
