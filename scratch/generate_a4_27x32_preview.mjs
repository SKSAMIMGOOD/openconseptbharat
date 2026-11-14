import fs from 'node:fs';
import path from 'node:path';
import { calculatePhotoSheetLayout } from '../src/lib/photo-studio/sheet-calculator.ts';
import { DEFAULT_A4_SHEET_CONFIG } from '../src/constants/photo-sheet.ts';

const userImgPath = 'C:\\Users\\SK MD SAMIM\\.gemini\\antigravity\\brain\\1ee97d8e-2279-47b7-827e-588329fde33e\\.user_uploaded\\media_1794625111978_7c90b044.jpg';
const imgBytes = fs.readFileSync(userImgPath);
const base64Img = `data:image/jpeg;base64,${imgBytes.toString('base64')}`;

// A4 Compact Default dimensions (27 mm × 32 mm display / 26.94 × 32.33 mm physical)
const a4CompactDims = { widthMm: 26.94, heightMm: 32.33 };
const layout = calculatePhotoSheetLayout(
  {
    ...DEFAULT_A4_SHEET_CONFIG,
    paperSize: 'a4',
    orientation: 'portrait',
    copies: 56,
  },
  a4CompactDims
);

console.log('Layout summary:', {
  maxColumns: layout.maxColumns,
  maxRows: layout.maxRows,
  maxCapacity: layout.maxCapacity,
  totalPhotos: layout.totalPhotos,
  photoWidthPx: layout.photoWidthPx,
  photoHeightPx: layout.photoHeightPx,
  topMarginMm: layout.effectiveMarginTopMm,
  leftMarginMm: layout.effectiveMarginLeftMm,
  spacingHorizMm: layout.spacingHorizontalMm,
  spacingVertMm: layout.spacingVerticalMm,
});

// Render high-fidelity SVG of the A4 sheet
// 210 × 297 mm viewBox
const svgWidth = 210;
const svgHeight = 297;

let svgPhotos = '';
for (let i = 0; i < layout.placements.length; i++) {
  const p = layout.placements[i];
  svgPhotos += `
    <g transform="translate(${p.xMm.toFixed(2)}, ${p.yMm.toFixed(2)})">
      <!-- Photo image -->
      <image href="${base64Img}" width="${p.widthMm.toFixed(2)}" height="${p.heightMm.toFixed(2)}" preserveAspectRatio="xMidYMid slice" />
      <!-- 0.2mm dark cut border -->
      <rect x="0" y="0" width="${p.widthMm.toFixed(2)}" height="${p.heightMm.toFixed(2)}" fill="none" stroke="#222222" stroke-width="0.2" />
      <!-- Subtle index mark -->
      <text x="${(p.widthMm - 1.5).toFixed(2)}" y="${(p.heightMm - 1.5).toFixed(2)}" font-size="2" font-family="monospace" fill="#ffffff" text-anchor="end" opacity="0.85">${i + 1}</text>
    </g>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}mm" height="${svgHeight}mm" style="background:#ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
  <!-- A4 Paper Background -->
  <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#ffffff" />
  
  <!-- Printable Margins Guide (Subtle Dashed) -->
  <rect x="2.91" y="3.1" width="204.18" height="278.24" fill="none" stroke="#3b82f6" stroke-width="0.15" stroke-dasharray="1,1" opacity="0.4" />
  
  <!-- Photo Grid: 56 photos (7 cols × 8 rows) -->
  ${svgPhotos}
</svg>`;

const artifactPath = 'C:\\Users\\SK MD SAMIM\\.gemini\\antigravity\\brain\\1ee97d8e-2279-47b7-827e-588329fde33e\\preview_a4_compact_27x32_56_copies.svg';
fs.writeFileSync(artifactPath, svg, 'utf8');
console.log('Saved SVG preview artifact to:', artifactPath);
