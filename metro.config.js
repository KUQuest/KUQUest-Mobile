const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Gradle deletes and recreates these generated trees; Metro must not watch them.
config.resolver.blockList.push(/[\\/]android[\\/]build(?:[\\/].*)?$/);

module.exports = withNativewind(config, {
  globalClassNamePolyfill: false,
  inlineVariables: {
    exclude: [
      "--color-ku-primary",
      "--color-ku-primary-dark",
      "--color-ku-primary-deep",
      "--color-ku-primary-subtle",
      "--color-ku-primary-border",
      "--color-ku-surface-accent",
      "--color-ku-border-accent",
      "--color-ku-on-primary",
    ],
  },
});
