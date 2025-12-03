/**
 * Generate OpenGraph Images for Tharaga
 * Creates og-default.jpg and og-pricing.jpg (1200x630)
 * 
 * Usage: node scripts/generate-og-images.js
 */

const fs = require('fs');
const path = require('path');

// Check if we're in a Node.js environment with canvas support
let createCanvas;
try {
  // Try to use node-canvas if available
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
} catch (e) {
  console.log('node-canvas not available, using SVG fallback...');
}

/**
 * Generate OG image using SVG (works without canvas library)
 */
function generateOGImageSVG(title, subtitle, backgroundColor, accentColor, outputPath) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${backgroundColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Decorative circles -->
  <circle cx="100" cy="100" r="80" fill="rgba(243, 205, 74, 0.2)"/>
  <circle cx="1100" cy="530" r="120" fill="rgba(16, 185, 129, 0.2)"/>
  
  <!-- Main content -->
  <g transform="translate(100, 200)">
    <!-- Logo/Icon -->
    <rect x="0" y="0" width="80" height="80" rx="12" fill="#F3CD4A"/>
    <text x="40" y="50" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#1a1a1a" text-anchor="middle">🏠</text>
    
    <!-- Title -->
    <text x="0" y="140" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#FFFFFF">
      ${title}
    </text>
    
    <!-- Subtitle -->
    <text x="0" y="200" font-family="Arial, sans-serif" font-size="32" fill="rgba(255, 255, 255, 0.9)">
      ${subtitle}
    </text>
    
    <!-- Tagline -->
    <text x="0" y="280" font-family="Arial, sans-serif" font-size="24" fill="rgba(255, 255, 255, 0.7)">
      Premium Real Estate Platform
    </text>
  </g>
  
  <!-- Bottom accent -->
  <rect x="0" y="580" width="1200" height="50" fill="rgba(243, 205, 74, 0.3)"/>
</svg>`;

  // Write SVG file
  fs.writeFileSync(outputPath.replace('.jpg', '.svg'), svg);
  console.log(`✅ Generated ${path.basename(outputPath.replace('.jpg', '.svg'))}`);
  
  // Note: To convert SVG to JPG, you'll need ImageMagick or similar
  // For now, we'll create a simple HTML file that can be used to generate the image
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, ${backgroundColor} 0%, ${accentColor} 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      padding-left: 100px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      overflow: hidden;
    }
    .decoration {
      position: absolute;
      border-radius: 50%;
      opacity: 0.2;
    }
    .decoration-1 {
      width: 160px;
      height: 160px;
      background: #F3CD4A;
      top: 20px;
      left: 20px;
    }
    .decoration-2 {
      width: 240px;
      height: 240px;
      background: #10B981;
      bottom: 20px;
      right: 20px;
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
    }
    h1 {
      font-size: 64px;
      font-weight: 900;
      color: #FFFFFF;
      margin: 0 0 20px 0;
      line-height: 1.2;
    }
    .subtitle {
      font-size: 32px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 40px 0;
    }
    .tagline {
      font-size: 24px;
      color: rgba(255, 255, 255, 0.7);
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

  const htmlPath = outputPath.replace('.jpg', '.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`✅ Generated ${path.basename(htmlPath)} (open in browser and screenshot to get JPG)`);
  
  return htmlPath;
}

// Generate default OG image
console.log('🎨 Generating OG images...\n');

const publicDir = path.join(__dirname, '..', 'public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate og-default.jpg
console.log('1. Generating og-default.jpg...');
generateOGImageSVG(
  'Tharaga',
  'Premium Real Estate Platform',
  '#1a1a1a',
  '#0d1117',
  path.join(publicDir, 'og-default.jpg')
);

// Generate og-pricing.jpg
console.log('\n2. Generating og-pricing.jpg...');
generateOGImageSVG(
  'Pricing',
  'Transparent Pricing for Builders & Buyers',
  '#1e3a8a',
  '#1e40af',
  path.join(publicDir, 'og-pricing.jpg')
);

console.log('\n✅ OG image generation complete!');
console.log('\n📝 Next steps:');
console.log('1. Open the generated HTML files in a browser');
console.log('2. Take screenshots at 1200x630 resolution');
console.log('3. Save as JPG files in the public directory');
console.log('\nOr use a tool like puppeteer to automate:');
console.log('  npm install puppeteer');
console.log('  node scripts/generate-og-images-puppeteer.js');

