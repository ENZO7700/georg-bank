#!/bin/bash
set -e

APP_NAME="George"
APP_DIR="$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "🚀 Vytváram štruktúru Mac aplikácie ($APP_NAME.app)..."
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

echo "📝 Generujem Swift zdrojový kód (WKWebView)..."
cat << 'EOF' > main.swift
import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Získame veľkosť obrazovky
        let screenRect = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1280, height: 800)
        let windowWidth: CGFloat = 1100
        let windowHeight: CGFloat = 800
        
        // Vycentrujeme okno
        let windowRect = NSRect(
            x: screenRect.midX - windowWidth/2,
            y: screenRect.midY - windowHeight/2,
            width: windowWidth,
            height: windowHeight
        )
        
        window = NSWindow(
            contentRect: windowRect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "George"
        window.isReleasedWhenClosed = false
        
        let webConfiguration = WKWebViewConfiguration()
        webView = WKWebView(frame: windowRect, configuration: webConfiguration)
        webView.navigationDelegate = self
        window.contentView = webView
        
        // Načítanie nášho lokálneho Next.js PWA servera
        if let url = URL(string: "http://localhost:3030") {
            webView.load(URLRequest(url: url))
        }
        
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
EOF

echo "📝 Generujem Info.plist..."
cat << EOF > "$CONTENTS_DIR/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>sk.slsp.george</string>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

echo "🔨 Kompilujem Swift kód do natívneho Mac binárneho súboru..."
swiftc main.swift -o "$MACOS_DIR/$APP_NAME"
rm main.swift

echo "🎨 Vytváram .icns Mac ikonu z assets/icon.png..."
ICONSET_DIR="AppIcon.iconset"
mkdir -p "$ICONSET_DIR"

# Sips nareže PNG na požadované Apple veľkosti
sips -z 16 16     assets/icon.png --out "$ICONSET_DIR/icon_16x16.png" > /dev/null
sips -z 32 32     assets/icon.png --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null
sips -z 32 32     assets/icon.png --out "$ICONSET_DIR/icon_32x32.png" > /dev/null
sips -z 64 64     assets/icon.png --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null
sips -z 128 128   assets/icon.png --out "$ICONSET_DIR/icon_128x128.png" > /dev/null
sips -z 256 256   assets/icon.png --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null
sips -z 256 256   assets/icon.png --out "$ICONSET_DIR/icon_256x256.png" > /dev/null
sips -z 512 512   assets/icon.png --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null
sips -z 512 512   assets/icon.png --out "$ICONSET_DIR/icon_512x512.png" > /dev/null
sips -z 1024 1024 assets/icon.png --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null

# Skonvertuje sadu png na icns
iconutil -c icns "$ICONSET_DIR" -o "$RESOURCES_DIR/AppIcon.icns"
rm -rf "$ICONSET_DIR"

echo "✅ HOTOVO! Tvoja Mac aplikácia 'George.app' bola úspešne vygenerovaná!"
echo "📍 Nájdeš ju v tomto priečinku. Stačí na ňu 2x kliknúť."
