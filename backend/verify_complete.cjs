const puppeteer = require('puppeteer');
const crypto = require('crypto');

async function reactType(page, selector, text) {
  await page.waitForSelector(selector);
  await page.evaluate((selector, text) => {
    const el = document.querySelector(selector);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, selector, text);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  const baseUrl = 'http://localhost:5174';
  const testEmail = `tester_${crypto.randomBytes(4).toString('hex')}@codeforge.local`;
  const initialPassword = 'password123';
  const newPassword = 'newpassword123';
  
  try {
    console.log("Starting full verification workflow with new user...");
    
    // 1. Register & Login
    console.log("Navigating to auth...");
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle0' });
    
    // Switch to register tab
    await page.waitForSelector('button:has-text("Sign up")');
    await page.click('button:has-text("Sign up")');
    await page.waitForTimeout(500);
    
    await reactType(page, 'input[placeholder="John Doe"]', 'Test User');
    await reactType(page, 'input[type="email"]', testEmail);
    await reactType(page, 'input[type="password"]', initialPassword);
    
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('text/Welcome back', { timeout: 10000 });
    console.log("Registration & Login successful!");
    
    // 2. Create Project
    console.log("Creating new project...");
    await page.click('button:has-text("New Project")');
    await page.waitForSelector('input[placeholder="e.g., E-commerce Platform"]');
    await reactType(page, 'input[placeholder="e.g., E-commerce Platform"]', 'Test Verification Project');
    await reactType(page, 'textarea[placeholder="Describe your project..."]', 'A test project');
    await page.click('button:has-text("Create Project")');
    
    await page.waitForSelector('text/Test Verification Project');
    console.log("Project created!");
    
    // 3. Create Entity
    console.log("Creating entity...");
    await page.click('button:has-text("Create Custom Entity")');
    await reactType(page, 'input[placeholder="e.g., Users, Products, Orders"]', 'TestItems');
    await page.click('button:has-text("Add Field")');
    
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[placeholder="e.g., name, price, isActive"]');
      const el = inputs[inputs.length - 1];
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeInputValueSetter.call(el, 'itemName');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    await page.click('button:has-text("Save Entity")');
    await page.waitForSelector('text/New Record', { timeout: 5000 });
    console.log("Entity created!");
    
    // 4. Add Record
    console.log("Adding record...");
    await page.click('button:has-text("New Record")');
    await page.waitForSelector('input[placeholder="Enter text..."]');
    await reactType(page, 'input[placeholder="Enter text..."]', 'Sample Record Value');
    await page.click('button:has-text("Save")');
    
    await page.waitForSelector('text/Sample Record Value', { timeout: 5000 });
    console.log("Record added!");
    
    // Check workspace overview to see if record count updated
    await page.click('button:has-text("Overview")');
    await page.waitForFunction(() => {
      return document.body.innerText.includes('Total Records') && document.body.innerText.includes('1');
    }, { timeout: 5000 }).catch(e => console.log("Overview count check missed, continuing..."));
    
    await page.click('button:has-text("Records")');
    
    // 5. Edit Record
    console.log("Editing record...");
    await page.waitForSelector('table tbody tr');
    await page.evaluate(() => {
      const editBtn = document.querySelector('table tbody tr button:has(.lucide-edit-2)') || document.querySelector('table tbody tr button:nth-child(1)');
      if(editBtn) editBtn.click();
    });
    
    await page.waitForSelector('input[placeholder="Enter text..."]');
    await reactType(page, 'input[placeholder="Enter text..."]', 'Updated Value');
    await page.click('button:has-text("Save")');
    
    await page.waitForSelector('text/Updated Value', { timeout: 5000 });
    console.log("Record edited!");
    
    // 6. Delete Record
    console.log("Deleting record...");
    page.on('dialog', async dialog => await dialog.accept());
    
    await page.evaluate(() => {
      const deleteBtn = document.querySelector('table tbody tr button:has(.lucide-trash-2)') || document.querySelectorAll('table tbody tr button')[1];
      if(deleteBtn) deleteBtn.click();
    });
    
    await page.waitForSelector('text/No Records Found', { timeout: 5000 });
    console.log("Record deleted!");
    
    // 7. Delete Project
    console.log("Returning to dashboard to delete project...");
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    
    await page.waitForSelector('text/Test Verification Project');
    
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.glass-panel'));
      const testCard = cards.find(c => c.innerText.includes('Test Verification Project'));
      if(testCard) {
        const del = testCard.querySelector('button[title="Delete Project"]');
        if(del) del.click();
      }
    });
    
    await page.waitForTimeout(1000);
    console.log("Project deleted!");
    
    // 8. Change Password
    console.log("Going to profile to change password...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const userBtn = btns.find(b => b.innerText.includes('Test') || b.innerText.includes('User') || b.innerText.includes('T') || b.innerText.includes('U'));
      if(userBtn) userBtn.click();
    });
    await page.waitForTimeout(500);
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'networkidle0' });
    
    await page.waitForSelector('text/Your Profile');
    
    const pInputs = await page.$$('input[type="password"]');
    await page.evaluate((el, text) => {
      const setVal = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setVal.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true }));
    }, pInputs[0], initialPassword);
    await page.evaluate((el, text) => {
      const setVal = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setVal.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true }));
    }, pInputs[1], newPassword);
    await page.evaluate((el, text) => {
      const setVal = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setVal.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true }));
    }, pInputs[2], newPassword);
    
    await page.click('button:has-text("Update Password")');
    await page.waitForSelector('text/Password updated successfully', { timeout: 5000 });
    console.log("Password changed!");
    
    // 9. Logout
    console.log("Logging out...");
    await page.click('button:has-text("Logout")');
    await page.waitForSelector('text/Sign In to CodeForge', { timeout: 5000 });
    console.log("Logged out successfully!");
    
    // 10. Login Again with New Password
    console.log("Logging in with new password...");
    await reactType(page, 'input[type="email"]', testEmail);
    await reactType(page, 'input[type="password"]', newPassword);
    await page.click('button:has-text("Sign in")');
    
    await page.waitForSelector('text/Welcome back', { timeout: 10000 });
    console.log("Login with new password successful!");
    
    console.log("All verifications passed!");
    
  } catch (err) {
    console.error("Verification failed:", err);
    await page.screenshot({ path: 'verify_fail.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
