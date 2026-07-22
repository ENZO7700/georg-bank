#!/bin/bash

echo "🚀 SPÚŠŤAM VEĽKÚ DIAGNOSTIKU PROJEKTU..."

echo "1️⃣ Mažem staré cache súbory..."
rm -rf .next

echo "2️⃣ Preverujem TypeScript chyby (Typecheck)..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ Našli sa TypeScript chyby. Pozri výpis vyššie."
else
  echo "✅ TypeScript je bez chýb."
fi

echo "3️⃣ Spúšťam ESLint (Linting)..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint našiel problémy, ktoré treba opraviť."
else
  echo "✅ ESLint je bez chýb."
fi

echo "4️⃣ Spúšťam e2e Playwright testy..."
npx playwright test
if [ $? -ne 0 ]; then
  echo "❌ Niektoré Playwright testy neprešli."
else
  echo "✅ Všetky E2E testy prešli úspešne."
fi

echo "5️⃣ Skúšam cvičný produkčný Build..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build zlyhal."
else
  echo "✅ Build prebehol úspešne."
fi

echo "✅ DIAGNOSTIKA UKONČENÁ. Skopíruj mi celý tento výstup do chatu a ja ti napíšem presný plán, ako opravíme všetky chyby!"
