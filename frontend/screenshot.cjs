const { chromium } = require('playwright');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = 'http://localhost:5173';
  const outDir = __dirname;
  
  // Viewports
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 },
  ];

  async function takeScreenshots(routeName, pathName) {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}${pathName}`, { waitUntil: 'networkidle' });
      await delay(1000); // Wait for animations
      await page.screenshot({ 
        path: path.join(outDir, `${routeName}-${vp.name}.png`),
        fullPage: true 
      });
      console.log(`Saved screenshot: ${routeName}-${vp.name}.png`);
    }
  }

  try {
    // 1. Landing Page
    await takeScreenshots('landing', '/');
    
    // Let's do it via API
    const apiRes = await context.request.post('http://localhost:5000/api/auth/register', {
      data: {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@gmail.com`,
        password: 'Password123!'
      }
    });
    
    if (apiRes.ok()) {
      const data = await apiRes.json();
      console.log('Registered dummy user via API');
      // Set localStorage token
      await page.goto(`${baseUrl}/`);
      await page.evaluate((token) => {
        localStorage.setItem('token', token);
      }, data.token);
    } else {
      console.error('Failed to register dummy user via API:', await apiRes.text());
    }

    // Now take screenshots of protected routes
    await takeScreenshots('dashboard', '/dashboard');
    await takeScreenshots('predict', '/predict');

  } catch (err) {
    console.error('Error during screenshots:', err);
  } finally {
    await browser.close();
  }
}

run();
