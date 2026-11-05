package expo.modules.inputmonitor

import android.content.Context
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class InputMonitorModule : Module() {
  private var audioManager: AudioManager? = null
  private var deviceCallback: AudioDeviceCallback? = null

  override fun definition() = ModuleDefinition {
    Name("InputMonitor")

    Events("onRouteChange")

    OnCreate {
      val context = appContext.reactContext ?: return@OnCreate
      audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val callback = object : AudioDeviceCallback() {
          override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
            emitRouteChange()
          }

          override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
            emitRouteChange()
          }
        }
        deviceCallback = callback
        audioManager?.registerAudioDeviceCallback(callback, null)
      }
    }

    OnDestroy {
      val callback = deviceCallback
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && callback != null) {
        audioManager?.unregisterAudioDeviceCallback(callback)
      }
      deviceCallback = null
      audioManager = null
    }

    Function("isAvailable") {
      true
    }

    Function("isHeadsetConnected") {
      isHeadsetConnected()
    }

    Function("getRouteInfo") {
      mapOf(
        "connected" to isHeadsetConnected(),
        "routeLabel" to routeLabel(),
      )
    }
  }

  private fun emitRouteChange() {
    sendEvent(
      "onRouteChange",
      mapOf(
        "connected" to isHeadsetConnected(),
        "routeLabel" to routeLabel(),
      ),
    )
  }

  private fun isHeadsetConnected(): Boolean {
    val manager = audioManager ?: return false
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val devices = manager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
      return devices.any { device -> isHeadsetDeviceType(device.type) }
    }

    @Suppress("DEPRECATION")
    return manager.isWiredHeadsetOn || manager.isBluetoothA2dpOn || manager.isBluetoothScoOn
  }

  private fun isHeadsetDeviceType(type: Int): Boolean {
    return when (type) {
      AudioDeviceInfo.TYPE_WIRED_HEADSET,
      AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
      AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
      AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
      AudioDeviceInfo.TYPE_USB_HEADSET,
      AudioDeviceInfo.TYPE_USB_DEVICE,
      -> true
      else -> {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          type == AudioDeviceInfo.TYPE_BLE_HEADSET || type == AudioDeviceInfo.TYPE_BLE_SPEAKER
        } else {
          false
        }
      }
    }
  }

  private fun routeLabel(): String {
    val manager = audioManager ?: return "unknown"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val devices = manager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)
      val preferred = devices.firstOrNull { device -> isHeadsetDeviceType(device.type) }
      if (preferred != null) {
        return preferred.productName?.toString()?.ifBlank { preferred.type.toString() }
          ?: preferred.type.toString()
      }
    }
    return if (isHeadsetConnected()) "headphones" else "speaker"
  }
}
