import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message, error.stack));
  
  // Also catch unhandled rejections
  page.on('error', err => console.log('PAGE CRASH:', err.message));
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click the start button or press space
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 1000));
  await page.keyboard.press('Space'); // Select 1 player
  await new Promise(r => setTimeout(r, 1000));
  await page.keyboard.press('Space'); // Start game
  await new Promise(r => setTimeout(r, 1000));
  await page.keyboard.press('Space'); // Course intro
  
  // Wait a bit, then shoot
  await new Promise(r => setTimeout(r, 2000));
  await page.keyboard.press('Space'); // Start power
  await new Promise(r => setTimeout(r, 500));
  await page.keyboard.press('Space'); // Shoot
  
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
})();
