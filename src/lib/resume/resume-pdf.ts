import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  rgb,
  PDFString,
  type PDFPage,
  type PDFFont,
  type RGB,
  type PDFImage,
} from "pdf-lib";
import type { ResumeData, ResumeTemplateId } from "../../types/resume.ts";
import { getTemplateDefaultColors, isValidHexColor } from "../../constants/resume-defaults.ts";
import {
  convertDataUrlToPng,
  convertDataUrlToCircularPng,
  getPhotoDimensions,
} from "./resume-photo.ts";

export interface PdfGenerationOptions {
  includeCoverLetter?: boolean;
}

export function hexToPdfRgb(hex: string): RGB {
  if (!hex || typeof hex !== "string") {
    return rgb(0.1, 0.1, 0.1);
  }
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) {
    return rgb(0.1, 0.1, 0.1);
  }
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return rgb(r, g, b);
}

export interface TemplateTheme {
  primaryFontName: StandardFonts;
  boldFontName: StandardFonts;
  italicFontName: StandardFonts;
  primaryColor: RGB;
  headingColor: RGB;
  bodyColor: RGB;
  mutedColor: RGB;
  accentLineColor: RGB;
  nameColor?: RGB;
  titleColor?: RGB;
  lineSpacing: number;
  sectionGap: number;
  itemGap: number;
  centerHeader: boolean;
  uppercaseSectionTitles: boolean;
  headerRuleStyle: "none" | "single" | "double" | "accent";
}

const THEMES: Record<ResumeTemplateId, TemplateTheme> = {
  "modern-professional": {
    primaryFontName: StandardFonts.Helvetica,
    boldFontName: StandardFonts.HelveticaBold,
    italicFontName: StandardFonts.HelveticaOblique,
    primaryColor: rgb(0.1, 0.28, 0.6), // #1a4799
    headingColor: rgb(0.08, 0.15, 0.3), // #14264d
    bodyColor: rgb(0.15, 0.18, 0.24), // #262e3d
    mutedColor: rgb(0.4, 0.45, 0.52), // #667385
    accentLineColor: rgb(0.2, 0.45, 0.8),
    lineSpacing: 1.25,
    sectionGap: 14,
    itemGap: 8,
    centerHeader: false,
    uppercaseSectionTitles: true,
    headerRuleStyle: "accent",
  },
  "minimal-ats": {
    primaryFontName: StandardFonts.Helvetica,
    boldFontName: StandardFonts.HelveticaBold,
    italicFontName: StandardFonts.HelveticaOblique,
    primaryColor: rgb(0.05, 0.05, 0.05),
    headingColor: rgb(0.02, 0.02, 0.02),
    bodyColor: rgb(0.1, 0.1, 0.1),
    mutedColor: rgb(0.3, 0.3, 0.3),
    accentLineColor: rgb(0.15, 0.15, 0.15),
    lineSpacing: 1.2,
    sectionGap: 12,
    itemGap: 7,
    centerHeader: false,
    uppercaseSectionTitles: true,
    headerRuleStyle: "single",
  },
  "classic-corporate": {
    primaryFontName: StandardFonts.TimesRoman,
    boldFontName: StandardFonts.TimesRomanBold,
    italicFontName: StandardFonts.TimesRomanItalic,
    primaryColor: rgb(0.12, 0.12, 0.14),
    headingColor: rgb(0.05, 0.05, 0.08),
    bodyColor: rgb(0.15, 0.15, 0.18),
    mutedColor: rgb(0.35, 0.35, 0.38),
    accentLineColor: rgb(0.2, 0.2, 0.25),
    lineSpacing: 1.22,
    sectionGap: 13,
    itemGap: 7,
    centerHeader: true,
    uppercaseSectionTitles: true,
    headerRuleStyle: "double",
  },
  "modern-two-column": {
    primaryFontName: StandardFonts.Helvetica,
    boldFontName: StandardFonts.HelveticaBold,
    italicFontName: StandardFonts.HelveticaOblique,
    primaryColor: rgb(0.12, 0.32, 0.65), // Cobalt #1e40af
    headingColor: rgb(0.08, 0.14, 0.25),
    bodyColor: rgb(0.18, 0.22, 0.28),
    mutedColor: rgb(0.42, 0.46, 0.54),
    accentLineColor: rgb(0.12, 0.32, 0.65),
    lineSpacing: 1.24,
    sectionGap: 14,
    itemGap: 8,
    centerHeader: false,
    uppercaseSectionTitles: true,
    headerRuleStyle: "accent",
  },
  executive: {
    primaryFontName: StandardFonts.TimesRoman,
    boldFontName: StandardFonts.TimesRomanBold,
    italicFontName: StandardFonts.TimesRomanItalic,
    primaryColor: rgb(0.06, 0.1, 0.2), // Slate 900
    headingColor: rgb(0.04, 0.06, 0.12), // Slate 950
    bodyColor: rgb(0.15, 0.18, 0.24),
    mutedColor: rgb(0.35, 0.4, 0.48),
    accentLineColor: rgb(0.06, 0.1, 0.2),
    lineSpacing: 1.25,
    sectionGap: 14,
    itemGap: 8,
    centerHeader: false,
    uppercaseSectionTitles: true,
    headerRuleStyle: "single",
  },
  creative: {
    primaryFontName: StandardFonts.Helvetica,
    boldFontName: StandardFonts.HelveticaBold,
    italicFontName: StandardFonts.HelveticaOblique,
    primaryColor: rgb(0.48, 0.23, 0.93), // Violet #7c3aed
    headingColor: rgb(0.22, 0.1, 0.4),
    bodyColor: rgb(0.16, 0.16, 0.2),
    mutedColor: rgb(0.44, 0.4, 0.52),
    accentLineColor: rgb(0.48, 0.23, 0.93),
    lineSpacing: 1.25,
    sectionGap: 14,
    itemGap: 8,
    centerHeader: false,
    uppercaseSectionTitles: true,
    headerRuleStyle: "accent",
  },
  "student-fresher": {
    primaryFontName: StandardFonts.Helvetica,
    boldFontName: StandardFonts.HelveticaBold,
    italicFontName: StandardFonts.HelveticaOblique,
    primaryColor: rgb(0.05, 0.58, 0.53), // Teal #0d9488
    headingColor: rgb(0.05, 0.32, 0.3),
    bodyColor: rgb(0.14, 0.2, 0.22),
    mutedColor: rgb(0.35, 0.45, 0.48),
    accentLineColor: rgb(0.05, 0.58, 0.53),
    lineSpacing: 1.24,
    sectionGap: 13,
    itemGap: 8,
    centerHeader: false,
    uppercaseSectionTitles: true,
    headerRuleStyle: "accent",
  },
  "elegant-minimal": {
    primaryFontName: StandardFonts.Helvetica,
    boldFontName: StandardFonts.HelveticaBold,
    italicFontName: StandardFonts.HelveticaOblique,
    primaryColor: rgb(0.16, 0.15, 0.14), // Stone 900
    headingColor: rgb(0.16, 0.15, 0.14),
    bodyColor: rgb(0.24, 0.23, 0.22),
    mutedColor: rgb(0.48, 0.46, 0.44),
    accentLineColor: rgb(0.82, 0.82, 0.8), // Stone 300
    lineSpacing: 1.26,
    sectionGap: 15,
    itemGap: 7,
    centerHeader: false,
    uppercaseSectionTitles: true,
    headerRuleStyle: "single",
  },
};

/**
 * Word-wrap a string into lines that do not exceed maxWidth points.
 */
function wrapText(text: string, maxWidth: number, font: PDFFont, fontSize: number): string[] {
  if (!text) return [];
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) {
      lines.push("");
      continue;
    }

    const words = trimmedPara.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single long word exceeding width
          let partialWord = "";
          for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const testPartial = partialWord + char;
            if (font.widthOfTextAtSize(testPartial, fontSize) <= maxWidth) {
              partialWord = testPartial;
            } else {
              lines.push(partialWord);
              partialWord = char;
            }
          }
          currentLine = partialWord;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Sanitize text for standard PDF WinAnsi / Latin1 encoding
 */
function sanitizePdfText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2022\u25E6\u2043]/g, "*")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\x7F]/g, (match) => {
      const code = match.charCodeAt(0);
      if (code >= 160 && code <= 255) return match;
      return " ";
    });
}

/**
 * Helper to embed an image (PNG or JPG) into the PDF document.
 */
async function embedProfilePhoto(
  doc: PDFDocument,
  photoUrl?: string,
  isCircle?: boolean
): Promise<PDFImage | null> {
  if (!photoUrl || typeof photoUrl !== "string" || !photoUrl.trim()) return null;

  try {
    let cleanUrl = photoUrl.trim();

    if (cleanUrl.startsWith("data:image/")) {
      // If circular style requested, mask into a circular PNG with transparent background
      if (isCircle) {
        const circularPng = await convertDataUrlToCircularPng(cleanUrl);
        if (circularPng) {
          cleanUrl = circularPng;
        }
      }

      const [header] = cleanUrl.split(",");
      // If WebP, convert to PNG via offscreen canvas if in browser
      if (header.includes("image/webp")) {
        const pngUrl = await convertDataUrlToPng(cleanUrl);
        if (pngUrl) {
          cleanUrl = pngUrl;
        }
      }

      const [, base64Data] = cleanUrl.split(",");
      if (!base64Data) return null;

      const isPng = header.includes("image/png") || (isCircle && cleanUrl.startsWith("data:image/png"));

      let bytes: Uint8Array;
      if (typeof Buffer !== "undefined") {
        bytes = new Uint8Array(Buffer.from(base64Data, "base64"));
      } else {
        const binStr = atob(base64Data);
        bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          bytes[i] = binStr.charCodeAt(i);
        }
      }

      if (isPng) {
        return await doc.embedPng(bytes);
      } else {
        return await doc.embedJpg(bytes);
      }
    }
  } catch (err) {
    console.warn("Could not embed profile photo in PDF:", err);
  }
  return null;
}

