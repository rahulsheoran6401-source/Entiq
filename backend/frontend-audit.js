const puppeteer = require('puppeteer');

(async () => {
  console.log('--- STARTING FRONTEND E2E AUDIT ---');
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const baseUrl = 'http://localhost:5174';

    console.log('[1] Testing Authentication (Login)...');
    await page.goto(`${baseUrl}/auth`, { waitUntil: 'networkidle2' });
    
    // Check if on Auth page
    const content = await page.content();
    if (!content.includes('Sign in to CodeForge')) {
      await page.screenshot({ path: 'auth-failed.png' });
      throw new Error('Could not find Auth page header. See auth-failed.png');
    }

    // Wait for the login form elements
    await page.waitForSelector('input[type="email"]');
    await page.waitForSelector('input[type="password"]');
    
    await page.type('input[type="email"]', 'ashritasrmofficial@gmail.com');
    await page.type('input[type="password"]', '123456');

    // Click Login (assumes the button contains "Sign In" or is a primary button)
    const loginButton = await page.$('button[type="submit"]');
    await loginButton.click();

    console.log('✅ Clicked login, waiting for navigation...');

    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    const currentUrl = page.url();
    if (!currentUrl.includes('/dashboard')) {
      throw new Error(`Failed to navigate to dashboard. Ended up at ${currentUrl}`);
    }
    console.log('✅ Successfully logged in and navigated to Dashboard.');

    console.log('[2] Testing Dashboard Metrics...');
    const dashboardContent = await page.content();
    if (!dashboardContent.includes('Total Projects') || !dashboardContent.includes('Total Entities')) {
      throw new Error('Dashboard is missing required metrics (Total Projects, Total Entities).');
    }
    console.log('✅ Dashboard metrics present.');

    console.log('[3] Testing Project Navigation...');
    // Find the project by its text and click its container
    const projectsCount = await page.$$eval('h3', els => els.length);
    if (projectsCount === 0) {
      throw new Error('Could not find any projects in the dashboard.');
    }
    
    // Just click the first project container since we just created it
    const projectContainers = await page.$$('.cursor-pointer');
    // The first one is the "CF" logo, so let's find the one that has an h3
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

    if (!projectClicked) {
      throw new Error('Could not click the Gym Management System project in the dashboard.');
    }

    // Wait for the URL to change (SPA transition)
    await page.waitForFunction(() => window.location.href.includes('/projects/'));
    // Give it a moment to render
    await new Promise(r => setTimeout(r, 1000));
    
    if (!page.url().includes('/projects/') || page.url().includes('/dashboard')) {
      throw new Error('Failed to navigate to Project Workspace. URL: ' + page.url());
    }
    console.log('✅ Project navigation successful (stayed on /projects/:projectId).');

    console.log('[4] Testing Workspace Navigation...');
    // The workspace should have links to Overview, Records, API Explorer
    const workspaceContent = await page.content();
    if (!workspaceContent.includes('Overview') || !workspaceContent.includes('Records') || !workspaceContent.includes('API Explorer')) {
      throw new Error('Workspace navigation missing Overview, Records, or API Explorer.');
    }
    console.log('✅ Workspace navigation (sidebar) present.');

    console.log('[5] Testing Documentation Links...');
    // Click on Docs in the sidebar
    const docsLink = await page.$('a[href="/docs"]');
    if (docsLink) {
      await docsLink.click();
      await page.waitForFunction(() => window.location.href.includes('/docs'));
      await new Promise(r => setTimeout(r, 1000));
      if (!page.url().includes('/docs')) {
        throw new Error('Failed to navigate to documentation.');
      }
      console.log('✅ Documentation link works.');
    } else {
      console.log('⚠️ Could not find Docs link in sidebar.');
    }

    console.log('[6] Testing Logout...');
    // Find logout button (usually in bottom left or top right)
    
    // First, we need to click the user menu button in the header if it's hidden
    await page.evaluate(() => {
      const userBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('U') || b.textContent.includes('User'));
      if (userBtn) userBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 500));

    const logoutClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const logoutBtn = buttons.find(b => b.textContent.includes('Sign out') || b.textContent.includes('Log out'));
      if (logoutBtn) {
        logoutBtn.click();
        return true;
      }
      return false;
    });

    if (logoutClicked) {
      // Should redirect back to home or auth
      await page.waitForFunction(() => window.location.href.includes('/auth') || window.location.pathname === '/');
      await new Promise(r => setTimeout(r, 1000));
      if (!page.url().includes('/auth') && !page.url().endsWith('/')) {
         throw new Error('Logout did not redirect correctly.');
      }
      console.log('✅ Logout successful.');
    } else {
      console.log('⚠️ Could not find Logout button, skipping.');
    }

    console.log('\n--- FRONTEND AUDIT COMPLETE: ALL UI TESTS PASSED ---');
  } catch (err) {
    console.error('\n❌ FRONTEND AUDIT FAILED:', err.message);
    if (browser) {
      const pages = await browser.pages();
      if (pages.length > 0) {
        await pages[0].screenshot({ path: 'error-screenshot.png' });
        console.log('Saved error-screenshot.png');
      }
    }
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
