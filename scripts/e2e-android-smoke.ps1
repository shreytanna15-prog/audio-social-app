# Adb + Maestro smoke for Follow + Search.
# Prerequisites:
#   - Pixel_7 emulator running
#   - Metro on :8081 (`npx expo start` / expo run:android)
#   - JAVA_HOME set to Android Studio JBR
$ErrorActionPreference = "Stop"
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$adb = Join-Path $sdk "platform-tools\adb.exe"
$maestro = "$env:LOCALAPPDATA\maestro\maestro\bin\maestro.bat"
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED = "true"
$env:Path = "$env:JAVA_HOME\bin;$sdk\platform-tools;$env:Path"

Write-Host "==> adb reverse Metro"
& $adb reverse tcp:8081 tcp:8081

Write-Host "==> Maestro search flow"
& $maestro test (Join-Path $PSScriptRoot "..\e2e\maestro\search-follow.yaml")
Write-Host "Smoke complete." -ForegroundColor Green
