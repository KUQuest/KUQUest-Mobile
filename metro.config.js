const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, {
  // Inline static theme values so native text styles resolve to numeric values.
  // A variable referenced exactly once is folded into its consumer, which would
  // make it unreachable from `RoleAccentProvider`, so the accent tokens opt out.
  inlineVariables: {
    exclude: [
      "--color-ku-primary",
      "--color-ku-primary-dark",
      "--color-ku-primary-deep",
      "--color-ku-surface-accent",
      "--color-ku-border-accent",
      "--color-ku-on-primary",
    ],
  },
  globalClassNamePolyfill: false,
});
