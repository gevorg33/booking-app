import Foundation
import Capacitor
import WidgetKit

enum WidgetSharedStore {
    static let appGroup = "group.com.optischedule.consumer"
    static let snapshotKey = "home_screen_widget_snapshot"

    static var defaults: UserDefaults? {
        UserDefaults(suiteName: appGroup)
    }

    static func saveSnapshotJson(_ json: String) {
        defaults?.set(json, forKey: snapshotKey)
        defaults?.synchronize()
    }
}

@objc(HomeScreenWidgetPlugin)
public class HomeScreenWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HomeScreenWidgetPlugin"
    public let jsName = "HomeScreenWidget"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "syncSnapshot", returnType: CAPPluginReturnPromise)
    ]

    @objc func syncSnapshot(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("Missing json payload")
            return
        }
        WidgetSharedStore.saveSnapshotJson(json)
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        call.resolve()
    }
}
