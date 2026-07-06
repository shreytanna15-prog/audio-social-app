const { createRunOncePlugin, withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');
const generateCode = require('@expo/config-plugins/build/utils/generateCode');

const NODE_HEAP_MB = '8192';

function upsertGradleProperty(properties, key, value) {
  const existing = properties.find((entry) => entry.type === 'property' && entry.key === key);

  if (existing) {
    existing.value = value;
    return;
  }

  properties.push({
    type: 'property',
    key,
    value,
  });
}

function withAndroidReleaseGradleProperties(config) {
  return withGradleProperties(config, (gradleConfig) => {
    upsertGradleProperty(
      gradleConfig.modResults,
      'org.gradle.jvmargs',
      '-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8',
    );

    return gradleConfig;
  });
}

function withAndroidReleaseAppBuildGradle(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      return gradleConfig;
    }

    let contents = gradleConfig.modResults.contents;

    if (!contents.includes('nodeExecutableAndArgs')) {
      contents = generateCode.mergeContents({
        src: contents,
        newSrc: `    nodeExecutableAndArgs = ["node", "--max-old-space-size=${NODE_HEAP_MB}"]`,
        tag: 'release-node-heap',
        anchor: /react\s*\{/,
        offset: 1,
        comment: '    // release-node-heap',
      }).contents;
    }

    if (!contents.includes('hermesFlags = ["-O"]')) {
      contents = generateCode.mergeContents({
        src: contents,
        newSrc: '    hermesFlags = ["-O"]',
        tag: 'release-hermes-flags',
        anchor: /bundleCommand\s*=\s*"export:embed"/,
        offset: 1,
        comment: '    // release-hermes-flags',
      }).contents;
    }

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });
}

function withAndroidReleaseBuild(config) {
  config = withAndroidReleaseGradleProperties(config);
  config = withAndroidReleaseAppBuildGradle(config);
  return config;
}

module.exports = createRunOncePlugin(
  withAndroidReleaseBuild,
  'with-android-release-build',
  '1.0.0',
);
