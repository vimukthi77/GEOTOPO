import jsPDF from 'jspdf';
import { TrackerTerrainCalculationResult } from './calculateTrackerCoordinates';

async function loadImageAsBase64(url: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportTrackerTerrainToPdf(
  result: TrackerTerrainCalculationResult
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  let yPos = margin;

  // Load all 3 logos: rivilogo.png (Client), windlogo.png & laklogo.png (EPC Contractors)
  const riviLogo = await loadImageAsBase64('/rivilogo.png');
  const windLogo = await loadImageAsBase64('/windlogo.png');
  const lakLogo = await loadImageAsBase64('/laklogo.png');

  // 1. Top Centered Facility Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(
    '100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );

  yPos += 5;
  doc.setFontSize(10);
  doc.text('TRACKER - GRADIENT CHECKLIST', pageWidth / 2, yPos, { align: 'center' });

  // Underline title
  const titleW = doc.getTextWidth('TRACKER - GRADIENT CHECKLIST');
  doc.setLineWidth(0.4);
  doc.setDrawColor(15, 23, 42);
  doc.line((pageWidth - titleW) / 2, yPos + 1, (pageWidth + titleW) / 2, yPos + 1);

  yPos += 5;

  // 2. Official Header Box Grid (Matching Reference Image)
  const headerBoxHeight = 36; // 4 rows x 9mm
  const col1Width = contentWidth * 0.65; // ~120mm
  const col2Width = contentWidth * 0.35; // ~66mm
  const rowHeight = 9;

  // Outer Box Border
  doc.setLineWidth(0.4);
  doc.setDrawColor(0, 0, 0);
  doc.rect(margin, yPos, contentWidth, headerBoxHeight);

  // Vertical Divider Line between Col 1 and Col 2
  const midX = margin + col1Width;
  doc.line(midX, yPos, midX, yPos + headerBoxHeight);

  // Horizontal Row Lines
  for (let r = 1; r < 4; r++) {
    const ry = yPos + r * rowHeight;
    doc.line(margin, ry, margin + contentWidth, ry);
  }

  // Row 1: Client & Doc No
  let ry1 = yPos + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('CLIENT: Rividhanavi (Private) Limited', margin + 3, ry1);

  // Rividhanavi Logo & Address
  if (riviLogo) {
    try {
      doc.addImage(riviLogo, 'PNG', margin + 62, yPos + 1, 14, 7);
    } catch {
      // fallback
    }
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('No. 67, Park Street, Colombo 02, Sri Lanka', margin + 78, yPos + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`Doc. No: ${result.docNo}`, midX + 3, ry1);

  // Row 2: EPC Contractors & Sheet No
  let ry2 = yPos + rowHeight + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('EPC CONTRACTORS:', margin + 3, ry2 - 2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Windforce PLC & Lakdhanavi Limited', margin + 3, ry2 + 1.5);

  // Windforce & Lakdhanavi Logos
  if (windLogo) {
    try {
      doc.addImage(windLogo, 'PNG', margin + 68, yPos + rowHeight + 1.5, 9, 6);
    } catch {
      // fallback
    }
  }
  if (lakLogo) {
    try {
      doc.addImage(lakLogo, 'PNG', margin + 80, yPos + rowHeight + 1.5, 22, 6);
    } catch {
      // fallback
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Sheet No: 01 of 01', midX + 3, ry2);

  // Row 3: Structure & Location/Grid
  let ry3 = yPos + rowHeight * 2 + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`Structure : ${result.zoneName}`, margin + 3, ry3);
  doc.text(`Location/ Grid : ${result.locationGrid}`, midX + 3, ry3);

  // Row 4: TRACKER ID & Inspection Date
  let ry4 = yPos + rowHeight * 3 + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`TRACKER ID : ${result.trackerId}`, margin + 3, ry4);
  doc.setFontSize(8.5);
  doc.text(`Inspection Date : ${result.inspectionDate}`, midX + 3, ry4);

  yPos += headerBoxHeight + 6;

  // 3. Engineering Geometry Parameter Summary Grid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 46, 129);
  doc.text('ENGINEERING PARAMETERS & GEOMETRY SUMMARY', margin, yPos);
  yPos += 4;

  const cardW = (contentWidth - 6) / 4;
  const cardH = 15;

  const paramCards = [
    { label: 'E1 & E2 ELEVATION', val: `${result.E1_m.toFixed(3)} → ${result.E2_m.toFixed(3)} m`, sub: `ΔE: ${result.deltaElevation_m >= 0 ? '+' : ''}${result.deltaElevation_m.toFixed(3)} m` },
    { label: 'SLOPE DIRECTION', val: result.direction, sub: `Angle θ: ${result.thetaDeg.toFixed(6)}°` },
    { label: 'TRACKER LENGTH (L)', val: `${result.totalLengthM.toFixed(3)} m`, sub: `${result.totalLengthMm} mm` },
    { label: 'GROUND PROJECTION (Y)', val: `${result.totalHorizontalProjectionM.toFixed(3)} m`, sub: `${result.totalHorizontalProjectionMm.toFixed(1)} mm` },
  ];

  paramCards.forEach((card, idx) => {
    const cx = margin + idx * (cardW + 2);
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(cx, yPos, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(79, 70, 229);
    doc.text(card.label, cx + 3, yPos + 4.5);

    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    doc.text(card.val, cx + 3, yPos + 9.5);

    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text(card.sub, cx + 3, yPos + 13.5);
  });

  yPos += cardH + 6;

  // 4. Point Coordinate Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 46, 129);
  doc.text('TRACKER POST TERRAIN COORDINATE TABLE', margin, yPos);
  yPos += 4;

  const colWidths = [12, 25, 26, 26, 20, 25, 26, 26]; // Total = 186mm (contentWidth = 186mm)
  const headers = [
    'Pile',
    'Phys Segment (mm)',
    'Horiz Proj ΔY (mm)',
    'Cum Ground Y (mm)',
    'X (mm)',
    'Y Ground (mm)',
    'Z Elevation (m)',
    'ΔZ Change (mm)',
  ];

  // Draw Table Header Row
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, yPos, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);

  let curX = margin + 1.5;
  headers.forEach((h, i) => {
    doc.text(h, curX, yPos + 4.5);
    curX += colWidths[i];
  });

  yPos += 6.5;

  // Draw Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  result.points.forEach((pt, rowIdx) => {
    // Check page overflow
    if (yPos > pageHeight - 22) {
      doc.addPage();
      yPos = margin;
      // Re-draw table header
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, yPos, contentWidth, 6.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      let rX = margin + 1.5;
      headers.forEach((h, i) => {
        doc.text(h, rX, yPos + 4.5);
        rX += colWidths[i];
      });
      yPos += 6.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
    }

    const isEven = rowIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, yPos, contentWidth, 5.5, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, yPos + 5.5, margin + contentWidth, yPos + 5.5);

    doc.setTextColor(15, 23, 42);
    let cX = margin + 1.5;

    const values = [
      pt.label,
      pt.segmentLengthMm !== null ? pt.segmentLengthMm.toString() : '-',
      pt.deltaYMm !== null ? pt.deltaYMm.toFixed(2) : '-',
      pt.cumGroundYMm.toFixed(2),
      pt.xMm.toFixed(3),
      pt.yMm.toFixed(3),
      pt.zM.toFixed(3),
      pt.deltaZMm !== null ? pt.deltaZMm.toFixed(2) : '-',
    ];

    values.forEach((v, colIdx) => {
      doc.text(v, cX, yPos + 4);
      cX += colWidths[colIdx];
    });

    yPos += 5.5;
  });

  // Append TOTAL / SUM Row at bottom of table
  if (yPos > pageHeight - 22) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFillColor(224, 242, 254);
  doc.setDrawColor(186, 230, 253);
  doc.rect(margin, yPos, contentWidth, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(3, 105, 161);

  let totX = margin + 1.5;
  const totValues = [
    'TOTAL',
    result.totalLengthMm.toString(),
    result.totalHorizontalProjectionMm.toFixed(2),
    result.totalHorizontalProjectionMm.toFixed(2),
    '0.000',
    result.totalHorizontalProjectionMm.toFixed(2),
    result.E2_m.toFixed(3),
    `${result.deltaElevation_mm >= 0 ? '+' : ''}${result.deltaElevation_mm.toFixed(2)}`,
  ];

  totValues.forEach((v, colIdx) => {
    doc.text(v, totX, yPos + 4.2);
    totX += colWidths[colIdx];
  });

  yPos += 8;

  // 5. Engineering QA Validation Box
  if (yPos > pageHeight - 35) {
    doc.addPage();
    yPos = margin;
  }

  doc.setFillColor(result.endpointValidationPass ? 240 : 254, result.endpointValidationPass ? 253 : 242, result.endpointValidationPass ? 244 : 242);
  doc.setDrawColor(result.endpointValidationPass ? 187 : 254, result.endpointValidationPass ? 247 : 202, result.endpointValidationPass ? 208 : 202);
  doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(result.endpointValidationPass ? 22 : 153, result.endpointValidationPass ? 101 : 27, result.endpointValidationPass ? 52 : 27);
  doc.text(
    `ENGINEERING QA ENDPOINT CHECK: ${result.endpointValidationPass ? 'PASS (CONFIRMED)' : 'CHECK (DISCREPANCY DETECTED)'}`,
    margin + 5,
    yPos + 6
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Expected E2 Elevation: ${result.E2_m.toFixed(6)} m   |   Calculated Final Z: ${result.calculatedFinalZM.toFixed(6)} m`,
    margin + 5,
    yPos + 12
  );
  doc.text(
    `Endpoint Discrepancy Error: ${result.endpointErrorM.toFixed(6)} m   |   Total Inclined Length: ${result.totalLengthMm} mm (${result.totalLengthM.toFixed(3)} m)`,
    margin + 5,
    yPos + 17
  );

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.line(margin, pageHeight - 10, margin + contentWidth, pageHeight - 10);
    doc.text(
      `Generated by Solar Pile Tracker Engineering System • Tracker ID: ${result.trackerId} • Zone: ${result.zoneName}`,
      margin,
      pageHeight - 5
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 16, pageHeight - 5);
  }

  // Save PDF
  const safeTrackerId = result.trackerId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const safeZone = result.zoneName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `Tracker_Post_Terrain_Coordinates_${safeTrackerId}_${safeZone}.pdf`;

  doc.save(filename);
}
