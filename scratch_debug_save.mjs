import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ 
      headless: "new",
      defaultViewport: { width: 1440, height: 900 }
    });
    const page = await browser.newPage();
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('fail') || msg.text().includes('Error')) {
        console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });

    // Capture network responses with status code !== 200/201/204
    page.on('response', response => {
      const status = response.status();
      const url = response.url();
      if (url.includes('supabase.co') && status >= 400) {
        response.json().then(data => {
          console.log(`[NETWORK ERROR] ${url} (Status ${status}):`, JSON.stringify(data));
        }).catch(err => {
          console.log(`[NETWORK ERROR] ${url} (Status ${status}) - No JSON body`);
        });
      }
    });

    console.log('Navigating to http://localhost:5173/');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    
    // Login
    const emailInput = await page.$('#email');
    if (emailInput) {
      console.log('Logging in as admin/1...');
      await page.type('#email', 'admin');
      await page.type('#password', '1');
      await page.click('.login-btn');
      await new Promise(r => setTimeout(r, 2000));
    }

    // Navigate to stats page where settings tab is located
    console.log('Navigating to shockwave-stats...');
    await page.goto('http://localhost:5173/shockwave-stats', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Click on "충격파 결산" or settings tab. Let's find the tab
    // Let's find selector for settings tab
    const tabs = await page.$$('.sw-stats-tab');
    console.log(`Found ${tabs.length} tabs`);
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      console.log(`Tab text: "${text}"`);
      if (text.includes('결산 설정') || text.includes('설정')) {
        console.log(`Clicking tab: "${text}"`);
        await tab.click();
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }

    // Take screenshot of settings tab before modifying
    const screenshotPath1 = '/Users/joohansol/.gemini/antigravity-ide/brain/bdd80cff-b0f2-40c1-a715-8105452dea27/settings_before.png';
    await page.screenshot({ path: screenshotPath1 });
    console.log('Saved settings_before.png');

    // Try modifying duration for the first prescription (e.g. F1.5 duration)
    // Find input for duration
    const durationInputs = await page.$$('.settlement-duration-input');
    if (durationInputs.length > 0) {
      console.log(`Found ${durationInputs.length} duration inputs. Modifying the first one...`);
      // Clear input and type a new value
      await durationInputs[0].click({ clickCount: 3 });
      await durationInputs[0].press('Backspace');
      await durationInputs[0].type('25');
    }

    // Try to find the therapist list and add a therapist
    // Typically in MonthlyTherapistConfig.jsx or similar.
    // Let's click "이번 달 설정 저장" button first to see duration save error
    const saveButtons = await page.$$('button');
    let saveBtn = null;
    for (const btn of saveButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('설정 저장') || text.includes('저장')) {
        saveBtn = btn;
        break;
      }
    }

    if (saveBtn) {
      console.log('Clicking save settings button...');
      await saveBtn.click();
      await new Promise(r => setTimeout(r, 3000)); // wait for api response
    } else {
      console.log('Save button not found');
    }

    // Take screenshot after save attempt
    const screenshotPath2 = '/Users/joohansol/.gemini/antigravity-ide/brain/bdd80cff-b0f2-40c1-a715-8105452dea27/settings_after_save.png';
    await page.screenshot({ path: screenshotPath2 });
    console.log('Saved settings_after_save.png');

    // Reload page and check if it persisted
    console.log('Reloading page...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Check value after reload
    const durationInputsReloaded = await page.$$('.settlement-duration-input');
    if (durationInputsReloaded.length > 0) {
      const val = await page.evaluate(el => el.value, durationInputsReloaded[0]);
      console.log(`Duration value after reload: ${val}`);
    }

    await browser.close();
  } catch (err) {
    console.error('Error running test script:', err);
  }
})();
