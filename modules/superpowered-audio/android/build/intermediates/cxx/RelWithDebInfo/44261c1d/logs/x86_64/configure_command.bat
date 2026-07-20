@echo off
"C:\\Users\\mauli\\AppData\\Local\\Android\\Sdk\\cmake\\3.22.1\\bin\\cmake.exe" ^
  "-HC:\\Feels Diffrent\\work\\audio-social-media-app\\modules\\superpowered-audio\\android" ^
  "-DCMAKE_SYSTEM_NAME=Android" ^
  "-DCMAKE_EXPORT_COMPILE_COMMANDS=ON" ^
  "-DCMAKE_SYSTEM_VERSION=24" ^
  "-DANDROID_PLATFORM=android-24" ^
  "-DANDROID_ABI=x86_64" ^
  "-DCMAKE_ANDROID_ARCH_ABI=x86_64" ^
  "-DANDROID_NDK=C:\\Users\\mauli\\AppData\\Local\\Android\\Sdk\\ndk\\27.0.12077973" ^
  "-DCMAKE_ANDROID_NDK=C:\\Users\\mauli\\AppData\\Local\\Android\\Sdk\\ndk\\27.0.12077973" ^
  "-DCMAKE_TOOLCHAIN_FILE=C:\\Users\\mauli\\AppData\\Local\\Android\\Sdk\\ndk\\27.0.12077973\\build\\cmake\\android.toolchain.cmake" ^
  "-DCMAKE_MAKE_PROGRAM=C:\\Users\\mauli\\AppData\\Local\\Android\\Sdk\\cmake\\3.22.1\\bin\\ninja.exe" ^
  "-DCMAKE_CXX_FLAGS=-std=c++17 -fexceptions -frtti" ^
  "-DCMAKE_LIBRARY_OUTPUT_DIRECTORY=C:\\Feels Diffrent\\work\\audio-social-media-app\\modules\\superpowered-audio\\android\\build\\intermediates\\cxx\\RelWithDebInfo\\44261c1d\\obj\\x86_64" ^
  "-DCMAKE_RUNTIME_OUTPUT_DIRECTORY=C:\\Feels Diffrent\\work\\audio-social-media-app\\modules\\superpowered-audio\\android\\build\\intermediates\\cxx\\RelWithDebInfo\\44261c1d\\obj\\x86_64" ^
  "-DCMAKE_BUILD_TYPE=RelWithDebInfo" ^
  "-BC:\\Feels Diffrent\\work\\audio-social-media-app\\modules\\superpowered-audio\\android\\.cxx\\RelWithDebInfo\\44261c1d\\x86_64" ^
  -GNinja ^
  "-DANDROID_STL=c++_shared"
