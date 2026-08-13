cmake_minimum_required(VERSION 3.13.0)

project(superpowered-polish)

# modules/superpowered-audio/android → repo root (works for modules/ and node_modules/ symlink)
get_filename_component(MODULE_ANDROID_DIR "${CMAKE_CURRENT_SOURCE_DIR}" ABSOLUTE)
get_filename_component(REPO_ROOT "${MODULE_ANDROID_DIR}/../../.." ABSOLUTE)
set(SUPERPOWERED_DIR "${REPO_ROOT}/native/superpowered")
set(SIGNALSMITH_STRETCH_DIR "${REPO_ROOT}/native/signalsmith-stretch")
set(SIGNALSMITH_LINEAR_DIR "${REPO_ROOT}/native/signalsmith-linear")
set(MODULE_CPP_DIR "${MODULE_ANDROID_DIR}/../cpp")

if(NOT EXISTS "${SUPERPOWERED_DIR}/include/Superpowered.h")
  message(FATAL_ERROR "Superpowered SDK not found at ${SUPERPOWERED_DIR}. See native/superpowered/README.md")
endif()
if(NOT EXISTS "${SIGNALSMITH_STRETCH_DIR}/signalsmith-stretch.h")
  message(FATAL_ERROR "Signalsmith Stretch not found at ${SIGNALSMITH_STRETCH_DIR}")
endif()

include_directories(
  ${MODULE_CPP_DIR}
  ${SUPERPOWERED_DIR}/include
  ${SIGNALSMITH_STRETCH_DIR}
  ${SIGNALSMITH_LINEAR_DIR}/include
)

add_library(
  superpowered-polish
  SHARED
  ${MODULE_CPP_DIR}/SuperpoweredPolish.cpp
  ${MODULE_CPP_DIR}/SuperpoweredEffects.cpp
  ${MODULE_CPP_DIR}/PitchYin.cpp
  ${MODULE_CPP_DIR}/MelodyRetune.cpp
  ${MODULE_CPP_DIR}/SpectralClean.cpp
  ${MODULE_CPP_DIR}/SpectralGate.cpp
  ${MODULE_CPP_DIR}/SuperpoweredPolishJNI.cpp
)

# Signalsmith Stretch is ~10x slower without optimisation.
set_source_files_properties(
  ${MODULE_CPP_DIR}/MelodyRetune.cpp
  PROPERTIES COMPILE_FLAGS "-O2"
)

find_library(log-lib log)
find_library(android-lib android)

target_link_libraries(
  superpowered-polish
  ${log-lib}
  ${android-lib}
  ${SUPERPOWERED_DIR}/android/libSuperpoweredAndroid${ANDROID_ABI}.a
)
