const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Gradle deletes and recreates these generated trees; Metro must not watch them.
config.resolver.blockList.push(/[\\/]android[\\/]build(?:[\\/].*)?$/);

// babel-preset-expo inlines EXPO_PUBLIC_* into cached transforms, but Metro's cache key
// ignores their values, and Expo drops Gradle's --reset-cache when CI is set. Key the cache
// on them so builds with different values on one runner can't reuse each other's output.
config.cacheVersion = JSON.stringify([
  config.cacheVersion,
  ...Object.entries(process.env)
    .filter(([name]) => name.startsWith("EXPO_PUBLIC_"))
    .sort(([a], [b]) => a.localeCompare(b)),
]);

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
