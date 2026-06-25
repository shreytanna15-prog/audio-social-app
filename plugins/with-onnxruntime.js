const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  createRunOncePlugin,
  withAppBuildGradle,
  withMainApplication,
  withSettingsGradle,
  withDangerousMod,
} = require('@expo/config-plugins');
const generateCode = require('@expo/config-plugins/build/utils/generateCode');

function withAndroidLocalProperties(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const localPropertiesPath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'local.properties',
      );

      if (fs.existsSync(localPropertiesPath)) {
        return modConfig;
      }

      const sdkDir =
        process.env.ANDROID_HOME ||
        process.env.ANDROID_SDK_ROOT ||
        path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');

      if (!fs.existsSync(sdkDir)) {
        console.warn(
          `[with-onnxruntime] Android SDK not found at "${sdkDir}". Set ANDROID_HOME or create android/local.properties manually.`,
        );
        return modConfig;
      }

      const escapedSdkDir = sdkDir.replace(/\\/g, '\\\\');
      fs.writeFileSync(localPropertiesPath, `sdk.dir=${escapedSdkDir}\n`);
      return modConfig;
    },
  ]);
}

function withOnnxRuntimeSettingsGradle(config) {
  return withSettingsGradle(config, (settingsGradleConfig) => {
    if (settingsGradleConfig.modResults.language !== 'groovy') {
      return settingsGradleConfig;
    }

    if (settingsGradleConfig.modResults.contents.includes("':onnxruntime-react-native'")) {
      return settingsGradleConfig;
    }

    settingsGradleConfig.modResults.contents = generateCode.mergeContents({
      src: settingsGradleConfig.modResults.contents,
      newSrc: [
        "include ':onnxruntime-react-native'",
        "project(':onnxruntime-react-native').projectDir = new File(rootDir, '../node_modules/onnxruntime-react-native/android')",
      ].join('\n'),
      tag: 'onnxruntime-react-native',
      anchor: /include ':app'/,
      offset: 1,
      comment: '// onnxruntime-react-native',
    }).contents;

    return settingsGradleConfig;
  });
}

function withOnnxRuntimeGradle(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (gradleConfig.modResults.language !== 'groovy') {
      return gradleConfig;
    }

    gradleConfig.modResults.contents = generateCode.mergeContents({
      src: gradleConfig.modResults.contents,
      newSrc: "    implementation project(':onnxruntime-react-native')",
      tag: 'onnxruntime-react-native',
      anchor: /^dependencies[ \t]*\{$/,
      offset: 1,
      comment: '    // onnxruntime-react-native',
    }).contents;

    return gradleConfig;
  });
}

function withOnnxRuntimeMainApplication(config) {
  return withMainApplication(config, (mainApplicationConfig) => {
    let contents = mainApplicationConfig.modResults.contents;

    if (!contents.includes('OnnxruntimePackage')) {
      contents = contents.replace(
        /import expo.modules.ExpoReactHostFactory/,
        'import ai.onnxruntime.reactnative.OnnxruntimePackage\nimport expo.modules.ExpoReactHostFactory',
      );

      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply \{/,
        'PackageList(this).packages.apply {\n          add(OnnxruntimePackage())',
      );
    }

    mainApplicationConfig.modResults.contents = contents;
    return mainApplicationConfig;
  });
}

function withOnnxRuntime(config) {
  config = withAndroidLocalProperties(config);
  config = withOnnxRuntimeSettingsGradle(config);
  config = withOnnxRuntimeGradle(config);
  config = withOnnxRuntimeMainApplication(config);
  return config;
}

module.exports = createRunOncePlugin(withOnnxRuntime, 'with-onnxruntime', '1.0.0');
