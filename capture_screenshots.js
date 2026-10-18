const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });

  // 1. Capture VITH intro overlay
  console.log('Capturing 01_vith_intro...');
  await page.screenshot({ path: path.join(screenshotsDir, '01_vith_intro.png') });

  // Dismiss intro by clicking skip
  try {
    await page.click('#intro-skip');
  } catch (e) {
    await page.evaluate(() => {
      const el = document.getElementById('vith-intro');
      if (el) el.remove();
      const panel = document.getElementById('vith-panel');
      if (panel) panel.classList.remove('collapsed');
    });
  }

  await new Promise(r => setTimeout(r, 1500));

  // Trigger all fade-ins and skill bar animations
  await page.evaluate(() => {
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
  });

  // 2. Hero Section
  console.log('Capturing 02_hero_section...');
  const heroEl = await page.$('#hero');
  if (heroEl) {
    await heroEl.screenshot({ path: path.join(screenshotsDir, '02_hero_section.png') });
  }

  // 3. About Section
  console.log('Capturing 03_about_section...');
  const aboutEl = await page.$('#about');
  if (aboutEl) {
    await aboutEl.screenshot({ path: path.join(screenshotsDir, '03_about_section.png') });
  }

  // 4. Skills Section
  console.log('Capturing 04_skills_section...');
  const skillsEl = await page.$('#skills');
  if (skillsEl) {
    await skillsEl.screenshot({ path: path.join(screenshotsDir, '04_skills_section.png') });
  }

  // 5. Experience Section
  console.log('Capturing 05_experience_section...');
  const expEl = await page.$('#experience');
  if (expEl) {
    await expEl.screenshot({ path: path.join(screenshotsDir, '05_experience_section.png') });
  }

  // 6. Projects Section
  console.log('Capturing 06_projects_section...');
  const projEl = await page.$('#projects');
  if (projEl) {
    await projEl.screenshot({ path: path.join(screenshotsDir, '06_projects_section.png') });
  }

  // 7. Contact Section
  console.log('Capturing 07_contact_section...');
  const contactEl = await page.$('#contact');
  if (contactEl) {
    await contactEl.screenshot({ path: path.join(screenshotsDir, '07_contact_section.png') });
  }

  // 8. VITH Assistant Interface
  console.log('Capturing 08_vith_assistant_chat...');
  const panelEl = await page.$('#vith-panel');
  if (panelEl) {
    await panelEl.screenshot({ path: path.join(screenshotsDir, '08_vith_assistant_chat.png') });
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
