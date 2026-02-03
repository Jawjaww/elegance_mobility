// Generate simple colored squares as PNG placeholders
const fs = require('fs');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  // Create a simple SVG with the emoji
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="20" fill="#10b981"/>
    <text x="50" y="65" font-size="50" text-anchor="middle" font-family="Arial">🚗</text>
  </svg>`;
  
  // Save as SVG (browser will render it)
  fs.writeFileSync(`icon-${size}x${size}.svg`, svg);
});

console.log('Icons generated');
