const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, {
  // Keep className support at the explicit src/tw wrapper boundary.
  inlineVariables: false,
  globalClassNamePolyfill: false,
});
