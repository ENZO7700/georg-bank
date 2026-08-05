import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        if let url = launchOptions?[.url] as? URL {
            storeDeepLink(from: url)
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            self.consumePendingDeepLinkIfNeeded()
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        storeDeepLink(from: url)
        consumePendingDeepLinkIfNeeded()
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    private func storeDeepLink(from url: URL) {
        guard url.scheme?.lowercased() == "george" else { return }
        // george://pohyby → host "pohyby"; george:///pohyby → path "/pohyby"
        let host = (url.host ?? "").trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let pathPart = url.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let joined = [host, pathPart].filter { !$0.isEmpty }.joined(separator: "/")
        let path = "/" + (joined.isEmpty ? "pohyby" : joined)
        UserDefaults.standard.set(path, forKey: AppGroupConstants.pendingDeepLinkKey)
        WidgetSnapshotStore.defaults()?.set(path, forKey: AppGroupConstants.pendingDeepLinkKey)
    }

    private func consumePendingDeepLinkIfNeeded() {
        let key = AppGroupConstants.pendingDeepLinkKey
        let path =
            UserDefaults.standard.string(forKey: key)
            ?? WidgetSnapshotStore.defaults()?.string(forKey: key)
        guard let path, !path.isEmpty else { return }
        UserDefaults.standard.removeObject(forKey: key)
        WidgetSnapshotStore.defaults()?.removeObject(forKey: key)

        guard let bridgeVC = window?.rootViewController as? CAPBridgeViewController,
              let bridge = bridgeVC.bridge else {
            // Retry once if the WebView is still booting.
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                self.navigateBridge(to: path)
            }
            return
        }
        _ = bridge
        navigateBridge(to: path)
    }

    private func navigateBridge(to path: String) {
        guard let bridgeVC = window?.rootViewController as? CAPBridgeViewController,
              let bridge = bridgeVC.bridge else { return }
        let escaped = path.replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
        bridge.eval(js: "window.location.href = '\(escaped)';")
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
