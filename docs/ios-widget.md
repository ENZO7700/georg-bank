# iOS Home Screen Widget (Phase 0 + 1)

Universal George / Pohyby WidgetKit extension sharing data with the Capacitor app via App Group.

## What this delivers

- **App Group** `group.com.george.pwa` (entitlements on App + Widget)
- **Widget Extension** `GeorgeWidgetExtension` (`com.george.pwa.widget`) — `systemSmall` + `systemMedium`
- **Capacitor plugin** `WidgetBridge` (`writeSnapshot` / `readSnapshot` / `reloadAllTimelines`)
- **Shared model** `WidgetSnapshot` v1 (TS + Swift), key `widget.snapshot.v1`
- **Web sync** from `/pohyby` and `/dashboard2` after successful `/api/transactions` (no-op on pure web)
- Deep link scheme `george://pohyby` (widget tap → open app → navigate to `/pohyby`)

## Open in Xcode

```bash
npm run cap:ios:open
# or
npx cap open ios
```

Project: `ios/App/App.xcodeproj`

Targets:

| Target | Bundle ID |
|--------|-----------|
| App | `com.george.pwa` |
| GeorgeWidgetExtension | `com.george.pwa.widget` |

## Manual steps (signing + App Group)

File-level entitlements are already present:

- `ios/App/App/App.entitlements`
- `ios/App/GeorgeWidget/GeorgeWidget.entitlements`

You still need an **Apple Developer** team:

1. Select the **App** target → Signing & Capabilities → choose your Team.
2. Confirm **App Groups** capability includes `group.com.george.pwa` (add capability in Xcode if the portal has not provisioned it yet).
3. Select **GeorgeWidgetExtension** → same Team + same App Group.
4. Ensure both targets use **Automatic** signing (or matching provisioning profiles that include the App Group).

Without a registered App Group on the developer portal, UserDefaults suite reads/writes may silently fail and the widget will show the placeholder snapshot.

## Run on Simulator

1. Start the Next.js app (Capacitor `server.url` points at `http://localhost:3030`):

   ```bash
   npm run dev
   ```

2. In Xcode, pick an iPhone simulator → Run **App** (not the widget target alone).
3. Open `/pohyby` or `/dashboard2` inside the app so the bridge writes a snapshot.
4. Add the widget:
   - Long-press Home Screen → **+** → search **George** / **George Pohyby**
   - Add the **medium** (or small) size
5. Tap the widget → app should open and navigate to `/pohyby`.

### Widget-only preview

Scheme → **GeorgeWidgetExtension** → Run, then pick a host app when prompted (choose **App**).

## Layout of native code

```
ios/App/
  App/
    AppDelegate.swift          # george:// deep link → /pohyby
    WidgetBridgePlugin.swift   # Capacitor bridge
    App.entitlements
  Shared/
    AppGroupConstants.swift
    WidgetSnapshot.swift
  GeorgeWidget/
    GeorgeWidgetBundle.swift
    GeorgeWidget.swift
    Info.plist
    GeorgeWidget.entitlements
```

Web:

```
lib/widget/
  types.ts
  build-snapshot.ts
  widget-bridge.ts
  index.ts
```

## Notes / blockers

- **Capacitor 6.2.1** (`@capacitor/core` / `ios` / `android`); CLI in repo is newer but runtime is 6.x.
- Pure Safari / PWA: widget sync is a no-op (`Capacitor.isNativePlatform()`).
- Settings UI, APNs, lock-screen families, and Intent configuration are **out of scope** for Phase 1.
- If Xcode complains the widget target is missing after a `cap sync`, re-check `project.pbxproj` was not overwritten (Capacitor usually leaves custom targets alone, but verify).
