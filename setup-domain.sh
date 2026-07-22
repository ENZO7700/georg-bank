#!/bin/bash
# Script na nastavenie production domény

DOMAIN="bapp.space"
DEPLOYMENT_URL="https://internet-bank-pwa-main-hby2ru83s-u0352652320-8831s-projects.vercel.app"

echo "=== Nastavenie domény $DOMAIN ==="
echo ""

# Krok 1: Kúpi doménu (musíš spustiť interaktívne)
echo "1. Kúpi doménu $DOMAIN:"
echo "   vercel domains buy $DOMAIN"
echo "   alebo navštív: https://vercel.com/dashboard/domains"
echo ""

# Krok 2: Nastav DNS
echo "2. Nastav DNS records pre $DOMAIN:"
echo "   - A record: 76.76.21.21"
echo "   - CNAME: cname.vercel-dns.com"
echo ""

# Krok 3: Prirad doménu k deploymentu
echo "3. Prirad doménu k deploymentu:"
echo "   vercel alias set \"$DEPLOYMENT_URL\" $DOMAIN"
echo ""

# Krok 4: Over
echo "4. Over doménu:"
echo "   vercel domains"
echo ""

# Krok 5: Redeploy
echo "5. Redeploy:"
echo "   vercel --prod"
echo ""

echo "⚠️  Dôležité: DNS propagácia trvá 5-30 minút"
echo "✅ Po nastavení bude aplikácia dostupná na: https://$DOMAIN"
