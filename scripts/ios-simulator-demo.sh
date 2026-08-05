#!/usr/bin/env bash
# Boot preferred iPhone Simulator and run the Capacitor iOS app against local :3030.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PREFERRED_NAMES=(
  "iPhone 17 Pro"
  "iPhone Air"
  "iPhone 17"
  "iPhone 17 Pro Max"
)

if ! command -v xcrun >/dev/null 2>&1; then
  echo "Error: xcrun not found. Install Xcode + Command Line Tools." >&2
  exit 1
fi

if ! xcodebuild -version >/dev/null 2>&1; then
  echo "Error: Xcode is not available (xcodebuild failed)." >&2
  exit 1
fi

pick_simulator() {
  local available
  available="$(xcrun simctl list devices available 2>/dev/null || true)"
  if [[ -z "$available" ]]; then
    return 1
  fi

  local name
  for name in "${PREFERRED_NAMES[@]}"; do
    # Prefer the last matching line (usually newest runtime, e.g. iOS 26.5 over 26.4).
    local match
    match="$(printf '%s\n' "$available" | grep -F "$name (" | grep -v unavailable | tail -n 1 || true)"
    if [[ -n "$match" ]]; then
      local udid
      udid="$(printf '%s\n' "$match" | sed -nE 's/.*\(([0-9A-Fa-f-]{36})\).*/\1/p')"
      if [[ -n "$udid" ]]; then
        printf '%s\t%s\n' "$name" "$udid"
        return 0
      fi
    fi
  done
  return 1
}

SELECTION="$(pick_simulator || true)"
if [[ -z "$SELECTION" ]]; then
  echo "Error: No preferred iPhone Simulator found (tried: ${PREFERRED_NAMES[*]})." >&2
  echo "Install an iOS Simulator runtime in Xcode → Settings → Platforms." >&2
  exit 1
fi

DEVICE_NAME="${SELECTION%%$'\t'*}"
DEVICE_UDID="${SELECTION#*$'\t'}"

echo "Using simulator: $DEVICE_NAME ($DEVICE_UDID)"

STATE="$(xcrun simctl list devices | grep "$DEVICE_UDID" | sed -nE 's/.*\((Booted|Shutdown|Booting)\).*/\1/p' | head -n 1 || true)"
if [[ "$STATE" != "Booted" ]]; then
  echo "Booting $DEVICE_NAME..."
  xcrun simctl boot "$DEVICE_UDID" || true
fi

open -a Simulator --args -CurrentDeviceUDID "$DEVICE_UDID" >/dev/null 2>&1 || open -a Simulator

# Wait until the device reports Booted.
for _ in $(seq 1 60); do
  if xcrun simctl list devices | grep -F "$DEVICE_UDID" | grep -q '(Booted)'; then
    break
  fi
  sleep 1
done

# Capacitor server.url points at local Next.js (:3030). Warn if nothing is listening.
if command -v nc >/dev/null 2>&1; then
  if ! nc -z 127.0.0.1 3030 >/dev/null 2>&1; then
    echo "Warning: nothing is listening on :3030." >&2
    echo "Start the web app first: npm run dev" >&2
    echo "Continuing anyway — the native shell will launch, but the WebView may stay blank." >&2
  fi
fi

echo "Syncing Capacitor iOS..."
CAP_BIN="$ROOT/node_modules/.bin/cap"
if [[ ! -x "$CAP_BIN" ]]; then
  echo "Error: @capacitor/cli not found (missing $CAP_BIN)." >&2
  echo "Run: npm install" >&2
  exit 1
fi
"$CAP_BIN" sync ios

echo "Building & launching on $DEVICE_NAME..."
echo "Tip: keep 'npm run dev' running on http://localhost:3030 so the app can load the web UI."
"$CAP_BIN" run ios --target "$DEVICE_UDID"