/**
 * Helper: Adds a clickable URI hyperlink annotation to a page area.
 */
function addHyperlink(
  doc: PDFDocument,
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  uri: string
): void {
  try {
    if (!uri || !uri.trim()) return;
    const cleanUri = uri.trim();
    const linkAnnot = doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, y, x + width, y + height],
      Border: [0, 0, 0],
      A: {
        Type: "Action",
        S: "URI",
        URI: PDFString.of(cleanUri),
      },
    });
    const linkRef = doc.context.register(linkAnnot);
    page.node.addAnnot(linkRef);
  } catch {
    // Graceful fallback
  }
}

/**
 * Contact item icon types and SVG vector path definitions (Lucide standard).
 */
export type ContactIconType =
  | "email"
  | "phone"
  | "location"
  | "linkedin"
  | "github"
  | "portfolio"
  | "twitter";

export interface ContactItem {
  icon?: ContactIconType;
  label: string;
  url?: string;
}

export const CONTACT_ICONS: Record<ContactIconType, string[]> = {
  email: [
    "M 4 4 h 16 a 2 2 0 0 1 2 2 v 12 a 2 2 0 0 1 -2 2 H 4 a 2 2 0 0 1 -2 -2 V 6 a 2 2 0 0 1 2 -2 Z",
    "M 22 7 L 13.03 12.7 a 1.94 1.94 0 0 1 -2.06 0 L 2 7",
  ],
  phone: [
    "M 22 16.92 v 3 a 2 2 0 0 1 -2.18 2 a 19.79 19.79 0 0 1 -8.63 -3.07 a 19.5 19.5 0 0 1 -6 -6 a 19.79 19.79 0 0 1 -3.07 -8.67 A 2 2 0 0 1 4.11 2 h 3 a 2 2 0 0 1 2 1.72 a 12.84 12.84 0 0 0 0.7 2.81 a 2 2 0 0 1 -0.45 2.11 L 8.09 9.91 a 16 16 0 0 0 6 6 l 1.27 -1.27 a 2 2 0 0 1 2.11 -0.45 a 12.84 12.84 0 0 0 2.81 0.7 A 2 2 0 0 1 22 16.92 Z",
  ],
  location: [
    "M 20 10 c 0 4.993 -5.539 10.193 -7.399 11.799 a 1 1 0 0 1 -1.202 0 C 9.539 20.193 4 14.993 4 10 a 8 8 0 0 1 16 0 Z",
    "M 12 7 A 3 3 0 1 0 12 13 A 3 3 0 1 0 12 7",
  ],
  linkedin: [
    "M 16 8 a 6 6 0 0 1 6 6 v 7 h -4 v -7 a 2 2 0 0 0 -2 -2 a 2 2 0 0 0 -2 2 v 7 h -4 v -7 a 6 6 0 0 1 6 -6 Z",
    "M 2 9 h 4 v 12 H 2 Z",
    "M 4 2 A 2 2 0 1 0 4 6 A 2 2 0 1 0 4 2",
  ],
  github: [
    "M 15 22 v -4 a 4.8 4.8 0 0 0 -1 -3.5 c 3 0 6 -2 6 -5.5 c 0.08 -1.25 -0.27 -2.48 -1 -3.5 c 0.28 -1.15 0.28 -2.35 0 -3.5 c 0 0 -1 0 -3 1.5 c -2.64 -0.5 -5.36 -0.5 -8 0 c -2 -1.5 -3 -1.5 -3 -1.5 c -0.3 1.15 -0.3 2.35 0 3.5 A 5.403 5.403 0 0 0 4 9 c 0 3.5 3 5.5 6 5.5 c -0.39 0.49 -0.68 1.05 -0.85 1.65 c -0.17 0.6 -0.22 1.23 -0.15 1.85 v 4",
    "M 9 18 c -4.51 2 -5 -2 -7 -2",
  ],
  portfolio: [
    "M 12 2 A 10 10 0 1 0 12 22 A 10 10 0 1 0 12 2",
    "M 12 2 a 14.5 14.5 0 0 0 0 20 a 14.5 14.5 0 0 0 0 -20",
    "M 2 12 h 20",
  ],
  twitter: [
    "M 22 4 s -0.7 2.1 -2 3.4 c 1.6 10 -9.4 17.3 -18 11.6 c 2.2 0.1 4.4 -0.6 6 -2 C 3 15.5 0.5 9.6 3 5 c 2.2 2.6 5.6 4.1 9 4 c -0.9 -4.2 4 -6.6 7 -3.8 c 1.1 0 3 -1.2 3 -1.2 Z",
  ],
};

/**
 * Shared context passed to template-specific renderers
 */
interface PdfRenderContext {
  doc: PDFDocument;
  pages: PDFPage[];
  pageWidth: number;
  pageHeight: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  contentWidth: number;
  fontRegular: PDFFont;
  fontBold: PDFFont;
  fontItalic: PDFFont;
  nameFontSize: number;
  titleFontSize: number;
  contactFontSize: number;
  sectionHeadingFontSize: number;
  bodyFontSize: number;
  lineSpacingMult: number;
  sectionGap: number;
  itemGap: number;
  profileImage: PDFImage | null;
  photoDims: ReturnType<typeof getPhotoDimensions>;
  photoSize: { w: number; h: number };
  hasPhoto: boolean;
  theme: TemplateTheme;
  currentPage: PDFPage;
  currentY: number;
  ensureVerticalSpace: (requiredHeight: number) => void;
  drawTextLine: (text: string, x: number, y: number, font: PDFFont, size: number, color: RGB) => void;
  contactList: ContactItem[];
}

/**
 * Helper: Build unified contact list with icon metadata matching template preview
 */
function buildContactList(
  info: ResumeData["personalInfo"],
  templateId?: ResumeTemplateId
): ContactItem[] {
  const contactList: ContactItem[] = [];
  if (info.email) {
    contactList.push({ icon: "email", label: info.email, url: `mailto:${info.email}` });
  }
  if (info.phone) {
    contactList.push({ icon: "phone", label: info.phone, url: `tel:${info.phone.replace(/\s+/g, "")}` });
  }
  if (info.location) {
    contactList.push({ icon: "location", label: info.location });
  }
  if (info.linkedIn) {
    const handle = info.linkedIn.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "").replace(/\/$/, "");
    const label = templateId === "modern-two-column" && handle ? `LinkedIn: ${handle}` : "LinkedIn";
    contactList.push({
      icon: "linkedin",
      label,
      url: info.linkedIn,
    });
  }
  if (info.github) {
    const handle = info.github.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "");
    const label = templateId === "modern-two-column" && handle ? `GitHub: ${handle}` : "GitHub";
    contactList.push({
      icon: "github",
      label,
      url: info.github,
    });
  }
  if (info.portfolio) {
    const cleanUrl = info.portfolio.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
    const label = templateId === "modern-two-column" && cleanUrl ? cleanUrl : "Portfolio";
    contactList.push({
      icon: "portfolio",
      label,
      url: info.portfolio,
    });
  }
  if (info.twitter) {
    const handle = info.twitter.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "@").replace(/\/$/, "");
    const label = templateId === "modern-two-column" && handle ? handle : "Twitter";
    contactList.push({
      icon: "twitter",
      label,
      url: info.twitter,
    });
  }
  return contactList;
}

/**
 * Helper: Unified Header Layout Engine
 * Ensures candidate text is on the left, photo is on the right, text NEVER enters photo space,
 * and the header divider rule is strictly below BOTH text and photo!
 */
