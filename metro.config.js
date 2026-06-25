const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

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

module.exports = config;
