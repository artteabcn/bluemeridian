import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { stampBase64 } from '../assets/stamp';

const DARK_BLUE = rgb(15 / 255, 37 / 255, 55 / 255);
const GOLD      = rgb(138 / 255, 109 / 255, 59 / 255);
const GOLD_LT   = rgb(201 / 255, 169 / 255, 110 / 255);
const GRAY      = rgb(85 / 255, 85 / 255, 85 / 255);

export async function generateCertificate(
  name: string,
  jurisdiction: string,
  percentage: number,
  id: number = 1
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([841.89, 595.28]); // A4 landscape
  const { width, height } = page.getSize();

  const bold    = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const italic  = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const centered = (
    text: string,
    font: Awaited<ReturnType<typeof doc.embedFont>>,
    size: number,
    y: number,
    color = DARK_BLUE
  ): void => {
    page.drawText(text, { x: (width - font.widthOfTextAtSize(text, size)) / 2, y, font, size, color });
  };

  const pad   = 38;
  const inner = 56;
  const bl    = 24; // bracket arm length

  // Outer border (thick navy)
  page.drawRectangle({ x: pad, y: pad, width: width - pad*2, height: height - pad*2, borderColor: DARK_BLUE, borderWidth: 2.5 });
  // Inner border (thin navy)
  page.drawRectangle({ x: inner, y: inner, width: width - inner*2, height: height - inner*2, borderColor: DARK_BLUE, borderWidth: 0.7 });

  // Corner L-bracket ornaments in gold at inner border corners
  const corners: Array<[number, number, number, number, number, number, number, number]> = [
    // top-left: horiz → right, vert → down
    [inner+7, height-inner-7,  inner+7+bl, height-inner-7,  inner+7, height-inner-7,  inner+7, height-inner-7-bl],
    // top-right: horiz → left, vert → down
    [width-inner-7-bl, height-inner-7,  width-inner-7, height-inner-7,  width-inner-7, height-inner-7,  width-inner-7, height-inner-7-bl],
    // bottom-left: horiz → right, vert → up
    [inner+7, inner+7,  inner+7+bl, inner+7,  inner+7, inner+7+bl,  inner+7, inner+7],
    // bottom-right: horiz → left, vert → up
    [width-inner-7-bl, inner+7,  width-inner-7, inner+7,  width-inner-7, inner+7+bl,  width-inner-7, inner+7],
  ];
  for (const [x1,y1,x2,y2,x3,y3,x4,y4] of corners) {
    page.drawLine({ start:{x:x1,y:y1}, end:{x:x2,y:y2}, thickness: 1.4, color: GOLD_LT });
    page.drawLine({ start:{x:x3,y:y3}, end:{x:x4,y:y4}, thickness: 1.4, color: GOLD_LT });
  }

  // Company name
  centered('AEGIS FLAG REGISTRY CORPORATION', bold, 21, height - 104, DARK_BLUE);
  // Subtitle
  centered('Delaware Corporation  ·  File Number: DE 10677842  ·  Incorporated: June 26, 2026', regular, 8.5, height - 122, GRAY);
  // Rule below subtitle
  page.drawLine({ start:{x:inner+20, y:height-135}, end:{x:width-inner-20, y:height-135}, thickness: 0.4, color: DARK_BLUE });

  // Certificate title
  centered('CERTIFICATE OF OWNERSHIP SHARE', bold, 18, height - 172, GOLD);

  // Decorative divider: rule + diamond
  const divY = height - 197;
  const cx   = width / 2;
  const ds   = 5;
  page.drawLine({ start:{x:inner+20, y:divY}, end:{x:cx-ds-8, y:divY}, thickness: 0.35, color: GOLD_LT });
  page.drawLine({ start:{x:cx+ds+8, y:divY}, end:{x:width-inner-20, y:divY}, thickness: 0.35, color: GOLD_LT });
  // Diamond ◇
  page.drawLine({ start:{x:cx,y:divY+ds}, end:{x:cx+ds,y:divY}, thickness: 0.8, color: GOLD_LT });
  page.drawLine({ start:{x:cx+ds,y:divY}, end:{x:cx,y:divY-ds}, thickness: 0.8, color: GOLD_LT });
  page.drawLine({ start:{x:cx,y:divY-ds}, end:{x:cx-ds,y:divY}, thickness: 0.8, color: GOLD_LT });
  page.drawLine({ start:{x:cx-ds,y:divY}, end:{x:cx,y:divY+ds}, thickness: 0.8, color: GOLD_LT });

  // Body text in Times Roman Italic (formal legal style)
  centered(`This certifies that ${name},`, italic, 13, height - 232);
  centered(`incorporated in ${jurisdiction},`, italic, 13, height - 252);
  centered(`is the registered holder of ${percentage}% of the total authorized capital stock`, italic, 13, height - 272);
  centered('of Aegis Flag Registry Corporation.', italic, 13, height - 292);

  // Stamp (center-bottom)
  try {
    const stampBytes = Uint8Array.from(atob(stampBase64), c => c.charCodeAt(0));
    const img = await doc.embedPng(stampBytes);
    const dims = img.scaleToFit(88, 88);
    page.drawImage(img, { x: (width - dims.width) / 2, y: inner + 28, ...dims });
  } catch { /* decorative */ }

  // Footer rule
  page.drawLine({ start:{x:inner+20, y:inner+100}, end:{x:width-inner-20, y:inner+100}, thickness: 0.3, color: DARK_BLUE });

  // Serial number (bottom-left)
  const serial = `No. AEGIS-2026-${String(id).padStart(4, '0')}`;
  page.drawText(serial, { x: inner+20, y: inner+108, font: bold, size: 8, color: DARK_BLUE });

  // Issue date (below serial)
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(`Issued: ${date}`, { x: inner+20, y: inner+78, font: regular, size: 9, color: GRAY });

  // Signature line (bottom-right)
  const sigX = width - inner - 190;
  page.drawLine({ start:{x:sigX, y:inner+95}, end:{x:sigX+170, y:inner+95}, thickness: 0.5, color: DARK_BLUE });
  const sigLabel = 'Authorized Director';
  page.drawText(sigLabel, {
    x: sigX + (170 - regular.widthOfTextAtSize(sigLabel, 10)) / 2,
    y: inner + 82,
    font: regular, size: 10, color: DARK_BLUE,
  });

  return doc.save();
}
