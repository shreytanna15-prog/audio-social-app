import ExpoModulesCore

private final class EmptyLicenseKeyException: Exception {
  override var reason: String = "Superpowered license key is empty."
  override var code: String = "E_SUPERPOWERED_EMPTY_KEY"
}

private final class NotInitializedException: Exception {
  override var reason: String = "Call SuperpoweredAudio.init(licenseKey) before processFile."
  override var code: String = "E_SUPERPOWERED_NOT_INITIALIZED"
}

private final class ProcessFailedException: Exception {
  private let detail: String

  init(_ detail: String) {
    self.detail = detail
  }

  override var reason: String {
    detail
  }

  override var code: String {
    "E_SUPERPOWERED_PROCESS_FAILED"
  }
}

public class SuperpoweredAudioModule: Module {
  private var initialized = false

  public func definition() -> ModuleDefinition {
    Name("SuperpoweredAudio")

    Function("isAvailable") { () -> Bool in
      return true
    }

    Function("init") { (key: String) -> Bool in
      if key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
        throw EmptyLicenseKeyException()
      }

      var error: NSError?
      let ok = SuperpoweredPolishBridge.initialize(withLicenseKey: key, error: &error)
      self.initialized = ok
      if !ok {
        throw ProcessFailedException(error?.localizedDescription ?? "Superpowered initialize failed.")
      }
      return true
    }

    AsyncFunction("processFile") { (inputUri: String, outputUri: String, options: [String: Any]) -> [String: String] in
      guard self.initialized else {
        throw NotInitializedException()
      }

      let preset = (options["preset"] as? String) ?? "speech-polish"
      var error: NSError?
      guard let strategy = SuperpoweredPolishBridge.processFile(
        atPath: inputUri,
        outputWavPath: outputUri,
        preset: preset,
        error: &error
      ) else {
        throw ProcessFailedException(error?.localizedDescription ?? "Superpowered polish failed.")
      }

      return [
        "outputUri": outputUri,
        "strategy": strategy,
      ]
    }

    AsyncFunction("spectralCleanProcessFile") { (inputUri: String, outputUri: String) -> [String: String] in
      guard self.initialized else {
        throw NotInitializedException()
      }

      var error: NSError?
      guard let stats = SuperpoweredPolishBridge.spectralCleanFile(
        atPath: inputUri,
        outputWavPath: outputUri,
        error: &error
      ) else {
        throw ProcessFailedException(error?.localizedDescription ?? "Spectral clean failed.")
      }

      var strategy = "interference-soften"
      if let range = stats.range(of: "strategy=") {
        let after = stats[range.upperBound...]
        strategy = String(after.split(separator: " ").first ?? Substring("interference-soften"))
      }

      return [
        "outputUri": outputUri,
        "strategy": strategy,
        "params": stats,
      ]
    }

    AsyncFunction("processEffectsFile") { (inputUri: String, outputUri: String, effectsJson: String) -> [String: String] in
      guard self.initialized else {
        throw NotInitializedException()
      }

      var error: NSError?
      guard let strategy = SuperpoweredPolishBridge.processEffectsFile(
        atPath: inputUri,
        outputWavPath: outputUri,
        effectsJson: effectsJson,
        error: &error
      ) else {
        throw ProcessFailedException(error?.localizedDescription ?? "Superpowered effects failed.")
      }

      return [
        "outputUri": outputUri,
        "strategy": strategy,
      ]
    }
  }
}