function renderCommonHeader(
  ctx: PdfRenderContext,
  data: ResumeData,
  options?: {
    customTitleColor?: RGB;
    customRuleThickness?: number;
    customRuleColor?: RGB;
    isDoubleRule?: boolean;
    isSplitName?: boolean;
    badgeText?: string;
    isCentered?: boolean;
    skipContactList?: boolean;
  }
): void {
  const { fontBold, fontRegular, fontItalic, theme } = ctx;
  const fullName = data.personalInfo.fullName.trim() || "Your Name";
  const jobTitle = data.personalInfo.jobTitle.trim();

  // Draw photo cleanly in top-right of page 1 without borders
  const hasPhoto = ctx.hasPhoto && Boolean(ctx.profileImage);
  const photoSize = ctx.photoSize;
  const marginLeft = ctx.marginLeft;
  const contentWidth = ctx.contentWidth;
  const pageHeight = ctx.pageHeight;
  const marginTop = ctx.marginTop;
  const currentPage = ctx.currentPage;
  const profileImage = ctx.profileImage;

  // If photo is present, draw photo in top-right of page 1 without borders or decorative outlines
  if (hasPhoto && profileImage) {
    const photoX = marginLeft + contentWidth - photoSize.w;
    const photoY = pageHeight - marginTop - photoSize.h;

    currentPage.drawImage(profileImage, {
      x: photoX,
      y: photoY,
      width: photoSize.w,
      height: photoSize.h,
    });
  }

  // Width available for candidate info on the left
  const textAvailableWidth = hasPhoto
    ? ctx.contentWidth - photoSize.w - 18
    : ctx.contentWidth;

  const isCentered = options?.isCentered && !hasPhoto;

  // Optional badge at top (e.g. Creative template)
  if (options?.badgeText) {
    const badgeW = fontBold.widthOfTextAtSize(options.badgeText, 7.5) + 14;
    const badgeH = 14;
    ctx.currentPage.drawRectangle({
      x: ctx.marginLeft,
      y: ctx.currentY - badgeH,
      width: badgeW,
      height: badgeH,
      color: rgb(0.93, 0.91, 0.99),
    });
    ctx.drawTextLine(options.badgeText, ctx.marginLeft + 7, ctx.currentY - 10, fontBold, 7.5, theme.primaryColor);
    ctx.currentY -= badgeH + 6;
  }

  // Name
  if (options?.isSplitName) {
    // Editorial split name: first name bold, rest regular
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || "";
    const restName = nameParts.slice(1).join(" ");
    const firstW = fontBold.widthOfTextAtSize(firstName, ctx.nameFontSize);
    const spaceW = fontRegular.widthOfTextAtSize(" ", ctx.nameFontSize);

    ctx.drawTextLine(firstName, ctx.marginLeft, ctx.currentY - ctx.nameFontSize, fontBold, ctx.nameFontSize, theme.nameColor || theme.headingColor);
    if (restName) {
      ctx.drawTextLine(restName, ctx.marginLeft + firstW + spaceW, ctx.currentY - ctx.nameFontSize, fontRegular, ctx.nameFontSize, theme.mutedColor || rgb(0.35, 0.33, 0.32));
    }
  } else {
    const nameW = fontBold.widthOfTextAtSize(fullName, ctx.nameFontSize);
    const nameX = isCentered ? ctx.marginLeft + (textAvailableWidth - nameW) / 2 : ctx.marginLeft;
    ctx.drawTextLine(fullName, nameX, ctx.currentY - ctx.nameFontSize, fontBold, ctx.nameFontSize, theme.nameColor || theme.headingColor);
  }
  ctx.currentY -= ctx.nameFontSize + 4;

  // Job Title
  if (jobTitle) {
    const titleFont = (theme.primaryFontName === StandardFonts.TimesRoman && !options?.customTitleColor)
      ? fontItalic
      : fontBold;
    const titleColor = options?.customTitleColor || theme.titleColor || theme.primaryColor;
    const titleW = titleFont.widthOfTextAtSize(jobTitle, ctx.titleFontSize);
    const titleX = isCentered ? ctx.marginLeft + (textAvailableWidth - titleW) / 2 : ctx.marginLeft;
    ctx.drawTextLine(jobTitle, titleX, ctx.currentY - ctx.titleFontSize, titleFont, ctx.titleFontSize, titleColor);
    ctx.currentY -= ctx.titleFontSize + 4;
  }

  // Contact list strictly bounded to textAvailableWidth (can be skipped for templates with dedicated sidebar contacts)
  if (!options?.skipContactList && ctx.contactList.length > 0) {
    renderInlineContactList(ctx, ctx.contactList, textAvailableWidth, isCentered, options?.customTitleColor);
  }

  // CRITICAL: Header bottom MUST be strictly below BOTH the candidate text AND the profile photo!
  const textBottomY = ctx.currentY;
  const photoBottomY = hasPhoto ? ctx.pageHeight - ctx.marginTop - photoSize.h : textBottomY;
  const headerBottomY = Math.min(textBottomY, photoBottomY) - 10;

  ctx.currentY = headerBottomY;

  // Draw header divider rule (NEVER crosses the photo!)
  if (options?.isDoubleRule) {
    const ruleColor = options?.customRuleColor ?? theme.accentLineColor;
    ctx.currentPage.drawLine({
      start: { x: ctx.marginLeft, y: ctx.currentY },
      end: { x: ctx.marginLeft + ctx.contentWidth, y: ctx.currentY },
      thickness: 1.2,
      color: ruleColor,
    });
    ctx.currentPage.drawLine({
      start: { x: ctx.marginLeft, y: ctx.currentY - 2.5 },
      end: { x: ctx.marginLeft + ctx.contentWidth, y: ctx.currentY - 2.5 },
      thickness: 0.5,
      color: ruleColor,
    });
    ctx.currentY -= 14;
  } else {
    ctx.currentPage.drawLine({
      start: { x: ctx.marginLeft, y: ctx.currentY },
      end: { x: ctx.marginLeft + ctx.contentWidth, y: ctx.currentY },
      thickness: options?.customRuleThickness ?? 1.5,
      color: options?.customRuleColor ?? theme.accentLineColor,
    });
    ctx.currentY -= 14;
  }
}

// =========================================================================
// TEMPLATE 1: MODERN PROFESSIONAL
// =========================================================================
function renderModernProfessional(ctx: PdfRenderContext, data: ResumeData): void {
  renderCommonHeader(ctx, data, {
    customRuleThickness: 1.5,
    customRuleColor: ctx.theme.accentLineColor,
  });

  renderSummarySection(ctx, data.summary);
  renderExperienceSection(ctx, data.experiences);
  renderEducationSection(ctx, data.education);
  renderSkillsSection(ctx, data.skills);
  renderProjectsSection(ctx, data.projects);
  renderCertificationsSection(ctx, data.certifications);
  renderLanguagesSection(ctx, data.languages);
  renderAwardsAchievementsSection(ctx, data.awards, data.achievements);
}

// =========================================================================
// TEMPLATE 2: MINIMAL ATS
// =========================================================================
function renderMinimalAts(ctx: PdfRenderContext, data: ResumeData): void {
  renderCommonHeader(ctx, data, {
    customTitleColor: ctx.theme.titleColor || ctx.theme.primaryColor,
    customRuleThickness: 0.75,
    customRuleColor: ctx.theme.accentLineColor,
  });

  renderSummarySection(ctx, data.summary);
  renderExperienceSection(ctx, data.experiences);
  renderEducationSection(ctx, data.education);
  renderSkillsSection(ctx, data.skills);
  renderProjectsSection(ctx, data.projects);
  renderCertificationsSection(ctx, data.certifications);
  renderLanguagesSection(ctx, data.languages);
  renderAwardsAchievementsSection(ctx, data.awards, data.achievements);
}

// =========================================================================
// TEMPLATE 3: CLASSIC CORPORATE
// =========================================================================
function renderClassicCorporate(ctx: PdfRenderContext, data: ResumeData): void {
  renderCommonHeader(ctx, data, {
    isDoubleRule: true,
    isCentered: !ctx.hasPhoto,
  });

  renderSummarySection(ctx, data.summary);
  renderExperienceSection(ctx, data.experiences);
  renderEducationSection(ctx, data.education);
  renderSkillsSection(ctx, data.skills);
  renderProjectsSection(ctx, data.projects);
  renderCertificationsSection(ctx, data.certifications);
  renderLanguagesSection(ctx, data.languages);
  renderAwardsAchievementsSection(ctx, data.awards, data.achievements);
}

