#!/bin/bash
set -e

# Path to the padded 500x500 logo
PADDED="assets/logo_padded.png"

# Verify file exists
if [ ! -f "$PADDED" ]; then
  echo "Error: assets/logo_padded.png does not exist"
  exit 1
fi

echo "Generating PWA icons from $PADDED..."

# Resize and save
sips -z 192 192 "$PADDED" --out public/android-chrome-192x192.png
sips -z 512 512 "$PADDED" --out public/android-chrome-512x512.png
sips -z 180 180 "$PADDED" --out public/apple-touch-icon.png
sips -z 192 192 "$PADDED" --out public/icon-192x192.png
sips -z 512 512 "$PADDED" --out public/icon-512x512.png
sips -z 192 192 "$PADDED" --out public/icon-maskable-192x192.png
sips -z 512 512 "$PADDED" --out public/icon-maskable-512x512.png
sips -z 32 32   "$PADDED" --out public/favicon-32x32.png
sips -z 16 16   "$PADDED" --out public/favicon-16x16.png
sips -s format ico -z 32 32 "$PADDED" --out public/favicon.ico

echo "All PWA icons generated and replaced successfully!"
