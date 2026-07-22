#!/bin/bash

# Zastaviť skript pri akejkoľvek chybe
set -e

echo "🚀 INICIALIZUJEM PRECHOD NA ANDROID APK (LIVE SERVER MODE)..."

# 1. Inštalácia dependencies s ignorovaním peer konfliktov
echo "📦 1. Inštalujem Capacitor dependencies..."
npm install --legacy-peer-deps @capacitor/core @capacitor/cli @capacitor/android

# 2. Pridanie Android platformy, ak neexistuje
if [ ! -d "android" ]; then
  echo "🤖 2. Inicializujem Android platformu pre Capacitor..."
  npx cap add android
else
  echo "🤖 2. Android platforma už existuje, preskakujem pridanie..."
fi

# 3. Synchronizácia Capacitor configu a assetov
echo "🔄 3. Synchronizujem nastavenia (Live URL) s Android projektom..."
npx cap sync

echo "=========================================================="
echo "✅ PRÍPRAVA DOKONČENÁ!"
echo "=========================================================="
echo "Pretože tvoja aplikácia využíva Server Actions a zložité API routy,"
echo "nastavili sme Capacitor do režimu 'Live Wrapper'."
echo "To znamená, že natívna Android aplikácia bude naživo načítavať tvoj Next.js server."
echo ""
echo "Pre otestovanie APK musí bežať tvoj lokálny server:"
echo "  1. V novom okne terminálu spusti: npm run dev"
echo "  (Uisti sa, že beží na porte 3030: npx next dev -p 3030)"
echo ""
echo "  2. Pre zostavenie výsledného APK súboru spusti v tomto okne:"
echo "  cd android && ./gradlew assembleDebug"
echo ""
echo "Výsledné APK nájdeš tu:"
echo "  android/app/build/outputs/apk/debug/app-debug.apk"
echo "=========================================================="
