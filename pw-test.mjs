import { chromium } from 'playwright';

const base = 'https://thelazycpa.vercel.app';
const t = Date.now();
const email1 = `reza+pwsub${t}@fintask.ie`;
const email2 = `reza+pwwait${t}@fintask.ie`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = [];

try {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.fill('#name-input', 'Reza');
  await page.fill('#email-input', email1);
  await page.click('#submit-btn');
  await page.waitForTimeout(3000);
  const subMsg = await page.locator('#form-message').innerText();
  results.push({ test: 'subscribe_form', ok: /check your email|sent|✓/i.test(subMsg), message: subMsg.trim(), email: email1 });

  await page.fill('#business-name', 'Reza');
  await page.fill('#business-email', email2);
  await page.fill('#business-company', 'FinTask');
  await page.fill('#business-role', 'Founder');
  await page.click('#business-btn');
  await page.waitForTimeout(3000);
  const waitMsg = await page.locator('#business-message').innerText();
  results.push({ test: 'waiting_list_form', ok: /on the list|check your email|✓|joined/i.test(waitMsg), message: waitMsg.trim(), email: email2 });

  const health = await page.request.get(`${base}/api/health?t=${Date.now()}`);
  const healthJson = await health.json();
  results.push({ test: 'api_health', ok: health.ok(), health: healthJson });

  console.log(JSON.stringify({ ok: results.every(r => r.ok !== false), results }, null, 2));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e), results }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
