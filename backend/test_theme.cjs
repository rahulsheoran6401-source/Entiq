const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/auth', { waitUntil: 'networkidle0' });
    
    // Check computed styles on body wrapper
    const bodyStyles = await page.evaluate(() => {
      const el = document.body;
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log("Body Computed Color (Default): ", bodyStyles);
    
    // Set theme to light in localStorage and reload
    await page.evaluate(() => {
      localStorage.setItem('cf_theme', 'light');
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
    
    const bodyStylesLight = await page.evaluate(() => {
      const el = document.body;
      return window.getComputedStyle(el).backgroundColor;
    });
    console.log("Body Computed Color After Light Set: ", bodyStylesLight);
    
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