// =========================================================================
// TEMPLATE 4: MODERN TWO-COLUMN (INDEPENDENT COLUMN WRITERS!)
// =========================================================================
function renderModernTwoColumn(ctx: PdfRenderContext, data: ResumeData): void {
  const cobalt = ctx.theme.primaryColor;

  // Render top header cleanly across full width (contacts are rendered in dedicated left sidebar)
  renderCommonHeader(ctx, data, {
    customTitleColor: ctx.theme.titleColor || cobalt,
    customRuleThickness: 2,
    customRuleColor: ctx.theme.accentLineColor,
    skipContactList: true,
  });

  // Column Geometry
  const sidebarWidth = 168;
  const gutter = 18;
  const mainWidth = ctx.contentWidth - sidebarWidth - gutter;
  const sidebarX = ctx.marginLeft;
  const dividerX = sidebarX + sidebarWidth + gutter / 2;
  const mainX = sidebarX + sidebarWidth + gutter;

  const topColY = ctx.currentY;

  // Independent Column Writer for Left Sidebar
  let sidebarPageIndex = 0;
  let sidebarY = topColY;

  function ensureSidebarSpace(needed: number): PDFPage {
    if (sidebarY - needed < ctx.marginBottom) {
      sidebarPageIndex++;
      while (ctx.pages.length <= sidebarPageIndex) {
        ctx.pages.push(ctx.doc.addPage(PageSizes.A4));
      }
      sidebarY = ctx.pageHeight - ctx.marginTop;
    }
    return ctx.pages[sidebarPageIndex];
  }

  function drawSidebarText(text: string, x: number, y: number, font: PDFFont, size: number, color: RGB): void {
    const clean = sanitizePdfText(text);
    if (!clean) return;
    const page = ctx.pages[sidebarPageIndex];
    page.drawText(clean, { x, y, font, size, color });
  }

  function drawSidebarHeading(title: string): void {
    ensureSidebarSpace(28);
    const page = ctx.pages[sidebarPageIndex];
    drawSidebarText(title, sidebarX, sidebarY - 10, ctx.fontBold, 10, ctx.theme.headingColor);
    page.drawLine({
      start: { x: sidebarX, y: sidebarY - 13 },
      end: { x: sidebarX + sidebarWidth, y: sidebarY - 13 },
      thickness: 1,
      color: ctx.theme.accentLineColor,
    });
    sidebarY -= 20;
  }

  // Independent Column Writer for Right Main Column
  let mainPageIndex = 0;
  let mainY = topColY;

  function ensureMainSpace(needed: number): PDFPage {
    if (mainY - needed < ctx.marginBottom) {
      mainPageIndex++;
      while (ctx.pages.length <= mainPageIndex) {
        ctx.pages.push(ctx.doc.addPage(PageSizes.A4));
      }
      mainY = ctx.pageHeight - ctx.marginTop;
    }
    return ctx.pages[mainPageIndex];
  }

  function drawMainText(text: string, x: number, y: number, font: PDFFont, size: number, color: RGB): void {
    const clean = sanitizePdfText(text);
    if (!clean) return;
    const page = ctx.pages[mainPageIndex];
    page.drawText(clean, { x, y, font, size, color });
  }

  function drawMainHeading(title: string): void {
    ensureMainSpace(35);
    const page = ctx.pages[mainPageIndex];
    const titleW = ctx.fontBold.widthOfTextAtSize(title, 11);
    drawMainText(title, mainX, mainY - 11, ctx.fontBold, 11, ctx.theme.headingColor);
    page.drawLine({
      start: { x: mainX, y: mainY - 14 },
      end: { x: mainX + titleW + 15, y: mainY - 14 },
      thickness: 1.5,
      color: ctx.theme.accentLineColor,
    });
    page.drawLine({
      start: { x: mainX + titleW + 15, y: mainY - 14 },
      end: { x: mainX + mainWidth, y: mainY - 14 },
      thickness: 0.5,
      color: rgb(0.85, 0.88, 0.92),
    });
    mainY -= 22;
  }

  // --- 1. POPULATE SIDEBAR (Left Column) ---
  // Contact with vector icons
  if (ctx.contactList.length > 0) {
    drawSidebarHeading("CONTACT");
    const iconScale = 0.34;
    const iconSize = 24 * iconScale;
    const iconTextGap = 4;
    const textIndent = iconSize + iconTextGap;

    for (const item of ctx.contactList) {
      const hasIcon = item.icon && CONTACT_ICONS[item.icon];
      const availableTextWidth = hasIcon ? sidebarWidth - textIndent : sidebarWidth;
      const lines = wrapText(item.label, availableTextWidth, ctx.fontRegular, 8.5);

      for (let lIdx = 0; lIdx < lines.length; lIdx++) {
        const line = lines[lIdx];
        ensureSidebarSpace(13);
        const textX = hasIcon ? sidebarX + textIndent : sidebarX;
        const textY = sidebarY - 8.5;

        // Draw icon on the first line of the item
        if (hasIcon && lIdx === 0) {
          const iconY = textY + 7.2;
          const page = ctx.pages[sidebarPageIndex];
          const paths = CONTACT_ICONS[item.icon!];
          for (const p of paths) {
            page.drawSvgPath(p, {
              x: sidebarX,
              y: iconY,
              scale: iconScale,
              borderColor: cobalt,
              borderWidth: 1.0,
            });
          }
        }

        drawSidebarText(line, textX, textY, ctx.fontRegular, 8.5, rgb(0.25, 0.28, 0.35));

        if (item.url) {
          const w = ctx.fontRegular.widthOfTextAtSize(sanitizePdfText(line), 8.5);
          const linkX = hasIcon && lIdx === 0 ? sidebarX : textX;
          const linkW = hasIcon && lIdx === 0 ? textIndent + w : w;
          addHyperlink(ctx.doc, ctx.pages[sidebarPageIndex], linkX, textY - 2, linkW, 11, item.url);
        }
        sidebarY -= 12;
      }
      sidebarY -= 2;
    }
    sidebarY -= 8;
  }

  // Education
  if (data.education && data.education.length > 0) {
    drawSidebarHeading("EDUCATION");
    for (const edu of data.education) {
      const degreeText = edu.degree
        ? `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}`
        : edu.fieldOfStudy;
      if (degreeText) {
        const degLines = wrapText(degreeText, sidebarWidth, ctx.fontBold, 9);
        for (const dl of degLines) {
          ensureSidebarSpace(12);
          drawSidebarText(dl, sidebarX, sidebarY - 9, ctx.fontBold, 9, rgb(0.1, 0.14, 0.25));
          sidebarY -= 11;
        }
      }
      if (edu.institution) {
        ensureSidebarSpace(11);
        drawSidebarText(edu.institution, sidebarX, sidebarY - 8.5, ctx.fontBold, 8.5, cobalt);
        sidebarY -= 11;
      }
      if (edu.graduationYear) {
        ensureSidebarSpace(10);
        drawSidebarText(edu.graduationYear, sidebarX, sidebarY - 8, ctx.fontRegular, 8, rgb(0.45, 0.5, 0.55));
        sidebarY -= 10;
      }
      sidebarY -= 5;
    }
    sidebarY -= 8;
  }

  // Skills
  const techSkills = data.skills?.technical || [];
  const softSkills = data.skills?.soft || [];
  if (techSkills.length > 0 || softSkills.length > 0) {
    drawSidebarHeading("SKILLS");
    if (techSkills.length > 0) {
      ensureSidebarSpace(12);
      drawSidebarText("Technical:", sidebarX, sidebarY - 8.5, ctx.fontBold, 8.5, rgb(0.2, 0.25, 0.3));
      sidebarY -= 11;
      const techStr = techSkills.join("  *  ");
      const techLines = wrapText(techStr, sidebarWidth, ctx.fontRegular, 8.5);
      for (const line of techLines) {
        ensureSidebarSpace(11);
        drawSidebarText(line, sidebarX, sidebarY - 8.5, ctx.fontRegular, 8.5, rgb(0.25, 0.28, 0.35));
        sidebarY -= 11;
      }
      sidebarY -= 6;
    }
    if (softSkills.length > 0) {
      ensureSidebarSpace(12);
      drawSidebarText("Core Competencies:", sidebarX, sidebarY - 8.5, ctx.fontBold, 8.5, rgb(0.2, 0.25, 0.3));
      sidebarY -= 11;
      const softStr = softSkills.join("  *  ");
      const softLines = wrapText(softStr, sidebarWidth, ctx.fontRegular, 8.5);
      for (const line of softLines) {
        ensureSidebarSpace(11);
        drawSidebarText(line, sidebarX, sidebarY - 8.5, ctx.fontRegular, 8.5, rgb(0.25, 0.28, 0.35));
        sidebarY -= 11;
      }
      sidebarY -= 6;
    }
    sidebarY -= 8;
  }

  // Languages
  if (data.languages && data.languages.length > 0) {
    drawSidebarHeading("LANGUAGES");
    for (const lang of data.languages) {
      ensureSidebarSpace(13);
      const str = lang.proficiency ? `${lang.language} (${lang.proficiency})` : lang.language;
      drawSidebarText(str, sidebarX, sidebarY - 8.5, ctx.fontRegular, 8.5, rgb(0.25, 0.28, 0.35));
      sidebarY -= 12;
    }
    sidebarY -= 8;
  }

  // Certifications (in Sidebar)
  if (data.certifications && data.certifications.length > 0) {
    drawSidebarHeading("CERTIFICATIONS");
    for (const cert of data.certifications) {
      ensureSidebarSpace(14);
      const certTitle = `${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ""}`;
      const cLines = wrapText(certTitle, sidebarWidth, ctx.fontBold, 8.5);
      for (const cl of cLines) {
        drawSidebarText(cl, sidebarX, sidebarY - 8.5, ctx.fontBold, 8.5, rgb(0.2, 0.25, 0.3));
        if (cert.url) {
          const w = ctx.fontBold.widthOfTextAtSize(sanitizePdfText(cl), 8.5);
          addHyperlink(ctx.doc, ctx.pages[sidebarPageIndex], sidebarX, sidebarY - 8.5 - 2, w, 11, cert.url);
        }
        sidebarY -= 11;
      }
      if (cert.date) {
        drawSidebarText(cert.date, sidebarX, sidebarY - 8, ctx.fontRegular, 8, rgb(0.45, 0.5, 0.55));
        sidebarY -= 10;
      }
      sidebarY -= 4;
    }
  }

  // --- 2. POPULATE MAIN COLUMN (Right Column) ---
  // Summary
  if (data.summary && data.summary.trim()) {
    drawMainHeading("PROFESSIONAL SUMMARY");
    const summaryLines = wrapText(data.summary.trim(), mainWidth, ctx.fontRegular, 9);
    for (const line of summaryLines) {
      ensureMainSpace(13);
      drawMainText(line, mainX, mainY - 9, ctx.fontRegular, 9, rgb(0.18, 0.22, 0.28));
      mainY -= 12;
    }
    mainY -= 12;
  }

  // Work Experience
  if (data.experiences && data.experiences.length > 0) {
    drawMainHeading("WORK EXPERIENCE");
    for (const exp of data.experiences) {
      ensureMainSpace(30);
      const titleText = exp.jobTitle || "Job Title";
      const dateText = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`.trim();

      drawMainText(titleText, mainX, mainY - 9.5, ctx.fontBold, 9.5, rgb(0.08, 0.14, 0.25));
      if (dateText && dateText !== "-") {
        const dw = ctx.fontRegular.widthOfTextAtSize(dateText, 8.5);
        drawMainText(dateText, mainX + mainWidth - dw, mainY - 8.5, ctx.fontRegular, 8.5, rgb(0.45, 0.5, 0.55));
      }
      mainY -= 12;

      if (exp.company || exp.location) {
        if (exp.company) {
          drawMainText(exp.company, mainX, mainY - 9, ctx.fontBold, 9, cobalt);
        }
        if (exp.location) {
          const lw = ctx.fontRegular.widthOfTextAtSize(exp.location, 8.5);
          drawMainText(exp.location, mainX + mainWidth - lw, mainY - 8.5, ctx.fontRegular, 8.5, rgb(0.45, 0.5, 0.55));
        }
        mainY -= 12;
      }

      if (exp.responsibilities) {
        const paras = exp.responsibilities.split("\n");
        for (const p of paras) {
          const cleanP = p.trim().replace(/^[-•*]\s*/, "");
          if (!cleanP) continue;
          const bLines = wrapText(cleanP, mainWidth - 10, ctx.fontRegular, 8.5);
          for (let i = 0; i < bLines.length; i++) {
            ensureMainSpace(11.5);
            if (i === 0) {
              drawMainText("*", mainX + 2, mainY - 8.5, ctx.fontBold, 8.5, cobalt);
            }
            drawMainText(bLines[i], mainX + 10, mainY - 8.5, ctx.fontRegular, 8.5, rgb(0.18, 0.22, 0.28));
            mainY -= 11.5;
          }
        }
      }

      if (exp.achievements) {
        const aLines = wrapText(`Key Achievement: ${exp.achievements}`, mainWidth - 10, ctx.fontItalic, 8);
        for (const al of aLines) {
          ensureMainSpace(11);
          drawMainText(al, mainX + 10, mainY - 8, ctx.fontItalic, 8, rgb(0.4, 0.45, 0.52));
          mainY -= 11;
        }
      }
      mainY -= 6;
    }
    mainY -= 8;
  }

  // Key Projects
  if (data.projects && data.projects.length > 0) {
    drawMainHeading("KEY PROJECTS");
    for (const proj of data.projects) {
      ensureMainSpace(25);
      drawMainText(proj.title || "Project", mainX, mainY - 9.5, ctx.fontBold, 9.5, rgb(0.08, 0.14, 0.25));
      if (proj.projectUrl) {
        const cleanUrl = proj.projectUrl.replace(/^https?:\/\/(www\.)?/, "");
        const uw = ctx.fontRegular.widthOfTextAtSize(cleanUrl, 8.5);
        drawMainText(cleanUrl, mainX + mainWidth - uw, mainY - 8.5, ctx.fontRegular, 8.5, cobalt);
        addHyperlink(ctx.doc, ctx.pages[mainPageIndex], mainX + mainWidth - uw, mainY - 8.5 - 2, uw, 11, proj.projectUrl);
      }
      mainY -= 12;

      if (proj.technologies) {
        drawMainText(`Tech: ${proj.technologies}`, mainX, mainY - 8, ctx.fontItalic, 8, rgb(0.4, 0.45, 0.5));
        mainY -= 11;
      }

      if (proj.description) {
        const dLines = wrapText(proj.description, mainWidth, ctx.fontRegular, 8.5);
        for (const dl of dLines) {
          ensureMainSpace(11.5);
          drawMainText(dl, mainX, mainY - 8.5, ctx.fontRegular, 8.5, rgb(0.18, 0.22, 0.28));
          mainY -= 11.5;
        }
      }
      mainY -= 6;
    }
  }

  // Honors & Achievements in Main Column (NO OVERLAP!)
  if ((data.awards && data.awards.length > 0) || (data.achievements && data.achievements.length > 0)) {
    drawMainHeading("HONORS & ACHIEVEMENTS");
    if (data.awards) {
      for (const aw of data.awards) {
        ensureMainSpace(18);
        const lText = `${aw.title}${aw.issuer ? ` (${aw.issuer})` : ""}`;
        drawMainText(lText, mainX, mainY - 9, ctx.fontBold, 9, rgb(0.08, 0.14, 0.25));
        if (aw.date) {
          const dw = ctx.fontRegular.widthOfTextAtSize(aw.date, 8.5);
          drawMainText(aw.date, mainX + mainWidth - dw, mainY - 8.5, ctx.fontRegular, 8.5, rgb(0.45, 0.5, 0.55));
        }
        mainY -= 12;
        if (aw.summary) {
          const sLines = wrapText(aw.summary, mainWidth - 10, ctx.fontRegular, 8.5);
          for (const sl of sLines) {
            ensureMainSpace(11);
            drawMainText(sl, mainX + 10, mainY - 8.5, ctx.fontRegular, 8.5, rgb(0.4, 0.45, 0.5));
            mainY -= 11;
          }
        }
        mainY -= 4;
      }
    }
    if (data.achievements) {
      for (const ach of data.achievements) {
        ensureMainSpace(16);
        drawMainText(ach.title, mainX, mainY - 9, ctx.fontBold, 9, rgb(0.08, 0.14, 0.25));
        mainY -= 12;
        if (ach.description) {
          const dLines = wrapText(ach.description, mainWidth - 10, ctx.fontRegular, 8.5);
          for (const dl of dLines) {
            ensureMainSpace(11);
            drawMainText(dl, mainX + 10, mainY - 8.5, ctx.fontRegular, 8.5, rgb(0.4, 0.45, 0.5));
            mainY -= 11;
          }
        }
        mainY -= 4;
      }
    }
  }

  // Draw clean vertical dividing rule between columns on every page
  for (let pIdx = 0; pIdx < ctx.pages.length; pIdx++) {
    const page = ctx.pages[pIdx];
    const lineStartY = pIdx === 0 ? topColY : ctx.pageHeight - ctx.marginTop;
    page.drawLine({
      start: { x: dividerX, y: lineStartY },
      end: { x: dividerX, y: ctx.marginBottom },
      thickness: 0.75,
      color: rgb(0.85, 0.88, 0.92),
    });
  }
}

// =========================================================================
// TEMPLATE 5: EXECUTIVE (CALLOUT BOX & LEADERSHIP STYLING)
// =========================================================================
function renderExecutive(ctx: PdfRenderContext, data: ResumeData): void {
  const navy = ctx.theme.primaryColor;

  renderCommonHeader(ctx, data, {
    customTitleColor: ctx.theme.titleColor || ctx.theme.primaryColor,
    customRuleThickness: 2.5,
    customRuleColor: ctx.theme.accentLineColor,
  });

  // DISTINCT EXECUTIVE SUMMARY CALLOUT BOX
  if (data.summary && data.summary.trim()) {
    const summaryLines = wrapText(data.summary.trim(), ctx.contentWidth - 24, ctx.fontRegular, 9.5);
    const boxHeight = summaryLines.length * 13 + 24;

    ctx.ensureVerticalSpace(boxHeight + 10);

    // Background fill
    ctx.currentPage.drawRectangle({
      x: ctx.marginLeft,
      y: ctx.currentY - boxHeight,
      width: ctx.contentWidth,
      height: boxHeight,
      color: rgb(0.96, 0.97, 0.98), // Slate 50
    });

    // Left thick accent border (3.5pt)
    ctx.currentPage.drawLine({
      start: { x: ctx.marginLeft, y: ctx.currentY },
      end: { x: ctx.marginLeft, y: ctx.currentY - boxHeight },
      thickness: 3.5,
      color: ctx.theme.accentLineColor,
    });

    // Box Title
    ctx.drawTextLine("EXECUTIVE PROFILE", ctx.marginLeft + 12, ctx.currentY - 14, ctx.fontBold, 9.5, ctx.theme.headingColor);

    // Summary lines inside box
    let boxY = ctx.currentY - 26;
    for (const sl of summaryLines) {
      ctx.drawTextLine(sl, ctx.marginLeft + 12, boxY - 9.5, ctx.fontRegular, 9.5, ctx.theme.bodyColor);
      boxY -= 13;
    }

    ctx.currentY -= boxHeight + ctx.sectionGap;
  }

  // Other sections with solid slate underline (Executive layout: Core Competencies above Experience)
  renderSkillsSection(ctx, data.skills, navy);
  renderExperienceSection(ctx, data.experiences, navy);
  renderEducationSection(ctx, data.education, navy);
  renderProjectsSection(ctx, data.projects, navy);
  renderCertificationsSection(ctx, data.certifications, navy);
  renderLanguagesSection(ctx, data.languages, navy);
  renderAwardsAchievementsSection(ctx, data.awards, data.achievements);
}

// =========================================================================
// TEMPLATE 6: CREATIVE (VIOLET PORTFOLIO & CHIP BADGES)
// =========================================================================
function renderCreative(ctx: PdfRenderContext, data: ResumeData): void {
  const violet = ctx.theme.primaryColor;

  renderCommonHeader(ctx, data, {
    badgeText: "CREATIVE PORTFOLIO",
    customTitleColor: ctx.theme.titleColor || violet,
    customRuleThickness: 2,
    customRuleColor: ctx.theme.accentLineColor,
  });

  renderSummarySection(ctx, data.summary, violet);
  renderExperienceSection(ctx, data.experiences, violet);
  renderEducationSection(ctx, data.education, violet);

  // Creative Tag/Chip Skills
  const techSkills = data.skills?.technical || [];
  const softSkills = data.skills?.soft || [];
  if (techSkills.length > 0 || softSkills.length > 0) {
    drawCreativeSectionTitle(ctx, "SKILLS & EXPERTISE", violet);

    if (techSkills.length > 0) {
      ctx.ensureVerticalSpace(15);
      ctx.drawTextLine("Technical Skills:", ctx.marginLeft, ctx.currentY - 9, ctx.fontBold, 9, ctx.theme.headingColor);
      ctx.currentY -= 13;
      renderSkillChips(ctx, techSkills, violet);
    }

    if (softSkills.length > 0) {
      ctx.ensureVerticalSpace(15);
      ctx.drawTextLine("Soft Skills:", ctx.marginLeft, ctx.currentY - 9, ctx.fontBold, 9, ctx.theme.headingColor);
      ctx.currentY -= 13;
      renderSkillChips(ctx, softSkills, violet);
    }
  }

  renderProjectsSection(ctx, data.projects, violet);
  renderCertificationsSection(ctx, data.certifications, violet);
  renderLanguagesSection(ctx, data.languages, violet);
  renderAwardsAchievementsSection(ctx, data.awards, data.achievements);
}

function renderSkillChips(ctx: PdfRenderContext, skills: string[], accentColor: RGB): void {
  let curX = ctx.marginLeft;
  const chipH = 15;
  const chipPadX = 8;
  const chipGap = 6;

  for (const sk of skills) {
    const textClean = sanitizePdfText(sk);
    const tw = ctx.fontRegular.widthOfTextAtSize(textClean, 8.5);
    const chipW = tw + chipPadX * 2;

    if (curX + chipW > ctx.marginLeft + ctx.contentWidth) {
      curX = ctx.marginLeft;
      ctx.currentY -= chipH + 5;
    }

    ctx.ensureVerticalSpace(chipH + 4);

    ctx.currentPage.drawRectangle({
      x: curX,
      y: ctx.currentY - chipH,
      width: chipW,
      height: chipH,
      color: rgb(0.95, 0.93, 1.0),
      borderColor: rgb(0.85, 0.8, 0.98),
      borderWidth: 0.5,
    });

    ctx.drawTextLine(textClean, curX + chipPadX, ctx.currentY - 11, ctx.fontRegular, 8.5, rgb(0.3, 0.15, 0.55));
    curX += chipW + chipGap;
  }
  ctx.currentY -= chipH + 10;
}

function drawCreativeSectionTitle(ctx: PdfRenderContext, title: string, accentColor: RGB): void {
  ctx.ensureVerticalSpace(35);
  const tw = ctx.fontBold.widthOfTextAtSize(title, ctx.sectionHeadingFontSize);
  ctx.drawTextLine(title, ctx.marginLeft, ctx.currentY - ctx.sectionHeadingFontSize, ctx.fontBold, ctx.sectionHeadingFontSize, accentColor);
  ctx.currentPage.drawLine({
    start: { x: ctx.marginLeft, y: ctx.currentY - ctx.sectionHeadingFontSize - 3 },
    end: { x: ctx.marginLeft + tw + 15, y: ctx.currentY - ctx.sectionHeadingFontSize - 3 },
    thickness: 2,
    color: accentColor,
  });
  ctx.currentPage.drawLine({
    start: { x: ctx.marginLeft + tw + 15, y: ctx.currentY - ctx.sectionHeadingFontSize - 3 },
    end: { x: ctx.marginLeft + ctx.contentWidth, y: ctx.currentY - ctx.sectionHeadingFontSize - 3 },
    thickness: 0.5,
    color: rgb(0.9, 0.88, 0.95),
  });
  ctx.currentY -= ctx.sectionHeadingFontSize + 12;
}

// =========================================================================
// TEMPLATE 7: STUDENT / FRESHER (EDUCATION FIRST!)
// =========================================================================
function renderStudentFresher(ctx: PdfRenderContext, data: ResumeData): void {
  const teal = ctx.theme.primaryColor;

  renderCommonHeader(ctx, data, {
    customTitleColor: ctx.theme.titleColor || teal,
    customRuleThickness: 1.5,
    customRuleColor: ctx.theme.accentLineColor,
  });

  // 1. Objective / Summary (if present)
  renderSummarySection(ctx, data.summary, teal);

  // 2. EDUCATION FIRST (Student Priority!)
  renderEducationSection(ctx, data.education, teal);

  // 3. SKILLS
  renderSkillsSection(ctx, data.skills, teal);

  // 4. KEY PROJECTS & ACADEMIC WORK
  renderProjectsSection(ctx, data.projects, teal);

  // 5. INTERNSHIPS & WORK EXPERIENCE
  renderExperienceSection(ctx, data.experiences, teal);

  // 6. CERTIFICATIONS, LANGUAGES, HONORS
  renderCertificationsSection(ctx, data.certifications, teal);
  renderLanguagesSection(ctx, data.languages, teal);
  renderAwardsAchievementsSection(ctx, data.awards, data.achievements);
}

// =========================================================================
// TEMPLATE 8: ELEGANT MINIMAL (EDITORIAL SPLIT-NAME & SPACED RULES)
// =========================================================================
function renderElegantMinimal(ctx: PdfRenderContext, data: ResumeData): void {
  const stone900 = ctx.theme.headingColor;
  const stone300 = ctx.theme.accentLineColor;

  renderCommonHeader(ctx, data, {
    isSplitName: true,
    customRuleThickness: 0.5,
    customRuleColor: stone300,
  });

  renderSummarySection(ctx, data.summary, stone900, stone300);
  renderExperienceSection(ctx, data.experiences, stone900, stone300);
  renderEducationSection(ctx, data.education, stone900, stone300);
  renderSkillsSection(ctx, data.skills, stone900, stone300);
  renderProjectsSection(ctx, data.projects, stone900, stone300);
  renderCertificationsSection(ctx, data.certifications, stone900, stone300);
  renderLanguagesSection(ctx, data.languages, stone900, stone300);
  renderAwardsAchievementsSection(ctx, data.awards, data.achievements);
}

// =========================================================================
// REUSABLE SECTION RENDERERS
// =========================================================================

function renderInlineContactList(
  ctx: PdfRenderContext,
  items: ContactItem[],
  maxWidth: number,
  centered = false,
  customIconColor?: RGB
): void {
  if (items.length === 0) return;
  const lineH = Math.max(14, ctx.contactFontSize * ctx.lineSpacingMult + 3);
  const iconScale = 0.34;
  const iconSize = 24 * iconScale; // ~8.16pt
  const iconTextGap = 3.5;
  const itemGap = 12; // Gap between contact items on the same line
  const iconColor = customIconColor || ctx.theme.primaryColor;

  function measureItem(item: ContactItem): number {
    const textW = ctx.fontRegular.widthOfTextAtSize(sanitizePdfText(item.label), ctx.contactFontSize);
    const hasIcon = item.icon && CONTACT_ICONS[item.icon];
    return (hasIcon ? iconSize + iconTextGap : 0) + textW;
  }

  const lines: ContactItem[][] = [];
  let currentLine: ContactItem[] = [];
  let currentLineWidth = 0;

  for (const item of items) {
    const itemW = measureItem(item);
    const addedW = currentLine.length > 0 ? itemGap + itemW : itemW;

    if (currentLine.length > 0 && currentLineWidth + addedW > maxWidth) {
      lines.push(currentLine);
      currentLine = [item];
      currentLineWidth = itemW;
    } else {
      currentLine.push(item);
      currentLineWidth += addedW;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  for (const line of lines) {
    ctx.ensureVerticalSpace(lineH);

    let lineTotalW = 0;
    line.forEach((it, idx) => {
      lineTotalW += measureItem(it);
      if (idx < line.length - 1) {
        lineTotalW += itemGap;
      }
    });

    let curX = centered ? ctx.marginLeft + (maxWidth - lineTotalW) / 2 : ctx.marginLeft;
    const baseLineY = ctx.currentY - ctx.contactFontSize;
    const iconY = baseLineY + 7.2;

    for (const item of line) {
      const cleanLabel = sanitizePdfText(item.label);
      const textW = ctx.fontRegular.widthOfTextAtSize(cleanLabel, ctx.contactFontSize);
      const hasIcon = item.icon && CONTACT_ICONS[item.icon];
      const startItemX = curX;

      // 1. Draw Icon
      if (hasIcon) {
        const paths = CONTACT_ICONS[item.icon!];
        for (const p of paths) {
          ctx.currentPage.drawSvgPath(p, {
            x: curX,
            y: iconY,
            scale: iconScale,
            borderColor: iconColor,
            borderWidth: 1.0,
          });
        }
        curX += iconSize + iconTextGap;
      }

      // 2. Draw Text
      ctx.drawTextLine(cleanLabel, curX, baseLineY, ctx.fontRegular, ctx.contactFontSize, ctx.theme.mutedColor);

      // 3. Add clickable link if url is present (covers both icon and text)
      if (item.url) {
        const totalW = curX + textW - startItemX;
        addHyperlink(ctx.doc, ctx.currentPage, startItemX, baseLineY - 2, totalW, ctx.contactFontSize + 5, item.url);
      }

      curX += textW + itemGap;
    }

    ctx.currentY -= lineH;
  }
}

function drawSectionHeader(ctx: PdfRenderContext, title: string, customAccent?: RGB, customLineColor?: RGB): void {
  const displayTitle = ctx.theme.uppercaseSectionTitles ? title.toUpperCase() : title;
  const fontSize = ctx.sectionHeadingFontSize;
  const titleW = ctx.fontBold.widthOfTextAtSize(displayTitle, fontSize);

  ctx.ensureVerticalSpace(38);
  ctx.drawTextLine(displayTitle, ctx.marginLeft, ctx.currentY - fontSize, ctx.fontBold, fontSize, customAccent || ctx.theme.headingColor);

  const lineY = ctx.currentY - fontSize - 3;
  const lineCol = customAccent || ctx.theme.accentLineColor;
  const subLineCol = customLineColor || rgb(0.85, 0.88, 0.92);

  if (ctx.theme.headerRuleStyle === "accent" && !customLineColor) {
    ctx.currentPage.drawLine({
      start: { x: ctx.marginLeft, y: lineY },
      end: { x: ctx.marginLeft + titleW + 15, y: lineY },
      thickness: 1.5,
      color: lineCol,
    });
    ctx.currentPage.drawLine({
      start: { x: ctx.marginLeft + titleW + 15, y: lineY },
      end: { x: ctx.marginLeft + ctx.contentWidth, y: lineY },
      thickness: 0.5,
      color: subLineCol,
    });
  } else {
    ctx.currentPage.drawLine({
      start: { x: ctx.marginLeft, y: lineY },
      end: { x: ctx.marginLeft + ctx.contentWidth, y: lineY },
      thickness: customLineColor ? 0.5 : 0.75,
      color: lineCol,
    });
  }

  ctx.currentY = lineY - 8;
}

function renderSummarySection(ctx: PdfRenderContext, summary?: string, accent?: RGB, subLineCol?: RGB): void {
  if (!summary || !summary.trim()) return;
  drawSectionHeader(ctx, "Professional Summary", accent, subLineCol);
  const sFontSize = ctx.bodyFontSize + 0.5;
  const sLineH = sFontSize * ctx.lineSpacingMult;
  const lines = wrapText(summary.trim(), ctx.contentWidth, ctx.fontRegular, sFontSize);

  for (const line of lines) {
    ctx.ensureVerticalSpace(sLineH);
    ctx.drawTextLine(line, ctx.marginLeft, ctx.currentY - sFontSize, ctx.fontRegular, sFontSize, ctx.theme.bodyColor);
    ctx.currentY -= sLineH;
  }
  ctx.currentY -= ctx.sectionGap;
}

function renderExperienceSection(ctx: PdfRenderContext, experiences?: ResumeData["experiences"], accent?: RGB, subLineCol?: RGB): void {
  if (!experiences || experiences.length === 0) return;
  drawSectionHeader(ctx, "Work Experience", accent, subLineCol);

  for (const exp of experiences) {
    const titleText = exp.jobTitle || "Job Title";
    const companyText = exp.company || "";
    const dateText = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`.trim();
    const locationText = exp.location || "";

    ctx.ensureVerticalSpace(35);

    // Title & Dates
    const tSize = 10;
    ctx.drawTextLine(titleText, ctx.marginLeft, ctx.currentY - tSize, ctx.fontBold, tSize, ctx.theme.headingColor);

    if (dateText && dateText !== "-") {
      const dSize = 9;
      const dw = ctx.fontRegular.widthOfTextAtSize(dateText, dSize);
      ctx.drawTextLine(dateText, ctx.marginLeft + ctx.contentWidth - dw, ctx.currentY - dSize, ctx.fontRegular, dSize, ctx.theme.mutedColor);
    }
    ctx.currentY -= tSize + 3;

    // Company & Location
    if (companyText || locationText) {
      ctx.ensureVerticalSpace(14);
      const cSize = 9.5;
      const compFont = (ctx.theme.primaryFontName === StandardFonts.TimesRoman) ? ctx.fontItalic : ctx.fontBold;
      if (companyText) {
        ctx.drawTextLine(companyText, ctx.marginLeft, ctx.currentY - cSize, compFont, cSize, accent || ctx.theme.primaryColor);
      }
      if (locationText) {
        const lSize = 8.5;
        const lw = ctx.fontRegular.widthOfTextAtSize(locationText, lSize);
        ctx.drawTextLine(locationText, ctx.marginLeft + ctx.contentWidth - lw, ctx.currentY - lSize, ctx.fontRegular, lSize, ctx.theme.mutedColor);
      }
      ctx.currentY -= cSize + 4;
    }

    // Responsibilities
    if (exp.responsibilities) {
      const respParagraphs = exp.responsibilities.split("\n");
      const respLineH = ctx.bodyFontSize * ctx.lineSpacingMult;

      for (const item of respParagraphs) {
        const clean = item.trim().replace(/^[-•*]\s*/, "");
        if (!clean) continue;
        const bLines = wrapText(clean, ctx.contentWidth - 12, ctx.fontRegular, ctx.bodyFontSize);

        for (let i = 0; i < bLines.length; i++) {
          ctx.ensureVerticalSpace(respLineH);
          if (i === 0) {
            ctx.drawTextLine("*", ctx.marginLeft + 2, ctx.currentY - ctx.bodyFontSize, ctx.fontBold, ctx.bodyFontSize, ctx.theme.mutedColor);
          }
          ctx.drawTextLine(bLines[i], ctx.marginLeft + 12, ctx.currentY - ctx.bodyFontSize, ctx.fontRegular, ctx.bodyFontSize, ctx.theme.bodyColor);
          ctx.currentY -= respLineH;
        }
      }
    }

    // Achievements
    if (exp.achievements) {
      const achSize = Math.max(8, ctx.bodyFontSize - 0.5);
      const achLineH = achSize * ctx.lineSpacingMult;
      const achLines = wrapText(`Key Achievement: ${exp.achievements}`, ctx.contentWidth - 12, ctx.fontItalic, achSize);

      ctx.currentY -= 2;
      for (const line of achLines) {
        ctx.ensureVerticalSpace(achLineH);
        ctx.drawTextLine(line, ctx.marginLeft + 12, ctx.currentY - achSize, ctx.fontItalic, achSize, ctx.theme.mutedColor);
        ctx.currentY -= achLineH;
      }
    }
    ctx.currentY -= ctx.itemGap;
  }
  ctx.currentY -= Math.max(4, ctx.sectionGap - ctx.itemGap);
}

function renderEducationSection(ctx: PdfRenderContext, education?: ResumeData["education"], accent?: RGB, subLineCol?: RGB): void {
  if (!education || education.length === 0) return;
  drawSectionHeader(ctx, "Education", accent, subLineCol);

  for (const edu of education) {
    const degreeText = edu.degree
      ? `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}`
      : edu.fieldOfStudy;
    const instText = edu.institution || "Institution";
    const yearText = edu.graduationYear || "";

    ctx.ensureVerticalSpace(30);

    const degSize = 10;
    ctx.drawTextLine(degreeText || instText, ctx.marginLeft, ctx.currentY - degSize, ctx.fontBold, degSize, ctx.theme.headingColor);

    if (yearText) {
      const ySize = 9;
      const yw = ctx.fontRegular.widthOfTextAtSize(yearText, ySize);
      ctx.drawTextLine(yearText, ctx.marginLeft + ctx.contentWidth - yw, ctx.currentY - ySize, ctx.fontRegular, ySize, ctx.theme.mutedColor);
    }
    ctx.currentY -= degSize + 3;

    if (degreeText && instText) {
      ctx.ensureVerticalSpace(14);
      const instSize = 9.5;
      ctx.drawTextLine(instText, ctx.marginLeft, ctx.currentY - instSize, ctx.fontItalic, instSize, accent || ctx.theme.primaryColor);
      ctx.currentY -= instSize + 3;
    }

    if (edu.additionalDetails) {
      const detSize = Math.max(8, ctx.bodyFontSize - 0.5);
      const detLineH = detSize * ctx.lineSpacingMult;
      const lines = wrapText(edu.additionalDetails, ctx.contentWidth - 10, ctx.fontRegular, detSize);
      for (const line of lines) {
        ctx.ensureVerticalSpace(detLineH);
        ctx.drawTextLine(line, ctx.marginLeft + 10, ctx.currentY - detSize, ctx.fontRegular, detSize, ctx.theme.mutedColor);
        ctx.currentY -= detLineH;
      }
    }
    ctx.currentY -= ctx.itemGap;
  }
  ctx.currentY -= Math.max(4, ctx.sectionGap - ctx.itemGap);
}

function renderSkillsSection(ctx: PdfRenderContext, skills?: ResumeData["skills"], accent?: RGB, subLineCol?: RGB): void {
  const tech = skills?.technical || [];
  const soft = skills?.soft || [];
  if (tech.length === 0 && soft.length === 0) return;

  drawSectionHeader(ctx, "Skills", accent, subLineCol);
  const sSize = ctx.bodyFontSize;
  const sLineH = sSize * ctx.lineSpacingMult;

  if (tech.length > 0) {
    const techStr = `Technical Skills: ${tech.join("  *  ")}`;
    const techLines = wrapText(techStr, ctx.contentWidth, ctx.fontRegular, sSize);
    for (let i = 0; i < techLines.length; i++) {
      ctx.ensureVerticalSpace(sLineH);
      ctx.drawTextLine(techLines[i], ctx.marginLeft, ctx.currentY - sSize, i === 0 ? ctx.fontBold : ctx.fontRegular, sSize, ctx.theme.bodyColor);
      ctx.currentY -= sLineH;
    }
    ctx.currentY -= 3;
  }

  if (soft.length > 0) {
    const softStr = `Soft Skills: ${soft.join("  *  ")}`;
    const softLines = wrapText(softStr, ctx.contentWidth, ctx.fontRegular, sSize);
    for (let i = 0; i < softLines.length; i++) {
      ctx.ensureVerticalSpace(sLineH);
      ctx.drawTextLine(softLines[i], ctx.marginLeft, ctx.currentY - sSize, i === 0 ? ctx.fontBold : ctx.fontRegular, sSize, ctx.theme.bodyColor);
      ctx.currentY -= sLineH;
    }
  }
  ctx.currentY -= ctx.sectionGap;
}

function renderProjectsSection(ctx: PdfRenderContext, projects?: ResumeData["projects"], accent?: RGB, subLineCol?: RGB): void {
  if (!projects || projects.length === 0) return;
  drawSectionHeader(ctx, "Key Projects", accent, subLineCol);

  for (const proj of projects) {
    ctx.ensureVerticalSpace(30);
    const pSize = 10;
    ctx.drawTextLine(proj.title || "Project Title", ctx.marginLeft, ctx.currentY - pSize, ctx.fontBold, pSize, ctx.theme.headingColor);

    if (proj.projectUrl) {
      const uSize = Math.max(8, ctx.bodyFontSize - 0.5);
      const cleanUrl = proj.projectUrl.replace(/^https?:\/\/(www\.)?/, "");
      const uw = ctx.fontRegular.widthOfTextAtSize(cleanUrl, uSize);
      const ux = ctx.marginLeft + ctx.contentWidth - uw;
      const uy = ctx.currentY - uSize;
      ctx.drawTextLine(cleanUrl, ux, uy, ctx.fontRegular, uSize, accent || ctx.theme.primaryColor);
      addHyperlink(ctx.doc, ctx.currentPage, ux, uy - 2, uw, uSize + 3, proj.projectUrl);
    }
    ctx.currentY -= pSize + 3;

    if (proj.technologies) {
      const techSize = Math.max(8, ctx.bodyFontSize - 0.5);
      ctx.ensureVerticalSpace(techSize + 3);
      ctx.drawTextLine(`Technologies: ${proj.technologies}`, ctx.marginLeft, ctx.currentY - techSize, ctx.fontItalic, techSize, accent || ctx.theme.primaryColor);
      ctx.currentY -= techSize + 3;
    }

    if (proj.description) {
      const dLineH = ctx.bodyFontSize * ctx.lineSpacingMult;
      const dLines = wrapText(proj.description, ctx.contentWidth, ctx.fontRegular, ctx.bodyFontSize);
      for (const dl of dLines) {
        ctx.ensureVerticalSpace(dLineH);
        ctx.drawTextLine(dl, ctx.marginLeft, ctx.currentY - ctx.bodyFontSize, ctx.fontRegular, ctx.bodyFontSize, ctx.theme.bodyColor);
        ctx.currentY -= dLineH;
      }
    }
    ctx.currentY -= ctx.itemGap;
  }
  ctx.currentY -= Math.max(4, ctx.sectionGap - ctx.itemGap);
}

function renderCertificationsSection(ctx: PdfRenderContext, certs?: ResumeData["certifications"], accent?: RGB, subLineCol?: RGB): void {
  if (!certs || certs.length === 0) return;
  drawSectionHeader(ctx, "Certifications", accent, subLineCol);

  for (const cert of certs) {
    ctx.ensureVerticalSpace(16);
    const cSize = ctx.bodyFontSize;
    const certTitle = `${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ""}`;
    const tw = ctx.fontBold.widthOfTextAtSize(sanitizePdfText(certTitle), cSize);
    const baseLineY = ctx.currentY - cSize;

    ctx.drawTextLine(certTitle, ctx.marginLeft, baseLineY, ctx.fontBold, cSize, ctx.theme.bodyColor);
    if (cert.url) {
      addHyperlink(ctx.doc, ctx.currentPage, ctx.marginLeft, baseLineY - 2, tw, cSize + 3, cert.url);
    }

    if (cert.date) {
      const dw = ctx.fontRegular.widthOfTextAtSize(cert.date, cSize);
      ctx.drawTextLine(cert.date, ctx.marginLeft + ctx.contentWidth - dw, baseLineY, ctx.fontRegular, cSize, ctx.theme.mutedColor);
    }
    ctx.currentY -= cSize + 5;
  }
  ctx.currentY -= ctx.sectionGap;
}

function renderLanguagesSection(ctx: PdfRenderContext, languages?: ResumeData["languages"], accent?: RGB, subLineCol?: RGB): void {
  if (!languages || languages.length === 0) return;
  drawSectionHeader(ctx, "Languages", accent, subLineCol);
  ctx.ensureVerticalSpace(16);

  const lSize = ctx.bodyFontSize;
  const langStr = languages.map((l) => (l.proficiency ? `${l.language} (${l.proficiency})` : l.language)).join("   *   ");
  const lines = wrapText(langStr, ctx.contentWidth, ctx.fontRegular, lSize);

  for (const line of lines) {
    ctx.ensureVerticalSpace(lSize * ctx.lineSpacingMult);
    ctx.drawTextLine(line, ctx.marginLeft, ctx.currentY - lSize, ctx.fontRegular, lSize, ctx.theme.bodyColor);
    ctx.currentY -= lSize * ctx.lineSpacingMult;
  }
  ctx.currentY -= ctx.sectionGap;
}

function renderAwardsAchievementsSection(
  ctx: PdfRenderContext,
  awards?: ResumeData["awards"],
  achievements?: ResumeData["achievements"]
): void {
  const hasAwards = awards && awards.length > 0;
  const hasAchs = achievements && achievements.length > 0;
  if (!hasAwards && !hasAchs) return;

  drawSectionHeader(ctx, "Honors & Achievements");

  if (awards) {
    for (const award of awards) {
      ctx.ensureVerticalSpace(20);
      const aSize = 9;
      const lineText = `${award.title}${award.issuer ? ` (${award.issuer})` : ""}`;
      ctx.drawTextLine(lineText, ctx.marginLeft, ctx.currentY - aSize, ctx.fontBold, aSize, ctx.theme.headingColor);

      if (award.date) {
        const dw = ctx.fontRegular.widthOfTextAtSize(award.date, aSize);
        ctx.drawTextLine(award.date, ctx.marginLeft + ctx.contentWidth - dw, ctx.currentY - aSize, ctx.fontRegular, aSize, ctx.theme.mutedColor);
      }
      ctx.currentY -= aSize + 3;

      if (award.summary) {
        const sLines = wrapText(award.summary, ctx.contentWidth - 10, ctx.fontRegular, 8.5);
        for (const sl of sLines) {
          ctx.ensureVerticalSpace(11);
          ctx.drawTextLine(sl, ctx.marginLeft + 10, ctx.currentY - 8.5, ctx.fontRegular, 8.5, ctx.theme.mutedColor);
          ctx.currentY -= 11;
        }
      }
      ctx.currentY -= 3;
    }
  }

  if (achievements) {
    for (const ach of achievements) {
      ctx.ensureVerticalSpace(18);
      const aSize = 9;
      ctx.drawTextLine(ach.title, ctx.marginLeft, ctx.currentY - aSize, ctx.fontBold, aSize, ctx.theme.headingColor);
      ctx.currentY -= aSize + 3;

      if (ach.description) {
        const dLines = wrapText(ach.description, ctx.contentWidth - 10, ctx.fontRegular, 8.5);
        for (const dl of dLines) {
          ctx.ensureVerticalSpace(11);
          ctx.drawTextLine(dl, ctx.marginLeft + 10, ctx.currentY - 8.5, ctx.fontRegular, 8.5, ctx.theme.mutedColor);
          ctx.currentY -= 11;
        }
      }
      ctx.currentY -= 3;
    }
  }
}

// =========================================================================
// MAIN ENTRY POINT: GENERATE RESUME PDF
// =========================================================================
export async function generateResumePdf(data: ResumeData): Promise<Uint8Array> {
  // 1. Reliability check: wait for document fonts if in browser
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore
    }
  }

  const doc = await PDFDocument.create();

  // Page geometry
  const pageWidth = PageSizes.A4[0]; // 595.28
  const pageHeight = PageSizes.A4[1]; // 841.89
  const marginLeft = 38;
  const marginRight = 38;
  const marginTop = 36;
  const marginBottom = 40;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Active theme, colors & typography
  const templateId = data.templateId || "modern-professional";
  const baseTheme = THEMES[templateId] || THEMES["modern-professional"];
  const effectiveColors = data.colors || getTemplateDefaultColors(templateId);
  const theme: TemplateTheme = {
    ...baseTheme,
    primaryColor: hexToPdfRgb(effectiveColors.primaryAccent),
    headingColor: hexToPdfRgb(effectiveColors.headingColor),
    bodyColor: hexToPdfRgb(effectiveColors.bodyColor),
    mutedColor: hexToPdfRgb(effectiveColors.secondaryColor),
    accentLineColor: hexToPdfRgb(effectiveColors.dividerColor),
    nameColor: hexToPdfRgb(effectiveColors.nameColor),
    titleColor: hexToPdfRgb(effectiveColors.titleColor),
  };
  const typo = data.typography;

  // Font family resolution: Serif (Georgia/Merriweather) -> TimesRoman; Sans-serif -> Helvetica
  const isSerifFont = typo?.fontFamily === "Georgia" || typo?.fontFamily === "Merriweather";
  const primaryFontName = typo?.fontFamily
    ? (isSerifFont ? StandardFonts.TimesRoman : StandardFonts.Helvetica)
    : theme.primaryFontName;
  const boldFontName = typo?.fontFamily
    ? (isSerifFont ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold)
    : theme.boldFontName;
  const italicFontName = typo?.fontFamily
    ? (isSerifFont ? StandardFonts.TimesRomanItalic : StandardFonts.HelveticaOblique)
    : theme.italicFontName;

  // Embed standard vector fonts
  const fontRegular = await doc.embedFont(primaryFontName);
  const fontBold = await doc.embedFont(boldFontName);
  const fontItalic = await doc.embedFont(italicFontName);

  // Scaled typography sizes & spacing
  const nameFontSize = typo?.nameSize
    ? Math.min(30, Math.max(16, typo.nameSize * 0.95))
    : (templateId === "classic-corporate" ? 21 : 22);
  const titleFontSize = typo?.titleSize
    ? Math.min(16, Math.max(9, typo.titleSize * 0.8))
    : 11;
  const contactFontSize = typo?.contactSize
    ? Math.min(11, Math.max(7.5, typo.contactSize * 0.77))
    : 8.5;
  const sectionHeadingFontSize = typo?.headingSize
    ? Math.min(14, Math.max(9.5, typo.headingSize * 0.82))
    : 10.5;
  const bodyFontSize = typo?.bodySize
    ? Math.min(11.5, Math.max(8, typo.bodySize * 0.75))
    : 9;
  const lineSpacingMult = typo?.lineSpacing
    ? Math.min(1.6, Math.max(1.15, typo.lineSpacing))
    : theme.lineSpacing;
  const sectionGap = typo?.sectionSpacing
    ? Math.min(24, Math.max(10, typo.sectionSpacing * 0.88))
    : theme.sectionGap;
  const itemGap = typo?.paragraphSpacing
    ? Math.min(12, Math.max(3, typo.paragraphSpacing * 1.15))
    : theme.itemGap;

  // Calculate photo dimensions & embed profile photo if enabled
  const info = data.personalInfo;
  const photoDims = getPhotoDimensions(info.photoSize, info.photoShape);
  const photoSize = { w: photoDims.widthPt, h: photoDims.heightPt };
  const profileImage: PDFImage | null = info.showPhoto
    ? await embedProfilePhoto(doc, info.photoUrl, photoDims.isCircle)
    : null;
  const hasPhoto = Boolean(profileImage);

  // Pagination tracker
  const pages: PDFPage[] = [];
  let currentPage = doc.addPage(PageSizes.A4);
  pages.push(currentPage);
  let currentY = pageHeight - marginTop;

  function ensureVerticalSpace(requiredHeight: number): void {
    if (currentY - requiredHeight < marginBottom) {
      currentPage = doc.addPage(PageSizes.A4);
      pages.push(currentPage);
      currentY = pageHeight - marginTop;
    }
  }

  function drawTextLine(
    text: string,
    x: number,
    y: number,
    font: PDFFont,
    size: number,
    color: RGB
  ): void {
    const clean = sanitizePdfText(text);
    if (!clean) return;
    currentPage.drawText(clean, {
      x,
      y,
      font,
      size,
      color,
    });
  }

  const contactList = buildContactList(info, templateId);

  const context: PdfRenderContext = {
    doc,
    pages,
    pageWidth,
    pageHeight,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    contentWidth,
    fontRegular,
    fontBold,
    fontItalic,
    nameFontSize,
    titleFontSize,
    contactFontSize,
    sectionHeadingFontSize,
    bodyFontSize,
    lineSpacingMult,
    sectionGap,
    itemGap,
    profileImage,
    photoDims,
    photoSize,
    hasPhoto,
    theme,
    get currentPage() {
      return currentPage;
    },
    set currentPage(p: PDFPage) {
      currentPage = p;
    },
    get currentY() {
      return currentY;
    },
    set currentY(y: number) {
      currentY = y;
    },
    ensureVerticalSpace,
    drawTextLine,
    contactList,
  };

  // Dispatch to the specific template renderer
  switch (templateId) {
    case "minimal-ats":
      renderMinimalAts(context, data);
      break;
    case "classic-corporate":
      renderClassicCorporate(context, data);
      break;
    case "modern-two-column":
      renderModernTwoColumn(context, data);
      break;
    case "executive":
      renderExecutive(context, data);
      break;
    case "creative":
      renderCreative(context, data);
      break;
    case "student-fresher":
      renderStudentFresher(context, data);
      break;
    case "elegant-minimal":
      renderElegantMinimal(context, data);
      break;
    case "modern-professional":
    default:
      renderModernProfessional(context, data);
      break;
  }

  return await doc.save();
}

/**
 * Trigger client-side direct download of vector PDF Uint8Array
 */
export function downloadPdfBuffer(buffer: Uint8Array, filename = "resume.pdf"): void {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
