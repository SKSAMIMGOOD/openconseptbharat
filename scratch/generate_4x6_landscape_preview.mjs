import fs from 'node:fs';
import path from 'node:path';
import { calculatePhotoSheetLayout } from '../src/lib/photo-studio/sheet-calculator.ts';
import { DEFAULT_4X6_LANDSCAPE_SHEET_CONFIG } from '../src/constants/photo-sheet.ts';
import {
  DEFAULT_4X6_LANDSCAPE_PHOTO_WIDTH_MM,
  DEFAULT_4X6_LANDSCAPE_PHOTO_HEIGHT_MM,
} from '../src/constants/photo-dimensions.ts';

const artifactDir = 'C:/Users/SK MD SAMIM/.gemini/antigravity/brain/1ee97d8e-2279-47b7-827e-588329fde33e';
const userPhotoPath = path.join(artifactDir, '.user_uploaded/media_1794664497991_4b24fad2.jpg');
const photoBase64 = fs.readFileSync(userPhotoPath).toString('base64');
const photoDataUri = `data:image/jpeg;base64,${photoBase64}`;

const landscapeDims = {
  widthMm: DEFAULT_4X6_LANDSCAPE_PHOTO_WIDTH_MM,
  heightMm: DEFAULT_4X6_LANDSCAPE_PHOTO_HEIGHT_MM,
};

const layout = calculatePhotoSheetLayout(
  DEFAULT_4X6_LANDSCAPE_SHEET_CONFIG,
  landscapeDims
);

console.log('Sheet calculation:', {
  sheetWidthMm: layout.sheetWidthMm,
  sheetHeightMm: layout.sheetHeightMm,
  cols: layout.activeColumns,
  rows: layout.activeRows,
  total: layout.totalPhotos,
  photoPx: `${layout.photoWidthPx} x ${layout.photoHeightPx}`,
  firstPlacement: layout.placements[0],
  lastPlacement: layout.placements[14],
});

// Render SVG with 1800 x 1200 coordinate space (300 DPI @ 6x4 inches)
const svgWidth = 1800;
const svgHeight = 1200;

let photosSvg = '';
for (const p of layout.placements) {
  photosSvg += `
    <g transform="translate(${p.xPx}, ${p.yPx})">
      <!-- Photo Image -->
      <image
        href="${photoDataUri}"
        x="0"
        y="0"
        width="${p.widthPx}"
        height="${p.heightPx}"
        preserveAspectRatio="xMidYMid slice"
      />
      <!-- Thin Cutting Border -->
      <rect
        x="0"
        y="0"
        width="${p.widthPx}"
        height="${p.heightPx}"
        fill="none"
        stroke="#000000"
        stroke-width="1"
      />
    </g>
  `;
}

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg
  xmlns="http://www.w3.org/2000/svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  viewBox="0 0 ${svgWidth} ${svgHeight}"
  width="${svgWidth}"
  height="${svgHeight}"
>
  <defs>
    <style>
      .sheet-bg { fill: #ffffff; }
    </style>
  </defs>

  <!-- Sheet Background (White 4x6 landscape photo paper) -->
  <rect class="sheet-bg" x="0" y="0" width="${svgWidth}" height="${svgHeight}" />

  <!-- 15 Placed Photos (5 cols x 3 rows) -->
  ${photosSvg}
</svg>
`;

const outputPath = path.join(artifactDir, 'preview_4x6_landscape_15_copies.svg');
fs.writeFileSync(outputPath, svgContent, 'utf-8');
console.log(`Saved preview SVG to: ${outputPath}`);
