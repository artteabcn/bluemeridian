import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const DARK_BLUE = rgb(15 / 255, 37 / 255, 55 / 255);
const GOLD      = rgb(138 / 255, 109 / 255, 59 / 255);
const GRAY      = rgb(85 / 255, 85 / 255, 85 / 255);

export async function generateCertificate(
  name: string,
  jurisdiction: string,
  percentage: number
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  const { width, height } = page.getSize();

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const centered = (
    text: string,
    font: Awaited<ReturnType<typeof doc.embedFont>>,
    size: number,
    y: number,
    color = DARK_BLUE
  ): void => {
    const x = (width - font.widthOfTextAtSize(text, size)) / 2;
    page.drawText(text, { x, y, font, size, color });
  };

  const pad   = 40;
  const inner = 58;

  // Double border
  page.drawRectangle({ x: pad,   y: pad,   width: width - pad * 2,   height: height - pad * 2,   borderColor: DARK_BLUE, borderWidth: 2.5 });
  page.drawRectangle({ x: inner, y: inner, width: width - inner * 2, height: height - inner * 2, borderColor: DARK_BLUE, borderWidth: 0.8 });

  // Company name
  centered('AEGIS FLAG REGISTRY CORPORATION', bold, 22, height - 105, DARK_BLUE);

  // Subtitle
  centered(
    'Delaware Corporation  ·  File Number: DE 10677842  ·  Incorporated: June 26, 2026',
    regular, 9, height - 125, GRAY
  );

  // Rule
  page.drawLine({
    start: { x: inner + 20, y: height - 138 },
    end:   { x: width - inner - 20, y: height - 138 },
    thickness: 0.5, color: DARK_BLUE,
  });

  // Certificate title
  centered('CERTIFICATE OF OWNERSHIP SHARE', bold, 17, height - 175, GOLD);

  // Body lines
  centered(`This certifies that ${name}, incorporated in ${jurisdiction},`, regular, 13, height - 230);
  centered(`is the registered holder of ${percentage}% of the total authorized capital stock`, regular, 13, height - 252);
  centered('of Aegis Flag Registry Corporation.', regular, 13, height - 274);

  // Footer rule
  page.drawLine({
    start: { x: inner + 20, y: inner + 85 },
    end:   { x: width - inner - 20, y: inner + 85 },
    thickness: 0.3, color: DARK_BLUE,
  });

  // Date (bottom-left)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(`Certificate Date: ${date}`, { x: inner + 20, y: inner + 68, font: regular, size: 9, color: GRAY });

  // Stamp image (center-bottom, skip silently if unavailable)
  try {
    const res = await fetch('https://aegis-8x3.pages.dev/stamp.png');
    if (res.ok) {
      const imgBytes = await res.arrayBuffer();
      const img = await doc.embedPng(imgBytes);
      const dims = img.scaleToFit(80, 80);
      page.drawImage(img, { x: (width - dims.width) / 2, y: inner + 30, ...dims });
    }
  } catch {
    // stamp is decorative; skip silently
  }

  // Signature line (bottom-right)
  const sigX = width - inner - 185;
  page.drawLine({ start: { x: sigX, y: inner + 80 }, end: { x: sigX + 165, y: inner + 80 }, thickness: 0.5, color: DARK_BLUE });
  const sigLabel = 'Authorized Director';
  page.drawText(sigLabel, {
    x: sigX + (165 - regular.widthOfTextAtSize(sigLabel, 10)) / 2,
    y: inner + 67,
    font: regular, size: 10, color: DARK_BLUE,
  });

  return doc.save();
}
