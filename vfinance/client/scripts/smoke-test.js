import fs from 'fs';
import { chromium } from 'playwright';

(async () => {
  const url = process.argv[2] || 'http://127.0.0.1:4173/vfinance/';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs = [];
  page.on('console', msg => {
    logs.push({ type: 'console', text: msg.text(), location: msg.location() });
  });
  page.on('pageerror', err => {
    logs.push({ type: 'pageerror', text: String(err) });
  });

  try {
    const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    const status = response && response.status();
    await page.screenshot({ path: 'smoke-screenshot.png', fullPage: true });
    fs.writeFileSync('smoke-logs.json', JSON.stringify({ url, status, logs }, null, 2));
    console.log('OK', { url, status, logsCount: logs.length });
  } catch (e) {
    fs.writeFileSync('smoke-logs.json', JSON.stringify({ url, error: String(e), logs }, null, 2));
    console.error('ERROR', e);
    process.exit(2);
  } finally {
    await browser.close();
  }
})();
