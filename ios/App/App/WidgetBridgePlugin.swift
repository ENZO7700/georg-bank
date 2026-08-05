import Foundation
import Capacitor
import WidgetKit

@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "writeSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "reloadAllTimelines", returnType: CAPPluginReturnPromise),
    ]

    @objc func writeSnapshot(_ call: CAPPluginCall) {
        do {
            let snapshotDict: JSObject
            if let nested = call.getObject("snapshot") {
                snapshotDict = nested
            } else if let raw = call.options as? JSObject, raw["version"] != nil {
                snapshotDict = raw
            } else {
                call.reject("Missing snapshot payload")
                return
            }

            let data = try JSONSerialization.data(withJSONObject: snapshotDict, options: [])
            let snapshot = try JSONDecoder().decode(WidgetSnapshot.self, from: data)
            try WidgetSnapshotStore.save(snapshot)

            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
            call.resolve()
        } catch {
            call.reject("Failed to write snapshot: \(error.localizedDescription)")
        }
    }

    @objc func readSnapshot(_ call: CAPPluginCall) {
        guard let snapshot = WidgetSnapshotStore.load() else {
            call.resolve(["snapshot": NSNull()])
            return
        }
        do {
            let data = try JSONEncoder().encode(snapshot)
            let obj = try JSONSerialization.jsonObject(with: data, options: [])
            call.resolve(["snapshot": obj])
        } catch {
            call.reject("Failed to read snapshot: \(error.localizedDescription)")
        }
    }

    @objc func reloadAllTimelines(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve()
    }
}
