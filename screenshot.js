import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  await page.goto('http://localhost:5173/resumes');
  await new Promise(r => setTimeout(r, 2000));
  
  // Click first resume
  try {
    const resumeSelector = 'aside > div:nth-child(2) > div:nth-child(1)';
    await page.waitForSelector(resumeSelector, { timeout: 2000 });
    await page.click(resumeSelector);
    await new Promise(r => setTimeout(r, 2000));
    
    // Scroll the preview pane to see page boundaries
    await page.evaluate(() => {
      const pane = document.querySelector('.react-resizable-panels-panel:last-child > div');
      if (pane) {
         pane.scrollTop = 900;
      }
    });
    await new Promise(r => setTimeout(r, 1000));
  } catch (e) {
    console.error("No resumes found or couldn't click", e);
  }
  
  await page.screenshot({ path: '/Users/apple/code/offerFlow/screenshot_pagination.png' });
  await browser.close();
})();
