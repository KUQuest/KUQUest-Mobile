const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, {
  // Inline static theme values so native text styles resolve to numeric values.
  inlineVariables: true,
  globalClassNamePolyfill: false,
});
