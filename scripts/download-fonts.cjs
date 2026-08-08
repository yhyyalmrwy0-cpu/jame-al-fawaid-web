const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fontFamilies = [
  'Amiri:ital,wght@0,400;0,700;1,400;1,700',
  'Cairo:wght@200;300;400;500;600;700;800;900',
  'Tajawal:wght@200;300;400;500;700;800;900',
  'Almarai:wght@300;400;700;800',
  'Reem+Kufi:wght@400;500;600;700;800;900',
  'Aref+Ruqaa:wght@400;700',
  'Mirza:wght@400;500;600;700',
  'Lalezar',
  'Harmattan:wght@400;500;600;700',
  'Marhey:wght@300;400;500;600;700',
  'El+Messiri:wght@400;500;600;700'
];

const cssUrl = 'https://fonts.googleapis.com/css2?family=' + fontFamilies.join('&family=') + '&display=swap';

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, options, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching CSS from Google Fonts...');
  const cssBuffer = await fetchUrl(cssUrl);
  const cssText = cssBuffer.toString('utf8');
  
  const fontFaceRegex = /@font-face\s*\{([^}]+)\}/g;
  let match;
  let localCss = '/* Local Offline Fonts for جامع الفوائد */\n';
  let fontIndex = 0;
  const precacheFiles = [];

  while ((match = fontFaceRegex.exec(cssText)) !== null) {
    const block = match[1];
    const familyMatch = /font-family:\s*['"]?([^'"]+)['"]?/.exec(block);
    const styleMatch = /font-style:\s*([^;]+)/.exec(block);
    const weightMatch = /font-weight:\s*([^;]+)/.exec(block);
    const srcMatch = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/.exec(block);
    const rangeMatch = /unicode-range:\s*([^;]+)/.exec(block);

    if (familyMatch && srcMatch) {
      const family = familyMatch[1];
      const style = styleMatch ? styleMatch[1].trim() : 'normal';
      const weight = weightMatch ? weightMatch[1].trim() : '400';
      const remoteUrl = srcMatch[1];
      const range = rangeMatch ? rangeMatch[1].trim() : null;

      fontIndex++;
      const safeFamily = family.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fileName = `${safeFamily}-${weight}-${style}-${fontIndex}.woff2`;
      const localPath = path.join(fontsDir, fileName);

      if (!fs.existsSync(localPath)) {
        console.log(`Downloading font #${fontIndex}: ${family} (${weight}) -> ${fileName}`);
        const fontBuffer = await fetchUrl(remoteUrl);
        fs.writeFileSync(localPath, fontBuffer);
      }

      precacheFiles.push(`/fonts/${fileName}`);

      localCss += `@font-face {\n`;
      localCss += `  font-family: '${family}';\n`;
      localCss += `  font-style: ${style};\n`;
      localCss += `  font-weight: ${weight};\n`;
      localCss += `  font-display: swap;\n`;
      localCss += `  src: url('/fonts/${fileName}') format('woff2');\n`;
      if (range) {
        localCss += `  unicode-range: ${range};\n`;
      }
      localCss += `}\n\n`;
    }
  }

  fs.writeFileSync(path.join(__dirname, '..', 'src', 'offline-fonts.css'), localCss);
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'font-files.json'), JSON.stringify(precacheFiles, null, 2));

  // Update service-worker.js precache list
  const swPath = path.join(__dirname, '..', 'public', 'service-worker.js');
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    const precacheArray = [
      '/',
      '/index.html',
      '/manifest.json',
      '/app_logo.svg',
      ...precacheFiles
    ];
    
    const newPrecacheStr = `const PRECACHE_ASSETS = ${JSON.stringify(precacheArray, null, 2)};`;
    swContent = swContent.replace(/const PRECACHE_ASSETS = \[[\s\S]*?\];/, newPrecacheStr);
    fs.writeFileSync(swPath, swContent);
    console.log('Updated service-worker.js with local font precaching array.');
  }

  console.log(`SUCCESS! Downloaded and configured ${fontIndex} font files for full offline support!`);
}

run().catch(console.error);
