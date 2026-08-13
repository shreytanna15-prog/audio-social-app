require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
superpowered_root = File.expand_path('../../../native/superpowered', __dir__)
signalsmith_stretch_root = File.expand_path('../../../native/signalsmith-stretch', __dir__)
signalsmith_linear_root = File.expand_path('../../../native/signalsmith-linear', __dir__)

Pod::Spec.new do |s|
  s.name           = 'SuperpoweredAudio'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = 'audio-social-media-app'
  s.homepage       = 'https://github.com/local/superpowered-audio'
  s.platforms      = {
    :ios => '15.1',
  }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = [
    '**/*.{h,m,mm,swift}',
    '../cpp/SuperpoweredPolish.{h,cpp}',
    '../cpp/SuperpoweredEffects.{h,cpp}',
    '../cpp/PitchYin.{h,cpp}',
    '../cpp/MelodyRetune.{h,cpp}',
    '../cpp/SpectralClean.{h,cpp}',
    '../cpp/SpectralGate.{h,cpp}',
  ]
  s.public_header_files = 'SuperpoweredPolishBridge.h'

  s.frameworks = 'AVFoundation', 'AudioToolbox', 'UIKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    'HEADER_SEARCH_PATHS' => "\"#{superpowered_root}/include\" \"#{signalsmith_stretch_root}\" \"#{signalsmith_linear_root}/include\" \"$(PODS_TARGET_SRCROOT)/../cpp\"",
    'SWIFT_OBJC_BRIDGING_HEADER' => '$(PODS_TARGET_SRCROOT)/SuperpoweredAudio-Bridging-Header.h',
    'OTHER_CFLAGS' => '$(inherited) -O2',
  }

  s.vendored_frameworks = "#{superpowered_root}/ios/libSuperpoweredAudio.xcframework"
  s.libraries = 'c++'
end
