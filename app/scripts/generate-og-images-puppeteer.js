/**
 * Generate OpenGraph Images using Puppeteer
 * Creates og-default.jpg and og-pricing.jpg (1200x630)
 * 
 * Usage: node scripts/generate-og-images-puppeteer.js
 * Requires: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateOGImage(title, subtitle, backgroundColor, accentColor, outputPath) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, ${backgroundColor} 0%, ${accentColor} 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding-left: 100px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      position: relative;
      overflow: hidden;
    }
    .decoration {
      position: absolute;
      border-radius: 50%;
      opacity: 0.2;
      filter: blur(40px);
    }
    .decoration-1 {
      width: 300px;
      height: 300px;
      background: #F3CD4A;
      top: -50px;
      left: -50px;
    }
    .decoration-2 {
      width: 400px;
      height: 400px;
      background: #10B981;
      bottom: -100px;
      right: -100px;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: #F3CD4A;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      margin-bottom: 40px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    h1 {
      font-size: 72px;
      font-weight: 900;
      color: #FFFFFF;
      margin: 0 0 20px 0;
      line-height: 1.1;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      letter-spacing: -1px;
    }
    .subtitle {
      font-size: 36px;
      color: rgba(255, 255, 255, 0.95);
      margin: 0 0 40px 0;
      font-weight: 600;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    }
    .tagline {
      font-size: 24px;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
    }
    .accent {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: rgba(243, 205, 74, 0.3);
    }
  </style>
</head>
<body>
  <div class="decoration decoration-1"></div>
  <div class="decoration decoration-2"></div>
  <div class="logo">🏠</div>
  <h1>${title}</h1>
  <div class="subtitle">${subtitle}</div>
  <div class="tagline">Premium Real Estate Platform</div>
  <div class="accent"></div>
</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Wait a bit for fonts and styles to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({
      path: outputPath,
      type: 'jpeg',
      quality: 90,
      clip: { x: 0, y: 0, width: 1200, height: 630 }
    });

    console.log(`✅ Generated ${path.basename(outputPath)}`);
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('🎨 Generating OG images with Puppeteer...\n');

  try {
    // Generate og-default.jpg
    console.log('1. Generating og-default.jpg...');
    await generateOGImage(
      'Tharaga',
      'Premium Real Estate Platform',
      '#1a1a1a',
      '#0d1117',
      path.join(publicDir, 'og-default.jpg')
    );

    // Generate og-pricing.jpg
    console.log('\n2. Generating og-pricing.jpg...');
    await generateOGImage(
      'Pricing',
      'Transparent Pricing for Builders & Buyers',
      '#1e3a8a',
      '#1e40af',
      path.join(publicDir, 'og-pricing.jpg')
    );

    console.log('\n✅ All OG images generated successfully!');
    console.log(`📁 Images saved to: ${publicDir}`);
  } catch (error) {
    console.error('❌ Error generating images:', error);
    console.log('\n💡 Tip: Install puppeteer with: npm install puppeteer');
    process.exit(1);
  }
}

main();

