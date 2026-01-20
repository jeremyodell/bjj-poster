import sharp from 'sharp';
import path from 'path';

async function createTextOverlayExample(): Promise<void> {
  const outputPath = path.join(__dirname, 'output-poster.png');

  // Create a base image (800x600 dark background)
  const width = 800;
  const height = 600;

  // Create SVG text overlay
  const svgText = `
    <svg width="${width}" height="${height}">
      <style>
        .title { fill: #ffffff; font-size: 48px; font-weight: bold; font-family: Arial, sans-serif; }
        .subtitle { fill: #cccccc; font-size: 24px; font-family: Arial, sans-serif; }
        .details { fill: #888888; font-size: 18px; font-family: Arial, sans-serif; }
      </style>
      <text x="50%" y="100" text-anchor="middle" class="title">BJJ OPEN 2025</text>
      <text x="50%" y="160" text-anchor="middle" class="subtitle">Championship Tournament</text>
      <text x="50%" y="260" text-anchor="middle" class="details">January 15, 2025 • Los Angeles, CA</text>
      <text x="50%" y="310" text-anchor="middle" class="details">Registration opens December 1st</text>
    </svg>
  `;

  // Create the image with text overlay
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 30, g: 30, b: 40, alpha: 1 },
    },
  })
    .composite([
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`✅ Image created successfully: ${outputPath}`);
}

createTextOverlayExample().catch(console.error);
