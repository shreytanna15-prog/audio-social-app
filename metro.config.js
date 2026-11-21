const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const onnxCommonCjs = path.resolve(
  __dirname,
  'node_modules/onnxruntime-common/dist/cjs/index.js',
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'onnxruntime-common') {
    return {
      filePath: onnxCommonCjs,
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativewind(config, {
  input: './src/global.css',
  inlineRem: 16,
});
