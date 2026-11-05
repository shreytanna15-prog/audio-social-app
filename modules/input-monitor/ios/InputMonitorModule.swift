import AVFoundation
import ExpoModulesCore

public class InputMonitorModule: Module {
  private var routeObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("InputMonitor")

    Events("onRouteChange")

    OnCreate {
      self.routeObserver = NotificationCenter.default.addObserver(
        forName: AVAudioSession.routeChangeNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.emitRouteChange()
      }
    }

    OnDestroy {
      if let routeObserver {
        NotificationCenter.default.removeObserver(routeObserver)
      }
      routeObserver = nil
    }

    Function("isAvailable") { () -> Bool in
      true
    }

    Function("isHeadsetConnected") { () -> Bool in
      Self.isHeadsetConnected()
    }

    Function("getRouteInfo") { () -> [String: Any] in
      [
        "connected": Self.isHeadsetConnected(),
        "routeLabel": Self.routeLabel(),
      ]
    }
  }

  private func emitRouteChange() {
    sendEvent("onRouteChange", [
      "connected": Self.isHeadsetConnected(),
      "routeLabel": Self.routeLabel(),
    ])
  }

  static func isHeadsetConnected() -> Bool {
    let outputs = AVAudioSession.sharedInstance().currentRoute.outputs
    for output in outputs {
      switch output.portType {
      case .headphones,
           .bluetoothA2DP,
           .bluetoothHFP,
           .bluetoothLE,
           .usbAudio,
           .carAudio,
           .airPlay:
        return true
      default:
        continue
      }
    }
    return false
  }

  static func routeLabel() -> String {
    let outputs = AVAudioSession.sharedInstance().currentRoute.outputs
    if let preferred = outputs.first(where: { output in
      switch output.portType {
      case .headphones, .bluetoothA2DP, .bluetoothHFP, .bluetoothLE, .usbAudio, .carAudio, .airPlay:
        return true
      default:
        return false
      }
    }) {
      return preferred.portName.isEmpty ? preferred.portType.rawValue : preferred.portName
    }
    return isHeadsetConnected() ? "headphones" : "speaker"
  }
}
