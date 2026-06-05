const puppeteer = require('puppeteer-core');
require('dotenv').config();

const FRONTEND_URL = 'http://localhost:5174';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--window-size=1280,800']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER CONSOLE ERROR:', msg.text());
  });
  page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.stack || err.toString()));
  
  try {
    console.log('[1] Logging in...');
    await page.goto(`${FRONTEND_URL}/auth`);
    await page.type('input[type="email"]', 'ashritasrmofficial@gmail.com');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    
    await page.waitForFunction(() => window.location.href.includes('/dashboard'));
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('[2] Opening Project Workspace...');
    const projectClicked = await page.evaluate(() => {
      const h3s = Array.from(document.querySelectorAll('h3'));
      const gymProj = h3s.find(h => h.textContent.includes('Gym Management System'));
      if (gymProj) {
        const container = gymProj.closest('.cursor-pointer');
        if (container) {
          container.click();
          return true;
        }
      }
      return false;
    });

    if (!projectClicked) throw new Error('Gym Management System project not found.');
    await page.waitForFunction(() => window.location.href.includes('/projects/'));
    await new Promise(r => setTimeout(r, 1000));
    
    console.log('[3] Clicking Payments entity...');
    const paymentsClicked = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const payments = spans.find(s => s.textContent === 'Payments');
      if (payments) {
        const btn = payments.closest('button');
        if (btn) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (!paymentsClicked) throw new Error('Payments entity not found in sidebar.');
    await new Promise(r => setTimeout(r, 1500));
    
    // Check if app went blank (i.e., no table headers and no empty state)
    const isRendered = await page.evaluate(() => {
      return !!document.querySelector('th') || document.body.textContent.includes('No Records Found');
    });
    if (!isRendered) {
      throw new Error('Entity view is blank after clicking Payments (possibly crashed).');
    }
    console.log('[4] Verifying the app does not go blank when New Record is clicked...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newRec = buttons.find(b => b.textContent.includes('New Record'));
      if (newRec) {
        newRec.click();
        return true;
      }
      return false;
    });
    if (!clicked) throw new Error('New Record button not found');
    
    // Wait for modal to prove it doesn't crash
    await page.waitForSelector('.fixed.inset-0.z-50', { timeout: 3000 });
    await new Promise(r => setTimeout(r, 1000));
    
    // Fill form
    console.log('[5] Filling and Saving Payment Record...');
    
    const saveClicked = await page.evaluate(() => {
      // Find the modal
      const modal = document.querySelector('.fixed.inset-0.z-50');
      if (!modal) return false;
      
      const inputs = Array.from(modal.querySelectorAll('input'));
      const select = modal.querySelector('select');
      
      const memberName = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('member name'));
      const amount = inputs.find(i => i.type === 'number' || (i.placeholder && i.placeholder.toLowerCase().includes('amount')));
      const date = inputs.find(i => i.type === 'date');
      
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
      
      if (memberName) {
        nativeInputValueSetter.call(memberName, 'Jane Smith');
        memberName.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (amount) {
        nativeInputValueSetter.call(amount, '5000');
        amount.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (date) {
        const today = new Date().toISOString().split('T')[0];
        nativeInputValueSetter.call(date, today);
        date.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (select) {
        nativeSelectValueSetter.call(select, 'Paid');
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      const submitBtn = modal.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
        return true;
      }
      return false;
    });
    
    if (!saveClicked) throw new Error('Could not click Save Record button.');
    
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('[6] Verifying record appears...');
    const recordExists = await page.evaluate(() => {
      return document.body.textContent.includes('Jane Smith') && document.body.textContent.includes('5000');
    });
    
    if (!recordExists) throw new Error('Record not found in the table after saving.');
    
    console.log('[9] Testing entity switching...');
    const membersClicked = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const members = spans.find(s => s.textContent === 'Members');
      if (members) {
        const btn = members.closest('button');
        if (btn) {
          btn.click();
          return true;
        }
      }
      return false;
    });
    
    if (!membersClicked) throw new Error('Members entity not found in sidebar.');
    await new Promise(r => setTimeout(r, 1000));
    
    const membersHeader = await page.evaluate(() => !!Array.from(document.querySelectorAll('h2')).find(h => h.textContent === 'Members'));
    if (!membersHeader) throw new Error('Failed to switch to Members entity.');
    
    console.log('✅ ALL TESTS PASSED! Fix is successful.');
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'bug-test-error.png' });
  } finally {
    await browser.close();
  }
})();
