import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import type { ResumeData, ResumeTemplateId } from "../../types/resume.ts";

export interface PdfGenerationOptions {
  fileName?: string;
}

interface TemplateTheme {
  primaryFontName: StandardFonts;
  boldFontName: StandardFonts;
  italicFontName: StandardFonts;
  primaryColor: RGB;
  headingColor: RGB;
  bodyColor: RGB;
  mutedColor: RGB;
  accentLineColor: RGB;
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
    primaryColor: rgb(0.1, 0.1, 0.1),
    headingColor: rgb(0.05, 0.05, 0.05),
    bodyColor: rgb(0.12, 0.12, 0.12),
    mutedColor: rgb(0.35, 0.35, 0.35),
    accentLineColor: rgb(0.3, 0.3, 0.3),
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
          // A single word exceeds maxWidth: hard-split by characters
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
 * Replaces fancy quotes, en/em dashes, and special bullets with safe characters.
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
      // Keep accents if within Latin1, else fallback to ASCII equivalent or space
      const code = match.charCodeAt(0);
      if (code >= 160 && code <= 255) return match;
      return " ";
    });
}

/**
 * Vector PDF Generator for Resumes via pdf-lib.
 * Generates genuine vector A4 PDFs with selectable text, correct multi-page pagination,
 * and exact template styles.
 */
