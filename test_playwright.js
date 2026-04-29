const { chromium } = require('playwright');
async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.google.com/maps/search/?api=1&query=Google&query_place_id=ChIJkS6rLlP2czERvMbrZ65bLLo', { waitUntil: 'networkidle' });
  const title = await page.title();
  const h1 = await page.locator('h1').first().textContent().catch(() => 'no h1');
  console.log('Title:', title);
  console.log('H1:', h1);
  await browser.close();
}
run();
