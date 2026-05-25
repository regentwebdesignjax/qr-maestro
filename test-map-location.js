const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the app
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Look for a way to create a new QR code - check for button/link
    const createButtons = await page.$$('button');
    console.log(`Found ${createButtons.length} buttons on the page`);

    // Try to find and click a "Create" or "New QR" button
    await page.click('button:has-text("Create QR Code")', { timeout: 5000 }).catch(() => {
      console.log('No "Create QR Code" button found, trying alternative selectors...');
    });

    // Wait for navigation or modal to appear
    await page.waitForTimeout(2000);

    // Look for Map Location content type
    const contentTypeButtons = await page.$$('button');
    for (let btn of contentTypeButtons) {
      const text = await btn.textContent();
      if (text && text.includes('Map')) {
        console.log('Found map location button:', text);
        await btn.click();
        break;
      }
    }

    await page.waitForTimeout(1000);

    // Try to find address input field
    const inputs = await page.$$('input');
    if (inputs.length > 0) {
      // Type a test address
      await inputs[0].fill('123 Main Street, Jacksonville, FL');
      console.log('Entered test address');
    }

    await page.waitForTimeout(1000);

    // Look for submit/save button
    const buttons = await page.$$('button');
    for (let btn of buttons) {
      const text = await btn.textContent();
      if (text && (text.includes('Save') || text.includes('Generate') || text.includes('Create'))) {
        console.log('Clicking save button:', text);
        await btn.click();
        break;
      }
    }

    // Wait for QR code to be generated
    await page.waitForTimeout(3000);

    // Take a screenshot to see the current state
    await page.screenshot({ path: '/tmp/qr-app-state.png' });
    console.log('Screenshot saved to /tmp/qr-app-state.png');

    // Look for the generated QR code and click it to navigate to the landing page
    const qrLinks = await page.$$('a, button');
    for (let link of qrLinks) {
      const text = await link.textContent();
      if (text && text.includes('View') || text && text.includes('Open')) {
        console.log('Found view/open link');
        await link.click({ timeout: 5000 }).catch(() => console.log('Could not click link'));
        break;
      }
    }

    // Wait for the landing page to load
    await page.waitForTimeout(3000);

    // Check if iframe exists (the embedded map)
    const iframes = await page.$$('iframe');
    console.log(`Found ${iframes.length} iframes on the landing page`);

    if (iframes.length > 0) {
      console.log('✅ Map iframe is present!');
      const iframeSrc = await iframes[0].getAttribute('src');
      console.log('Iframe src:', iframeSrc);
    } else {
      console.log('❌ No map iframe found');
    }

    // Take a final screenshot
    await page.screenshot({ path: '/tmp/map-landing-page.png' });
    console.log('Landing page screenshot saved to /tmp/map-landing-page.png');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
