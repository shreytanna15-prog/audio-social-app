package expo.modules.superpoweredaudio

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File

class ProcessOptions : Record {
  @Field
  var preset: String? = "speech-polish"

  @Field
  var sampleRate: Int? = 48000
}

private class EmptyLicenseKeyException :
  CodedException("E_SUPERPOWERED_EMPTY_KEY", "Superpowered license key is empty.", null)

private class NotInitializedException :
  CodedException(
    "E_SUPERPOWERED_NOT_INITIALIZED",
    "Call SuperpoweredAudio.init(licenseKey) before processFile.",
    null,
  )

private class ProcessFailedException(detail: String) :
  CodedException("E_SUPERPOWERED_PROCESS_FAILED", detail, null)

class SuperpoweredAudioModule : Module() {
  private var initialized = false

  companion object {
    init {
      System.loadLibrary("superpowered-polish")
    }
  }

  private external fun nativeInitialize(licenseKey: String): Boolean

  private external fun nativeProcessFile(
    inputUri: String,
    outputUri: String,
    preset: String,
  ): String

  private external fun nativeSpectralCleanProcessFile(
    inputUri: String,
    outputUri: String,
    intensity: String?,
  ): String

  private external fun nativeProcessEffectsFile(
    inputUri: String,
    outputUri: String,
    effectsJson: String,
  ): String

  override fun definition() = ModuleDefinition {
    Name("SuperpoweredAudio")

    Function("isAvailable") {
      true
    }

    Function("init") { key: String ->
      if (key.isBlank()) {
        throw EmptyLicenseKeyException()
      }

      val ok = nativeInitialize(key)
      initialized = ok
      if (!ok) {
        throw EmptyLicenseKeyException()
      }
      true
    }

    AsyncFunction("processFile") { inputUri: String, outputUri: String, options: ProcessOptions ->
      if (!initialized) {
        throw NotInitializedException()
      }

      val preset = options.preset ?: "speech-polish"
      val outputPath = stripFileScheme(outputUri)
      val parent = File(outputPath).parentFile
      if (parent != null && !parent.exists()) {
        parent.mkdirs()
      }

      try {
        val strategy = nativeProcessFile(inputUri, outputUri, preset)
        mapOf(
          "outputUri" to outputUri,
          "strategy" to strategy,
        )
      } catch (error: Exception) {
        throw ProcessFailedException(error.message ?: "Superpowered polish failed.")
      }
    }

    AsyncFunction("spectralCleanProcessFile") { inputUri: String, outputUri: String, intensity: String? ->
      if (!initialized) {
        throw NotInitializedException()
      }

      val outputPath = stripFileScheme(outputUri)
      val parent = File(outputPath).parentFile
      if (parent != null && !parent.exists()) {
        parent.mkdirs()
      }

      val resolvedIntensity = intensity?.takeIf { it.isNotBlank() } ?: "current"

      try {
        val stats = nativeSpectralCleanProcessFile(inputUri, outputUri, resolvedIntensity)
        val strategy = if (stats.contains("strategy=")) {
          Regex("""strategy=([^\s]+)""").find(stats)?.groupValues?.getOrNull(1)
            ?: "interference-soften"
        } else {
          "interference-soften"
        }
        mapOf(
          "outputUri" to outputUri,
          "strategy" to strategy,
          "params" to stats,
        )
      } catch (error: Exception) {
        throw ProcessFailedException(error.message ?: "Spectral clean failed.")
      }
    }

    AsyncFunction("processEffectsFile") { inputUri: String, outputUri: String, effectsJson: String ->
      if (!initialized) {
        throw NotInitializedException()
      }

      val outputPath = stripFileScheme(outputUri)
      val parent = File(outputPath).parentFile
      if (parent != null && !parent.exists()) {
        parent.mkdirs()
      }

      try {
        val strategy = nativeProcessEffectsFile(inputUri, outputUri, effectsJson)
        mapOf(
          "outputUri" to outputUri,
          "strategy" to strategy,
        )
      } catch (error: Exception) {
        throw ProcessFailedException(error.message ?: "Superpowered effects failed.")
      }
    }
  }

  private fun stripFileScheme(uri: String): String {
    return if (uri.startsWith("file://")) {
      uri.removePrefix("file://")
    } else {
      uri
    }
  }
}