export async function generateResumePdf(data: ResumeData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Page geometry (A4 in points)
  const pageWidth = PageSizes.A4[0]; // 595.28
  const pageHeight = PageSizes.A4[1]; // 841.89
  const marginLeft = 38;
  const marginRight = 38;
  const marginTop = 38;
  const marginBottom = 42;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Active theme
  const templateId = data.templateId || "modern-professional";
  const theme = THEMES[templateId] || THEMES["modern-professional"];

  // Embed standard vector fonts
  const fontRegular = await doc.embedFont(theme.primaryFontName);
  const fontBold = await doc.embedFont(theme.boldFontName);
  const fontItalic = await doc.embedFont(theme.italicFontName);

  // Pagination tracker
  const pages: PDFPage[] = [];
  let currentPage = doc.addPage(PageSizes.A4);
  pages.push(currentPage);
  let currentY = pageHeight - marginTop;

  /**
   * Helper: checks if requiredHeight fits on the current page;
   * if not, spawns a new page and resets currentY.
   */
  function ensureVerticalSpace(requiredHeight: number): void {
    if (currentY - requiredHeight < marginBottom) {
      currentPage = doc.addPage(PageSizes.A4);
      pages.push(currentPage);
      currentY = pageHeight - marginTop;
    }
  }

  /**
   * Helper: draw text line
   */
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

  // ==========================================
  // 1. HEADER: PERSONAL INFO
  // ==========================================
  const info = data.personalInfo;
  const fullName = info.fullName.trim() || "Your Name";
  const jobTitle = info.jobTitle.trim();

  // Name
  const nameFontSize = templateId === "classic-corporate" ? 21 : 22;
  const nameWidth = fontBold.widthOfTextAtSize(fullName, nameFontSize);
  const nameX = theme.centerHeader ? marginLeft + (contentWidth - nameWidth) / 2 : marginLeft;

  ensureVerticalSpace(nameFontSize + 10);
  drawTextLine(fullName, nameX, currentY - nameFontSize, fontBold, nameFontSize, theme.headingColor);
  currentY -= nameFontSize + 4;

  // Professional Title
  if (jobTitle) {
    const titleFontSize = 11;
    const titleFont = templateId === "classic-corporate" ? fontItalic : fontBold;
    const titleWidth = titleFont.widthOfTextAtSize(jobTitle, titleFontSize);
    const titleX = theme.centerHeader ? marginLeft + (contentWidth - titleWidth) / 2 : marginLeft;
    const titleColor = templateId === "modern-professional" ? theme.primaryColor : theme.mutedColor;

    ensureVerticalSpace(titleFontSize + 6);
    drawTextLine(jobTitle, titleX, currentY - titleFontSize, titleFont, titleFontSize, titleColor);
    currentY -= titleFontSize + 4;
  }

  // Contact items (Email, Phone, Location, LinkedIn, Portfolio)
  const contactParts: string[] = [];
  if (info.email) contactParts.push(info.email);
  if (info.phone) contactParts.push(info.phone);
  if (info.location) contactParts.push(info.location);
  if (info.linkedIn) contactParts.push(info.linkedIn.replace(/^https?:\/\/(www\.)?/, ""));
  if (info.portfolio) contactParts.push(info.portfolio.replace(/^https?:\/\/(www\.)?/, ""));

  if (contactParts.length > 0) {
    const contactFontSize = 8.5;
    const contactLineHeight = contactFontSize * 1.35;
    const contactStr = contactParts.join("   |   ");
    const wrappedContact = wrapText(contactStr, contentWidth, fontRegular, contactFontSize);

    for (const line of wrappedContact) {
      const lineWidth = fontRegular.widthOfTextAtSize(line, contactFontSize);
      const lineX = theme.centerHeader ? marginLeft + (contentWidth - lineWidth) / 2 : marginLeft;
      ensureVerticalSpace(contactLineHeight);
      drawTextLine(line, lineX, currentY - contactFontSize, fontRegular, contactFontSize, theme.mutedColor);
      currentY -= contactLineHeight;
    }
  }

  // Header bottom divider rule
  currentY -= 4;
  if (theme.headerRuleStyle === "accent") {
    currentPage.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: marginLeft + contentWidth, y: currentY },
      thickness: 1.5,
      color: theme.accentLineColor,
    });
    currentY -= 10;
  } else if (theme.headerRuleStyle === "double") {
    currentPage.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: marginLeft + contentWidth, y: currentY },
      thickness: 1,
      color: theme.headingColor,
    });
    currentPage.drawLine({
      start: { x: marginLeft, y: currentY - 2.5 },
      end: { x: marginLeft + contentWidth, y: currentY - 2.5 },
      thickness: 0.5,
      color: theme.headingColor,
    });
    currentY -= 12;
  } else if (theme.headerRuleStyle === "single") {
    currentPage.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: marginLeft + contentWidth, y: currentY },
      thickness: 0.75,
      color: theme.accentLineColor,
    });
    currentY -= 10;
  } else {
    currentY -= 8;
  }

  /**
   * Helper: Draw standard section title with underline / accent
   */
  function drawSectionTitle(title: string): void {
    const displayTitle = theme.uppercaseSectionTitles ? title.toUpperCase() : title;
    const fontSize = 10.5;
    const titleWidth = fontBold.widthOfTextAtSize(displayTitle, fontSize);

    // Section title needs at least 45 points of space so it doesn't get orphaned at the bottom
    ensureVerticalSpace(45);

    drawTextLine(
      displayTitle,
      marginLeft,
      currentY - fontSize,
      fontBold,
      fontSize,
      theme.headingColor
    );

    const lineY = currentY - fontSize - 3;

    if (templateId === "modern-professional") {
      currentPage.drawLine({
        start: { x: marginLeft, y: lineY },
        end: { x: marginLeft + titleWidth + 15, y: lineY },
        thickness: 1.5,
        color: theme.accentLineColor,
      });
      currentPage.drawLine({
        start: { x: marginLeft + titleWidth + 15, y: lineY },
        end: { x: marginLeft + contentWidth, y: lineY },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.92),
      });
    } else {
      currentPage.drawLine({
        start: { x: marginLeft, y: lineY },
        end: { x: marginLeft + contentWidth, y: lineY },
        thickness: 0.75,
        color: theme.accentLineColor,
      });
    }

    currentY = lineY - 8;
  }

  // ==========================================
  // 2. PROFESSIONAL SUMMARY (OPTIONAL)
  // ==========================================
  if (data.summary && data.summary.trim()) {
    drawSectionTitle("Professional Summary");
    const summaryFontSize = 9.5;
    const summaryLineHeight = summaryFontSize * theme.lineSpacing;
    const lines = wrapText(data.summary.trim(), contentWidth, fontRegular, summaryFontSize);

    for (const line of lines) {
      ensureVerticalSpace(summaryLineHeight);
      drawTextLine(line, marginLeft, currentY - summaryFontSize, fontRegular, summaryFontSize, theme.bodyColor);
      currentY -= summaryLineHeight;
    }
    currentY -= theme.sectionGap;
  }

  // ==========================================
  // 3. WORK EXPERIENCE
  // ==========================================
  if (data.experiences && data.experiences.length > 0) {
    drawSectionTitle("Work Experience");

    for (const exp of data.experiences) {
      // Experience entry header: Job Title, Company, Date, Location
      const titleText = exp.jobTitle || "Job Title";
      const companyText = exp.company || "";
      const dateText = `${exp.startDate || ""} - ${exp.current ? "Present" : exp.endDate || ""}`.trim();
      const locationText = exp.location || "";

      ensureVerticalSpace(35);

      // Line 1: Job Title (Bold) and Dates (Right aligned)
      const titleFontSize = 10;
      drawTextLine(titleText, marginLeft, currentY - titleFontSize, fontBold, titleFontSize, theme.headingColor);

      if (dateText && dateText !== "-") {
        const dateFontSize = 9;
        const dateWidth = fontRegular.widthOfTextAtSize(dateText, dateFontSize);
        drawTextLine(
          dateText,
          marginLeft + contentWidth - dateWidth,
          currentY - dateFontSize,
          fontRegular,
          dateFontSize,
          theme.mutedColor
        );
      }
      currentY -= titleFontSize + 3;

      // Line 2: Company (Italic / semi-bold) and Location (Right aligned)
      if (companyText || locationText) {
        const companyFontSize = 9.5;
        const compFont = templateId === "classic-corporate" ? fontItalic : fontBold;
        if (companyText) {
          drawTextLine(
            companyText,
            marginLeft,
            currentY - companyFontSize,
            compFont,
            companyFontSize,
            templateId === "modern-professional" ? theme.primaryColor : theme.bodyColor
          );
        }
        if (locationText) {
          const locFontSize = 8.5;
          const locWidth = fontRegular.widthOfTextAtSize(locationText, locFontSize);
          drawTextLine(
            locationText,
            marginLeft + contentWidth - locWidth,
            currentY - locFontSize,
            fontRegular,
            locFontSize,
            theme.mutedColor
          );
        }
        currentY -= companyFontSize + 4;
      }

      // Responsibilities (Bullet points or text)
      if (exp.responsibilities) {
        const respFontSize = 9;
        const respLineHeight = respFontSize * theme.lineSpacing;
        const respParagraphs = exp.responsibilities.split("\n");

        for (const item of respParagraphs) {
          const rawItem = item.trim();
          if (!rawItem) continue;

          // Strip existing bullet chars
          const cleanItem = rawItem.replace(/^[-•*]\s*/, "");
          const bulletIndent = 12;
          const bulletWrapped = wrapText(cleanItem, contentWidth - bulletIndent, fontRegular, respFontSize);

          for (let i = 0; i < bulletWrapped.length; i++) {
            const bLine = bulletWrapped[i];
            ensureVerticalSpace(respLineHeight);

            if (i === 0) {
              // Draw bullet dot
              drawTextLine("•", marginLeft + 2, currentY - respFontSize, fontBold, respFontSize, theme.mutedColor);
            }
            drawTextLine(
              bLine,
              marginLeft + bulletIndent,
              currentY - respFontSize,
              fontRegular,
              respFontSize,
              theme.bodyColor
            );
            currentY -= respLineHeight;
          }
        }
      }

      // Key Achievement note
      if (exp.achievements) {
        const achFontSize = 8.5;
        const achLineHeight = achFontSize * theme.lineSpacing;
        const achLines = wrapText(`Key Achievement: ${exp.achievements}`, contentWidth - 12, fontItalic, achFontSize);

        currentY -= 2;
        for (const line of achLines) {
          ensureVerticalSpace(achLineHeight);
          drawTextLine(line, marginLeft + 12, currentY - achFontSize, fontItalic, achFontSize, theme.mutedColor);
          currentY -= achLineHeight;
        }
      }

      currentY -= theme.itemGap;
    }

    currentY -= theme.sectionGap - theme.itemGap;
  }

  // ==========================================
  // 4. EDUCATION
  // ==========================================
  if (data.education && data.education.length > 0) {
    drawSectionTitle("Education");

    for (const edu of data.education) {
      const degreeText = edu.degree ? `${edu.degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}` : edu.fieldOfStudy;
      const instText = edu.institution || "Institution";
      const yearText = edu.graduationYear || "";

      ensureVerticalSpace(30);

      // Line 1: Degree & Grad Year
      const degFontSize = 10;
      drawTextLine(degreeText || instText, marginLeft, currentY - degFontSize, fontBold, degFontSize, theme.headingColor);

      if (yearText) {
        const yearFontSize = 9;
        const yearWidth = fontRegular.widthOfTextAtSize(yearText, yearFontSize);
        drawTextLine(
          yearText,
          marginLeft + contentWidth - yearWidth,
          currentY - yearFontSize,
          fontRegular,
          yearFontSize,
          theme.mutedColor
        );
      }
      currentY -= degFontSize + 3;

      // Line 2: Institution Name
      if (degreeText && instText) {
        const instFontSize = 9.5;
        drawTextLine(
          instText,
          marginLeft,
          currentY - instFontSize,
          fontItalic,
          instFontSize,
          templateId === "modern-professional" ? theme.primaryColor : theme.bodyColor
        );
        currentY -= instFontSize + 3;
      }

      // Additional Details / Honors
      if (edu.additionalDetails) {
        const detailsFontSize = 8.5;
        const detailsLineHeight = detailsFontSize * theme.lineSpacing;
        const lines = wrapText(edu.additionalDetails, contentWidth - 10, fontRegular, detailsFontSize);

        for (const line of lines) {
          ensureVerticalSpace(detailsLineHeight);
          drawTextLine(line, marginLeft + 10, currentY - detailsFontSize, fontRegular, detailsFontSize, theme.mutedColor);
          currentY -= detailsLineHeight;
        }
      }

      currentY -= theme.itemGap;
    }

    currentY -= theme.sectionGap - theme.itemGap;
  }

  // ==========================================
  // 5. SKILLS (TECHNICAL & SOFT)
  // ==========================================
  const techSkills = data.skills?.technical || [];
  const softSkills = data.skills?.soft || [];

  if (techSkills.length > 0 || softSkills.length > 0) {
    drawSectionTitle("Skills");
    const skillFontSize = 9;
    const skillLineHeight = skillFontSize * 1.35;

    if (techSkills.length > 0) {
      const techStr = `Technical Skills: ${techSkills.join("  •  ")}`;
      const techLines = wrapText(techStr, contentWidth, fontRegular, skillFontSize);

      for (let i = 0; i < techLines.length; i++) {
        const line = techLines[i];
        ensureVerticalSpace(skillLineHeight);
        drawTextLine(
          line,
          marginLeft,
          currentY - skillFontSize,
          i === 0 ? fontBold : fontRegular,
          skillFontSize,
          theme.bodyColor
        );
        currentY -= skillLineHeight;
      }
      currentY -= 3;
    }

    if (softSkills.length > 0) {
      const softStr = `Soft Skills: ${softSkills.join("  •  ")}`;
      const softLines = wrapText(softStr, contentWidth, fontRegular, skillFontSize);

      for (let i = 0; i < softLines.length; i++) {
        const line = softLines[i];
        ensureVerticalSpace(skillLineHeight);
        drawTextLine(
          line,
          marginLeft,
          currentY - skillFontSize,
          i === 0 ? fontBold : fontRegular,
          skillFontSize,
          theme.bodyColor
        );
        currentY -= skillLineHeight;
      }
    }

    currentY -= theme.sectionGap;
  }

  // ==========================================
  // 6. PROJECTS
  // ==========================================
  if (data.projects && data.projects.length > 0) {
    drawSectionTitle("Key Projects");

    for (const proj of data.projects) {
      ensureVerticalSpace(30);

      // Project Title & URL
      const projFontSize = 10;
      drawTextLine(proj.title || "Project Title", marginLeft, currentY - projFontSize, fontBold, projFontSize, theme.headingColor);

      if (proj.projectUrl) {
        const urlFontSize = 8.5;
        const cleanUrl = proj.projectUrl.replace(/^https?:\/\/(www\.)?/, "");
        const urlWidth = fontRegular.widthOfTextAtSize(cleanUrl, urlFontSize);
        drawTextLine(
          cleanUrl,
          marginLeft + contentWidth - urlWidth,
          currentY - urlFontSize,
          fontRegular,
          urlFontSize,
          theme.mutedColor
        );
      }
      currentY -= projFontSize + 3;

      // Technologies used
      if (proj.technologies) {
        const techFontSize = 8.5;
        const techStr = `Technologies: ${proj.technologies}`;
        ensureVerticalSpace(techFontSize + 3);
        drawTextLine(
          techStr,
          marginLeft,
          currentY - techFontSize,
          fontItalic,
          techFontSize,
          templateId === "modern-professional" ? theme.primaryColor : theme.mutedColor
        );
        currentY -= techFontSize + 3;
      }

      // Description
      if (proj.description) {
        const descFontSize = 9;
        const descLineHeight = descFontSize * theme.lineSpacing;
        const descLines = wrapText(proj.description, contentWidth, fontRegular, descFontSize);

        for (const line of descLines) {
          ensureVerticalSpace(descLineHeight);
          drawTextLine(line, marginLeft, currentY - descFontSize, fontRegular, descFontSize, theme.bodyColor);
          currentY -= descLineHeight;
        }
      }

      currentY -= theme.itemGap;
    }

    currentY -= theme.sectionGap - theme.itemGap;
  }

  // ==========================================
  // 7. CERTIFICATIONS (OPTIONAL)
  // ==========================================
  if (data.certifications && data.certifications.length > 0) {
    drawSectionTitle("Certifications");

    for (const cert of data.certifications) {
      ensureVerticalSpace(16);
      const certFontSize = 9;
      const certTitle = `${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ""}`;
      drawTextLine(certTitle, marginLeft, currentY - certFontSize, fontBold, certFontSize, theme.bodyColor);

      if (cert.date) {
        const dateWidth = fontRegular.widthOfTextAtSize(cert.date, certFontSize);
        drawTextLine(
          cert.date,
          marginLeft + contentWidth - dateWidth,
          currentY - certFontSize,
          fontRegular,
          certFontSize,
          theme.mutedColor
        );
      }
      currentY -= certFontSize + 5;
    }
    currentY -= theme.sectionGap;
  }

  // ==========================================
  // 8. LANGUAGES (OPTIONAL)
  // ==========================================
  if (data.languages && data.languages.length > 0) {
    drawSectionTitle("Languages");
    ensureVerticalSpace(16);
    const langFontSize = 9;
    const langStr = data.languages
      .map((l) => (l.proficiency ? `${l.language} (${l.proficiency})` : l.language))
      .join("   •   ");
    const wrappedLang = wrapText(langStr, contentWidth, fontRegular, langFontSize);

    for (const line of wrappedLang) {
      ensureVerticalSpace(langFontSize * 1.3);
      drawTextLine(line, marginLeft, currentY - langFontSize, fontRegular, langFontSize, theme.bodyColor);
      currentY -= langFontSize * 1.3;
    }
    currentY -= theme.sectionGap;
  }

  // ==========================================
  // 9. AWARDS & ACHIEVEMENTS (OPTIONAL)
  // ==========================================
  if ((data.awards && data.awards.length > 0) || (data.achievements && data.achievements.length > 0)) {
    drawSectionTitle("Honors & Achievements");

    if (data.awards) {
      for (const award of data.awards) {
        ensureVerticalSpace(20);
        const awardFontSize = 9;
        const lineText = `${award.title}${award.issuer ? ` (${award.issuer})` : ""}`;
        drawTextLine(lineText, marginLeft, currentY - awardFontSize, fontBold, awardFontSize, theme.headingColor);

        if (award.date) {
          const dateWidth = fontRegular.widthOfTextAtSize(award.date, awardFontSize);
          drawTextLine(
            award.date,
            marginLeft + contentWidth - dateWidth,
            currentY - awardFontSize,
            fontRegular,
            awardFontSize,
            theme.mutedColor
          );
        }
        currentY -= awardFontSize + 3;

        if (award.summary) {
          const summaryLines = wrapText(award.summary, contentWidth - 10, fontRegular, 8.5);
          for (const sLine of summaryLines) {
            ensureVerticalSpace(11);
            drawTextLine(sLine, marginLeft + 10, currentY - 8.5, fontRegular, 8.5, theme.mutedColor);
            currentY -= 11;
          }
        }
        currentY -= 3;
      }
    }

    if (data.achievements) {
      for (const ach of data.achievements) {
        ensureVerticalSpace(18);
        const achFontSize = 9;
        drawTextLine(ach.title, marginLeft, currentY - achFontSize, fontBold, achFontSize, theme.bodyColor);
        currentY -= achFontSize + 3;

        if (ach.description) {
          const descLines = wrapText(ach.description, contentWidth - 10, fontRegular, 8.5);
          for (const dLine of descLines) {
            ensureVerticalSpace(11);
            drawTextLine(dLine, marginLeft + 10, currentY - 8.5, fontRegular, 8.5, theme.mutedColor);
            currentY -= 11;
          }
        }
        currentY -= 3;
      }
    }

    currentY -= theme.sectionGap;
  }

  // ==========================================
  // 10. MULTI-PAGE NUMBER FOOTERS
  // ==========================================
  if (pages.length > 1) {
    const totalPages = pages.length;
    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const pageStr = `Page ${i + 1} of ${totalPages}`;
      const pageFontSize = 8;
      const strWidth = fontRegular.widthOfTextAtSize(pageStr, pageFontSize);
      const strX = (pageWidth - strWidth) / 2;

      page.drawText(pageStr, {
        x: strX,
        y: 18,
        font: fontRegular,
        size: pageFontSize,
        color: rgb(0.5, 0.55, 0.6),
      });
    }
  }

  return await doc.save();
}

/**
 * Download a generated PDF buffer directly in the user's browser.
 */
export function downloadPdfBuffer(buffer: Uint8Array, filename = "resume.pdf"): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([buffer.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
