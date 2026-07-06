const fs = require('fs');
const path = require('path');

const onnxAndroidDir = path.join(
  __dirname,
  '..',
  'node_modules',
  'onnxruntime-react-native',
  'android',
);

const ONNXRUNTIME_ANDROID_VERSION = '1.24.3';
const expectedExtractDir = `onnxruntime-android-${ONNXRUNTIME_ANDROID_VERSION}.aar`;

function removeIfExists(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
}

function cleanOnnxRuntimeNativeCache() {
  if (!fs.existsSync(onnxAndroidDir)) {
    return;
  }

  removeIfExists(path.join(onnxAndroidDir, '.cxx'));

  const buildDir = path.join(onnxAndroidDir, 'build');
  if (!fs.existsSync(buildDir)) {
    return;
  }

  for (const entry of fs.readdirSync(buildDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (entry.name.startsWith('onnxruntime-android-') && entry.name !== expectedExtractDir) {
      removeIfExists(path.join(buildDir, entry.name));
    }
  }
}

cleanOnnxRuntimeNativeCache();
