Pod::Spec.new do |s|
  s.name           = 'InputMonitor'
  s.version        = '0.1.0'
  s.summary        = 'Headset route detection for studio input monitoring'
  s.description    = 'Expo module that reports whether headphones or a headset route is active'
  s.license        = 'UNLICENSED'
  s.author         = 'VibeOGram'
  s.homepage       = 'https://github.com/ShreyTanna29/audio-social-media-app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
end
