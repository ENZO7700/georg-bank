import { chromium } from 'playwright'

// Načítanie hesla z environment premennej, inak default 'heslo'
const SITE_GATE_PASSWORD = process.env.SITE_GATE_PASSWORD ?? 'heslo'

async function run() {
  console.log('Spúšťam robustný test presmerovania pre mobilnú verziu...')
  console.log(`Použité heslo pre bránu: ${SITE_GATE_PASSWORD}`)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Krok 1: Otvorenie koreňovej adresy
    console.log('1. Navigujem na http://localhost:3030/ ...')
    await page.goto('http://localhost:3030/')
    
    let url = page.url()
    console.log(`   Vstupná URL: ${url}`)

    // Krok 2: Ak sme na vstupnej bráne, zadáme heslo
    if (url.includes('/gate')) {
      console.log('2. Detegovaná vstupná brána (/gate). Zadávam heslo a odosielam...')
      await page.fill('input[type="password"]', SITE_GATE_PASSWORD)
      
      // Spustíme kliknutie a zároveň počkáme na navigáciu do dashboardu
      await Promise.all([
        page.waitForURL('**/dashboard2', { timeout: 15000 }),
        page.click('button[type="submit"]')
      ])
      
      url = page.url()
      console.log(`   URL po odoslaní a úspešnej navigácii: ${url}`)
    }

    // Krok 3: Overenie, že sme skončili na /dashboard2
    if (url.includes('/dashboard2')) {
      console.log('✅ ÚSPECH: Aplikácia úspešne presmerovala na predvolenú mobilnú verziu /dashboard2!')
    } else {
      console.log(`❌ CHYBA: Očakávalo sa presmerovanie na /dashboard2, ale skončili sme na: ${url}`)
    }

  } catch (error) {
    console.error('❌ Počas testu nastala chyba:', error)
  } finally {
    await browser.close()
    console.log('Test dokončený.')
  }
}

run()
