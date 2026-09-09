/**
 * Tracker Calculator Configuration & Engineering Calculation Engine
 * 
 * Supports:
 * - 2 STRING: 8 Pile Points (Axis X, Overall 61.250m) & 9 Pile Points (Axis X, Overall 61.200m)
 * - 3 STRING: 11 Pile Points (Axis Z, Overall 91.300m) & 12 Pile Points (Axis Z, Overall 93.200m)
 * - 4 STRING: 15 Pile Points (Axis Y, Overall 123.500m) & 16 Pile Points (Axis Y, Overall 125.300m)
 */

export type TrackerType = '2 STRING' | '3 STRING' | '4 STRING';
export type TrackerAxis = 'X' | 'Y' | 'Z';
export type DirectionType = 'UP (+)' | 'DOWN (-)' | 'LEVEL';

export interface TrackerConfig {
  key: string;
  trackerType: TrackerType;
  pilePoints: number;
  axis: TrackerAxis;
  overallDistance: number;
  values: number[];
  label: string;
}

export const trackerConfigurations: Record<string, TrackerConfig> = {
  "2_STRING_8": {
    key: "2_STRING_8",
    trackerType: "2 STRING",
    pilePoints: 8,
    axis: "X",
    overallDistance: 61.250,
    label: "8 Pile Points (Overall X: 61.250m)",
    values: [
      8.050,
      17.250,
      26.450,
      35.650,
      44.500,
      53.930,
      61.250
    ]
  },

  "2_STRING_9": {
    key: "2_STRING_9",
    trackerType: "2 STRING",
    pilePoints: 9,
    axis: "X",
    overallDistance: 61.200,
    label: "9 Pile Points (Overall X: 61.200m)",
    values: [
      6.800,
      14.850,
      22.900,
      30.600,
      38.300,
      46.350,
      54.400,
      61.200
    ]
  },

  "3_STRING_11": {
    key: "3_STRING_11",
    trackerType: "3 STRING",
    pilePoints: 11,
    axis: "Z",
    overallDistance: 91.300,
    label: "11 Pile Points (Overall Z: 91.300m)",
    values: [
      9.200,
      18.400,
      27.600,
      36.800,
      45.650,
      54.500,
      63.700,
      72.900,
      82.100,
      91.300
    ]
  },

  "3_STRING_12": {
    key: "3_STRING_12",
    trackerType: "3 STRING",
    pilePoints: 12,
    axis: "Z",
    overallDistance: 93.200,
    label: "12 Pile Points (Overall Z: 93.200m)",
    values: [
      7.850,
      17.050,
      26.250,
      34.300,
      42.350,
      50.400,
      58.450,
      67.300,
      76.150,
      85.350,
      93.200
    ]
  },

  "4_STRING_15": {
    key: "4_STRING_15",
    trackerType: "4 STRING",
    pilePoints: 15,
    axis: "Y",
    overallDistance: 123.500,
    label: "15 Pile Points (Overall Y: 123.500m)",
    values: [
      8.050,
      17.250,
      25.300,
      33.350,
      42.550,
      51.750,
      60.950,
      70.150,
      79.000,
      87.850,
      97.050,
      106.250,
      115.450,
      123.500
    ]
  },

  "4_STRING_16": {
    key: "4_STRING_16",
    trackerType: "4 STRING",
    pilePoints: 16,
    axis: "Y",
    overallDistance: 125.300,
    label: "16 Pile Points (Overall Y: 125.300m)",
    values: [
      7.800,
      15.850,
      23.900,
      33.100,
      42.300,
      50.350,
      58.400,
      66.450,
      74.500,
      83.350,
      92.200,
      101.400,
      109.450,
      117.500,
      125.300
    ]
  }
};

export interface PilePointResult {
  point: string;
  distance: number;
  result: number;
  elevation: number;
}

export interface TrackerCalculationOutput {
  trackerType: TrackerType;
  configurationKey: string;
  configurationName: string;
  pilePoints: number;
  numberOfValues: number;
  axis: TrackerAxis;
  overallDistance: number;
  E1: number;
  E2: number;
  elevationDifference: number;
  direction: DirectionType;
  tan: number;
  angleDeg: number;
  results: PilePointResult[];
}

export interface SavedTrackerRecord {
  id: string;
  timestamp: string;
  isoDate: string;
  calculation: TrackerCalculationOutput;
  notes?: string;
}

/**
 * Executes tracker calculation according to exact engineering formulas.
 * Uses full floating point precision internally.
 */
export function calculateTracker(
  E1: number,
  E2: number,
  configKey: string
): TrackerCalculationOutput {
  const configuration = trackerConfigurations[configKey];
  if (!configuration) {
    throw new Error(`Invalid tracker configuration key: "${configKey}".`);
  }

  if (typeof E1 !== 'number' || isNaN(E1) || !isFinite(E1)) {
    throw new Error('E1 Elevation must be a valid numeric value.');
  }

  if (typeof E2 !== 'number' || isNaN(E2) || !isFinite(E2)) {
    throw new Error('E2 Elevation must be a valid numeric value.');
  }

  const elevationDifference = Math.abs(E2 - E1);
  const overallDistance = configuration.overallDistance;
  const tan = elevationDifference / overallDistance;
  const angleDeg = Math.atan(tan) * (180 / Math.PI);

  let direction: DirectionType;
  if (E2 > E1) {
    direction = 'UP (+)';
  } else if (E2 < E1) {
    direction = 'DOWN (-)';
  } else {
    direction = 'LEVEL';
  }

  const results: PilePointResult[] = configuration.values.map((distance, index) => {
    const result = tan * distance;

    let elevation: number;
    if (E2 > E1) {
      elevation = E1 + result;
    } else if (E2 < E1) {
      elevation = E1 - result;
    } else {
      elevation = E1;
    }

    return {
      point: `${configuration.axis}${index + 1}`,
      distance,
      result,
      elevation
    };
  });

  return {
    trackerType: configuration.trackerType,
    configurationKey: configKey,
    configurationName: `${configuration.pilePoints} Pile Points`,
    pilePoints: configuration.pilePoints,
    numberOfValues: configuration.values.length,
    axis: configuration.axis,
    overallDistance,
    E1,
    E2,
    elevationDifference,
    direction,
    tan,
    angleDeg,
    results
  };
}

/**
 * Generates a self-contained SVG representation of the longitudinal tracker profile,
 * complete with beam inclination, pile posts, ground datum, angle arc, and labels.
 */
export function generateTrackerChartSvg(data: TrackerCalculationOutput): string {
  const width = 700;
  const height = 240;
  const datumY = 180;
  const beamStartX = 60;
  const beamEndX = 640;
  const beamSpan = beamEndX - beamStartX;

  let yStart = 140;
  let yEnd = 60;
  if (data.direction === 'UP (+)') {
    yStart = 150;
    yEnd = 60;
  } else if (data.direction === 'DOWN (-)') {
    yStart = 60;
    yEnd = 150;
  } else {
    yStart = 100;
    yEnd = 100;
  }

  const pileLines = data.results.map((pile) => {
    const ratio = data.overallDistance > 0 ? pile.distance / data.overallDistance : 0;
    const px = beamStartX + ratio * beamSpan;
    const py = yStart + (yEnd - yStart) * ratio;
    const isLast = Math.abs(pile.distance - data.overallDistance) < 1e-4;
    const strokeColor = isLast ? '#34D399' : '#94A3B8';
    const dotColor = isLast ? '#10B981' : '#38BDF8';

    return `
      <line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${px.toFixed(1)}" y2="${datumY}" stroke="${strokeColor}" stroke-width="1.5" stroke-dasharray="2 2" />
      <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${isLast ? 4.5 : 3.5}" fill="${dotColor}" stroke="#0F172A" stroke-width="1" />
      <text x="${px.toFixed(1)}" y="195" text-anchor="middle" font-size="7.5" font-weight="bold" fill="${isLast ? '#34D399' : '#CBD5E1'}">${pile.point}</text>
      <text x="${px.toFixed(1)}" y="206" text-anchor="middle" font-size="7" fill="#64748B">${pile.distance.toFixed(1)}m</text>
    `;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background-color: #0A192F; font-family: 'Segoe UI', Calibri, Arial, sans-serif;">
      <rect width="${width}" height="${height}" fill="#0A192F" rx="8"/>
      
      <!-- Top Title Bar -->
      <rect x="0" y="0" width="${width}" height="32" fill="#0B1E5B" rx="8"/>
      <text x="20" y="21" font-size="11" font-weight="bold" fill="#FFFFFF">${data.trackerType} (${data.configurationName}) — Longitudinal Profile</text>
      <text x="${width - 20}" y="21" text-anchor="end" font-size="10" font-weight="bold" fill="#38BDF8">Direction: ${data.direction}</text>

      <!-- Datum Ground Line -->
      <line x1="30" y1="${datumY}" x2="${width - 30}" y2="${datumY}" stroke="#334155" stroke-width="1.5" stroke-dasharray="4 4"/>
      <text x="35" y="${datumY - 6}" font-size="8" fill="#64748B" font-style="italic">Datum Level</text>

      <!-- Pile Lines & Points -->
      ${pileLines}

      <!-- Main Tracker Beam -->
      <line x1="${beamStartX}" y1="${yStart}" x2="${beamEndX}" y2="${yEnd}" stroke="#38BDF8" stroke-width="4" stroke-linecap="round"/>
      <line x1="${beamStartX}" y1="${yStart}" x2="${beamEndX}" y2="${yEnd}" stroke="#0284C7" stroke-width="1.5" stroke-linecap="round"/>

      <!-- E1 Start Marker -->
      <circle cx="${beamStartX}" cy="${yStart}" r="6" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
      <rect x="${beamStartX - 45}" y="${yStart > 100 ? yStart - 28 : yStart + 12}" width="90" height="18" rx="4" fill="#064E3B" stroke="#10B981" stroke-width="1"/>
      <text x="${beamStartX}" y="${yStart > 100 ? yStart - 16 : yStart + 24}" text-anchor="middle" font-size="9" font-weight="bold" fill="#A7F3D0">E1: ${data.E1.toFixed(3)}m</text>

      <!-- E2 End Marker -->
      <circle cx="${beamEndX}" cy="${yEnd}" r="6" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2"/>
      <rect x="${beamEndX - 45}" y="${yEnd > 100 ? yEnd - 28 : yEnd + 12}" width="90" height="18" rx="4" fill="#0C4A6E" stroke="#38BDF8" stroke-width="1"/>
      <text x="${beamEndX}" y="${yEnd > 100 ? yEnd - 16 : yEnd + 24}" text-anchor="middle" font-size="9" font-weight="bold" fill="#BAE6FD">E2: ${data.E2.toFixed(3)}m</text>

      <!-- Center Metric Pill -->
      <rect x="${(width - 240) / 2}" y="40" width="240" height="26" rx="13" fill="#1E293B" stroke="#0D9488" stroke-width="1.5"/>
      <text x="${width / 2}" y="57" text-anchor="middle" font-size="10" font-weight="bold" fill="#F8FAFC">
        Tan: <tspan fill="#38BDF8">${data.tan.toFixed(6)}</tspan> &bull; Angle: <tspan fill="#FDE047">${data.angleDeg.toFixed(3)}&deg;</tspan>
      </text>

      <!-- Bottom Dimension -->
      <line x1="${beamStartX}" y1="224" x2="${beamEndX}" y2="224" stroke="#475569" stroke-width="1"/>
      <line x1="${beamStartX}" y1="220" x2="${beamStartX}" y2="228" stroke="#475569" stroke-width="1"/>
      <line x1="${beamEndX}" y1="220" x2="${beamEndX}" y2="228" stroke="#475569" stroke-width="1"/>
      <text x="${width / 2}" y="222" text-anchor="middle" font-size="8.5" fill="#94A3B8" font-weight="bold">Overall Axis ${data.axis} Distance: ${data.overallDistance.toFixed(3)} m</text>
    </svg>
  `.trim();
}

/**
 * Splits a Base64 string into 76-character lines in compliance with RFC 2045 MIME specifications.
 */
function chunkBase64(str: string): string {
  return str.match(/.{1,76}/g)?.join('\r\n') || str;
}

/**
 * Renders an ultra-sharp, high-resolution (1400x480) 2D canvas image of the
 * tracker longitudinal profile chart and returns it as a PNG Data URL.
 * In SSR or headless unit-test environments where window/document is unavailable,
 * falls back safely to a 1x1 transparent PNG data URL.
 */
export function renderTrackerChartToCanvasPng(data: TrackerCalculationOutput): string {
  if (typeof document === 'undefined') {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  const width = 1400;
  const height = 480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  // 1. Dark Blueprint Background
  ctx.fillStyle = '#0A192F';
  ctx.fillRect(0, 0, width, height);

  // Outer Border
  ctx.strokeStyle = '#1E3A8A';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // 2. Horizontal Grid Guidelines
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);
  [80, 150, 220, 290].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(width - 60, y);
    ctx.stroke();
  });

  // Datum Ground Reference Line
  const datumY = 380;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(60, datumY);
  ctx.lineTo(width - 60, datumY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#64748B';
  ctx.font = 'italic bold 15px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Datum Ground Level (0.000m Reference Plane)', 70, datumY - 10);

  // 3. Coordinate Mapping
  const beamStartX = 140;
  const beamEndX = 1260;
  const beamSpanX = beamEndX - beamStartX;

  const isUp = data.E2 > data.E1;
  const isDown = data.E2 < data.E1;
  const yStart = isUp ? 280 : isDown ? 120 : 200;
  const yEnd = isUp ? 120 : isDown ? 280 : 200;

  // 4. Fill underneath beam to datum line
  ctx.beginPath();
  ctx.moveTo(beamStartX, datumY);
  ctx.lineTo(beamStartX, yStart);
  ctx.lineTo(beamEndX, yEnd);
  ctx.lineTo(beamEndX, datumY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.fill();

  // 5. Angle Theta Reference Line from E1
  if (data.elevationDifference > 0) {
    const refEndX = beamStartX + 200;
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(beamStartX, yStart);
    ctx.lineTo(refEndX, yStart);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arc
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (isUp) {
      ctx.arc(beamStartX, yStart, 110, -0.28, 0, false);
    } else {
      ctx.arc(beamStartX, yStart, 110, 0, 0.28, false);
    }
    ctx.stroke();

    // Theta label badge
    const badgeX = beamStartX + 125;
    const badgeY = isUp ? yStart - 44 : yStart + 18;
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(badgeX, badgeY, 110, 26, 6);
    } else {
      ctx.rect(badgeX, badgeY, 110, 26);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`θ = ${data.angleDeg.toFixed(3)}°`, badgeX + 55, badgeY + 18);
  }

  // 6. Intermediate Pile Posts
  data.results.forEach((item, idx) => {
    const isLast = idx === data.results.length - 1;
    const ratio = data.overallDistance > 0 ? item.distance / data.overallDistance : 0;
    const pileX = beamStartX + ratio * beamSpanX;
    const beamY = yStart + ratio * (yEnd - yStart);

    // Vertical pile post from datum to beam
    ctx.strokeStyle = isLast ? '#34D399' : '#0284C7';
    ctx.lineWidth = isLast ? 2.5 : 2;
    ctx.setLineDash(isLast ? [] : [4, 4]);
    ctx.beginPath();
    ctx.moveTo(pileX, datumY);
    ctx.lineTo(pileX, beamY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Joint dot on beam
    ctx.beginPath();
    ctx.arc(pileX, beamY, isLast ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = isLast ? '#10B981' : '#38BDF8';
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Point name at datum base
    ctx.fillStyle = isLast ? '#34D399' : '#CBD5E1';
    ctx.font = 'bold 13px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(item.point, pileX, datumY + 22);

    // Elevation label
    ctx.fillStyle = isLast ? '#6EE7B7' : '#94A3B8';
    ctx.font = '11px Consolas, monospace';
    ctx.fillText(`${item.elevation.toFixed(2)}m`, pileX, datumY + 38);
  });

  // 7. Main Tracker Beam
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(beamStartX, yStart);
  ctx.lineTo(beamEndX, yEnd);
  ctx.stroke();

  // Beam Inner Core Highlight
  ctx.strokeStyle = '#E0F2FE';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(beamStartX, yStart);
  ctx.lineTo(beamEndX, yEnd);
  ctx.stroke();

  // 8. E1 Start Marker & Pill
  ctx.beginPath();
  ctx.arc(beamStartX, yStart, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#10B981';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();

  const e1PillY = yStart > 200 ? yStart - 44 : yStart + 18;
  ctx.fillStyle = '#064E3B';
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(beamStartX - 65, e1PillY, 130, 26, 6);
  } else {
    ctx.rect(beamStartX - 65, e1PillY, 130, 26);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#A7F3D0';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`E1: ${data.E1.toFixed(3)} m`, beamStartX, e1PillY + 18);

  // 9. E2 End Marker & Pill
  ctx.beginPath();
  ctx.arc(beamEndX, yEnd, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#38BDF8';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();

  const e2PillY = yEnd > 200 ? yEnd - 44 : yEnd + 18;
  ctx.fillStyle = '#0C4A6E';
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(beamEndX - 65, e2PillY, 130, 26, 6);
  } else {
    ctx.rect(beamEndX - 65, e2PillY, 130, 26);
  }
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#BAE6FD';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`E2: ${data.E2.toFixed(3)} m`, beamEndX, e2PillY + 18);

  // 10. Center Top Metric Pill
  const centerPillW = 540;
  const centerPillH = 34;
  const centerPillX = (width - centerPillW) / 2;
  const centerPillY = 16;
  ctx.fillStyle = '#1E293B';
  ctx.strokeStyle = '#0D9488';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(centerPillX, centerPillY, centerPillW, centerPillH, 17);
  } else {
    ctx.rect(centerPillX, centerPillY, centerPillW, centerPillH);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Slope Tan: ${data.tan.toFixed(6)}   •   Angle: ${data.angleDeg.toFixed(3)}°   •   Direction: ${data.direction}`,
    width / 2,
    centerPillY + 23
  );

  // 11. Bottom Overall Dimension Bar
  const dimY = 448;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(beamStartX, dimY);
  ctx.lineTo(beamEndX, dimY);
  ctx.moveTo(beamStartX, dimY - 6);
  ctx.lineTo(beamStartX, dimY + 6);
  ctx.moveTo(beamEndX, dimY - 6);
  ctx.lineTo(beamEndX, dimY + 6);
  ctx.stroke();

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Total Fixed Axis ${data.axis} Length: ${data.overallDistance.toFixed(3)} m   (${data.pilePoints} Total Pile Points)`,
    width / 2,
    dimY - 7
  );

  return canvas.toDataURL('image/png');
}

/**
 * Downloads current calculation results as a beautifully styled Excel spreadsheet (.xls)
 * formatted as a single-file MHTML multipart archive (RFC 2557).
 *
 * Why MHTML:
 * Standard HTML files with inline SVG or data:image URIs fail in Microsoft Excel and display
 * "The linked image cannot be displayed. The file may have been moved, renamed, or deleted."
 * MHTML embeds the raster PNG image directly as a self-contained MIME part with Content-ID and
 * Content-Location headers, allowing Microsoft Excel to natively render the chart image without
 * broken links, external network requests, or temporary files.
 */
export function downloadStyledExcel(data: TrackerCalculationOutput, customChartDataUrl?: string): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanType = data.trackerType.replace(/\s+/g, '_');

  // Obtain or generate PNG data URL
  let pngDataUrl = customChartDataUrl;
  if (!pngDataUrl && typeof document !== 'undefined') {
    try {
      pngDataUrl = renderTrackerChartToCanvasPng(data);
    } catch (e) {
      console.error('Failed to generate canvas PNG:', e);
    }
  }

  // Extract raw base64 string from data URL
  let rawPngBase64 = '';
  if (pngDataUrl) {
    const commaIndex = pngDataUrl.indexOf(',');
    rawPngBase64 = commaIndex >= 0 ? pngDataUrl.substring(commaIndex + 1) : pngDataUrl;
  }
  if (!rawPngBase64) {
    // 1x1 transparent PNG fallback
    rawPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  const boundary = '----=_NextPart_01_SOLAR_TRACKER_REPORT';
  const chartFileName = 'tracker_profile_chart.png';
  const formattedPngBase64 = chunkBase64(rawPngBase64.replace(/\s+/g, ''));

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${data.trackerType} Calculation</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
                <x:ProtectContent>False</x:ProtectContent>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; margin: 0; padding: 12px; }
        table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Calibri, Arial, sans-serif; }
        .title-banner { background-color: #0A192F; color: #FFFFFF; font-size: 15pt; font-weight: bold; text-align: center; height: 42px; vertical-align: middle; }
        .subtitle-banner { background-color: #1E3A8A; color: #DBEAFE; font-size: 9.5pt; text-align: center; height: 24px; vertical-align: middle; }
        .section-header-teal { background-color: #0D9488; color: #FFFFFF; font-weight: bold; font-size: 11pt; height: 30px; vertical-align: middle; padding-left: 10px; }
        .section-header-blue { background-color: #112E81; color: #FFFFFF; font-weight: bold; font-size: 11pt; height: 30px; vertical-align: middle; padding-left: 10px; }
        .th-main { background-color: #112E81; color: #FFFFFF; font-weight: bold; font-size: 10.5pt; text-align: center; height: 36px; vertical-align: middle; border: 1px solid #071746; }
        .td-point { background-color: #F1F5F9; font-weight: bold; text-align: center; border: 1px solid #CBD5E1; padding: 7px; color: #0F172A; }
        .td-num { text-align: right; border: 1px solid #CBD5E1; padding: 7px 12px; mso-number-format: "0\\.000"; }
        .td-elev { text-align: right; font-weight: bold; border: 1px solid #CBD5E1; padding: 7px 12px; color: #112E81; background-color: #EFF6FF; mso-number-format: "0\\.000"; }
        .td-match-elev { text-align: right; font-weight: bold; border: 1.5px solid #34D399; padding: 7px 12px; color: #065F46; background-color: #D1FAE5; mso-number-format: "0\\.000"; }
        .td-match-status { background-color: #D1FAE5; color: #065F46; font-weight: bold; text-align: center; border: 1.5px solid #34D399; font-size: 9pt; }
        .meta-lbl { background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px; width: 240px; font-size: 10pt; }
        .meta-val { background-color: #FFFFFF; color: #0F172A; border: 1px solid #CBD5E1; padding: 6px 12px; font-weight: 600; font-size: 10pt; }
        .meta-val-accent { background-color: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; padding: 6px 12px; font-weight: bold; font-size: 10pt; }
        .meta-val-tan { background-color: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; padding: 6px 12px; font-weight: bold; font-family: Consolas, monospace; font-size: 10.5pt; }
        .meta-val-angle { background-color: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; padding: 6px 12px; font-weight: bold; font-size: 10.5pt; }
      </style>
    </head>
    <body>
      <table border="1" bordercolor="#CBD5E1" cellspacing="0" cellpadding="4" style="border-collapse: collapse; font-family: 'Segoe UI', Calibri, Arial, sans-serif; width: 100%;">
        <colgroup>
          <col width="100">
          <col width="160">
          <col width="180">
          <col width="180">
          <col width="180">
        </colgroup>
        <!-- Header Banner -->
        <tr>
          <td colspan="5" bgcolor="#0A192F" style="background-color: #0A192F; color: #FFFFFF; font-size: 16pt; font-weight: bold; text-align: center; height: 44px; vertical-align: middle; border: 1px solid #0A192F;">
            SOLAR PILE TRACKER INNOVATION CALCULATOR
          </td>
        </tr>
        <tr>
          <td colspan="5" bgcolor="#1E3A8A" style="background-color: #1E3A8A; color: #DBEAFE; font-size: 9.5pt; text-align: center; height: 26px; vertical-align: middle; border: 1px solid #1E3A8A;">
            Civil Surveying &amp; Engineering Pile Elevation Report • ${dateStr} • Fixed Engineering Distances
          </td>
        </tr>
        <tr>
          <td colspan="5" style="height: 12px; background-color: #FFFFFF; border: none;"></td>
        </tr>

        <!-- Section 1: Specifications -->
        <tr>
          <td colspan="5" bgcolor="#0D9488" style="background-color: #0D9488; color: #FFFFFF; font-weight: bold; font-size: 11pt; height: 30px; vertical-align: middle; padding-left: 10px; border: 1px solid #0F766E;">
            1. TRACKER SPECIFICATIONS &amp; SLOPE METRICS
          </td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px; width: 240px;">Tracker Type</td>
          <td bgcolor="#FFFFFF" colspan="4" style="background-color: #FFFFFF; color: #0F172A; border: 1px solid #CBD5E1; padding: 6px 12px; font-weight: bold;">${data.trackerType}</td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px;">Configuration Name</td>
          <td bgcolor="#FFFFFF" colspan="4" style="background-color: #FFFFFF; color: #0F172A; border: 1px solid #CBD5E1; padding: 6px 12px; font-weight: 600;">${data.configurationName} (${data.pilePoints} Pile Points)</td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px;">E1 Elevation (Start Point)</td>
          <td bgcolor="#FFFFFF" colspan="4" style="background-color: #FFFFFF; color: #0F172A; border: 1px solid #CBD5E1; padding: 6px 12px; font-weight: bold; mso-number-format: '0\\.000';">${data.E1.toFixed(3)} m</td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px;">E2 Elevation (End Point)</td>
          <td bgcolor="#FFFFFF" colspan="4" style="background-color: #FFFFFF; color: #0F172A; border: 1px solid #CBD5E1; padding: 6px 12px; font-weight: bold; mso-number-format: '0\\.000';">${data.E2.toFixed(3)} m</td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px;">Elevation Difference |E2 - E1|</td>
          <td bgcolor="#EFF6FF" colspan="4" style="background-color: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; padding: 6px 12px; font-weight: bold; mso-number-format: '0\\.000';">${data.elevationDifference.toFixed(3)} m</td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px;">Direction</td>
          <td bgcolor="#ECFDF5" colspan="4" style="background-color: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; padding: 6px 12px; font-weight: bold;">${data.direction}</td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px;">Overall Distance (${data.axis}-Axis)</td>
          <td bgcolor="#FFFFFF" colspan="4" style="background-color: #FFFFFF; color: #0F172A; border: 1px solid #CBD5E1; padding: 6px 12px; font-weight: bold; mso-number-format: '0\\.000';">${data.overallDistance.toFixed(3)} m (Fixed Axis ${data.axis})</td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px;">Tan Value (Slope Gradient)</td>
          <td bgcolor="#EFF6FF" colspan="4" style="background-color: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; padding: 6px 12px; font-weight: bold; font-family: Consolas, monospace; font-size: 11pt;">${data.tan.toFixed(6)}</td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px;">Tan⁻¹ Tracker Angle</td>
          <td bgcolor="#FEF3C7" colspan="4" style="background-color: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; padding: 6px 12px; font-weight: bold; font-size: 11pt;">${data.angleDeg.toFixed(3)}°</td>
        </tr>
        <tr>
          <td bgcolor="#F8FAFC" style="background-color: #F8FAFC; font-weight: bold; color: #1E293B; border: 1px solid #CBD5E1; padding: 6px 12px;">Intermediate Piles Calculated</td>
          <td bgcolor="#FFFFFF" colspan="4" style="background-color: #FFFFFF; color: #0F172A; border: 1px solid #CBD5E1; padding: 6px 12px; font-weight: 600;">${data.numberOfValues} piles (${data.pilePoints} total including E1/E2)</td>
        </tr>
        <tr>
          <td colspan="5" style="height: 14px; background-color: #FFFFFF; border: none;"></td>
        </tr>

        <!-- Section 2: Pile Elevations Table -->
        <tr>
          <td colspan="5" bgcolor="#112E81" style="background-color: #112E81; color: #FFFFFF; font-weight: bold; font-size: 11.5pt; height: 32px; vertical-align: middle; padding-left: 10px; border: 1px solid #071746;">
            2. PILE ELEVATIONS &amp; DISTANCES CALCULATION TABLE
          </td>
        </tr>
        <tr style="height: 36px;">
          <th bgcolor="#112E81" style="background-color: #112E81; color: #FFFFFF; font-weight: bold; font-size: 10.5pt; text-align: center; vertical-align: middle; border: 1px solid #071746; width: 100px;">
            Point
          </th>
          <th bgcolor="#112E81" style="background-color: #112E81; color: #FFFFFF; font-weight: bold; font-size: 10.5pt; text-align: center; vertical-align: middle; border: 1px solid #071746; width: 160px;">
            Distance (${data.axis}) [m]
          </th>
          <th bgcolor="#112E81" style="background-color: #112E81; color: #FFFFFF; font-weight: bold; font-size: 10.5pt; text-align: center; vertical-align: middle; border: 1px solid #071746; width: 180px;">
            Result (Tan × Dist) [m]
          </th>
          <th bgcolor="#0C215E" style="background-color: #0C215E; color: #FFFFFF; font-weight: bold; font-size: 10.5pt; text-align: center; vertical-align: middle; border: 1px solid #071746; width: 180px;">
            Final Elevation [m]
          </th>
          <th bgcolor="#112E81" style="background-color: #112E81; color: #FFFFFF; font-weight: bold; font-size: 10.5pt; text-align: center; vertical-align: middle; border: 1px solid #071746; width: 180px;">
            Verification Status
          </th>
        </tr>

        ${data.results
          .map((item, index) => {
            const isLast = index === data.results.length - 1;
            const rowBg = isLast ? '#D1FAE5' : index % 2 === 1 ? '#F8FAFC' : '#FFFFFF';
            const borderStyle = isLast ? '1.5px solid #34D399' : '1px solid #CBD5E1';

            return `
            <tr bgcolor="${rowBg}" style="height: 30px; background-color: ${rowBg};">
              <td bgcolor="${isLast ? '#A7F3D0' : '#F1F5F9'}" style="background-color: ${isLast ? '#A7F3D0' : '#F1F5F9'}; font-weight: bold; text-align: center; border: ${borderStyle}; color: #0F172A; font-size: 10pt;">
                ${item.point}
              </td>
              <td style="background-color: ${rowBg}; text-align: right; border: ${borderStyle}; font-family: Consolas, monospace; font-weight: 500; font-size: 10pt; padding-right: 12px; mso-number-format: '0\\.000';">
                ${item.distance.toFixed(3)}
              </td>
              <td style="background-color: ${rowBg}; text-align: right; border: ${borderStyle}; font-family: Consolas, monospace; font-size: 10pt; padding-right: 12px; color: #475569; mso-number-format: '0\\.000';">
                ${item.result.toFixed(3)}
              </td>
              <td bgcolor="${isLast ? '#D1FAE5' : '#EFF6FF'}" style="background-color: ${isLast ? '#D1FAE5' : '#EFF6FF'}; text-align: right; font-weight: bold; border: ${borderStyle}; color: ${isLast ? '#065F46' : '#112E81'}; font-family: Consolas, monospace; font-size: 10.5pt; padding-right: 12px; mso-number-format: '0\\.000';">
                ${item.elevation.toFixed(3)}
              </td>
              <td bgcolor="${isLast ? '#D1FAE5' : rowBg}" style="background-color: ${isLast ? '#D1FAE5' : rowBg}; text-align: center; font-weight: ${isLast ? 'bold' : 'normal'}; color: ${isLast ? '#065F46' : '#64748B'}; border: ${borderStyle}; font-size: 9.5pt;">
                ${isLast ? '✓ MATCHES E2 ENDPOINT' : 'Intermediate Pile'}
              </td>
            </tr>
          `;
          })
          .join('')}

        <tr>
          <td colspan="5" style="height: 14px; background-color: #FFFFFF; border: none;"></td>
        </tr>

        <!-- Section 3: Longitudinal Profile Chart & Inclination Diagram -->
        <tr>
          <td colspan="5" bgcolor="#112E81" style="background-color: #112E81; color: #FFFFFF; font-weight: bold; font-size: 11.5pt; height: 32px; vertical-align: middle; padding-left: 10px; border: 1px solid #071746;">
            3. LONGITUDINAL PROFILE CHART &amp; INCLINATION DIAGRAM
          </td>
        </tr>
        <tr>
          <td colspan="5" align="center" bgcolor="#0A192F" style="background-color: #0A192F; text-align: center; padding: 18px 12px; border: 1px solid #CBD5E1;">
            <img src="cid:${chartFileName}" alt="Tracker Longitudinal Profile Chart" width="650" height="220" style="display: block; margin: 0 auto; max-width: 100%; height: auto; border: 1px solid #1E3A8A; border-radius: 8px;" />
            <div style="font-size: 8.5pt; color: #94A3B8; margin-top: 8px; font-family: 'Segoe UI', Calibri, sans-serif;">
              Longitudinal Tracker Beam Profile &bull; Slope Tan = ${data.tan.toFixed(6)} &bull; Physical Inclination Angle = ${data.angleDeg.toFixed(3)}&deg; &bull; Total Length = ${data.overallDistance.toFixed(3)}m (${data.axis}-Axis)
            </div>
          </td>
        </tr>

        <tr>
          <td colspan="5" style="height: 12px; background-color: #FFFFFF; border: none;"></td>
        </tr>

        <!-- Summary & Engineering Sign-Off -->
        <tr>
          <td colspan="5" bgcolor="#F1F5F9" style="background-color: #F1F5F9; border: 1px solid #CBD5E1; padding: 10px; font-size: 9pt; color: #334155;">
            <b>Mathematical Verification:</b> E1 (${data.E1.toFixed(3)}m) ${data.direction === 'UP (+)' ? '+' : data.direction === 'DOWN (-)' ? '-' : '±'} ${data.results[data.results.length - 1]?.result.toFixed(3)}m = <b>${data.results[data.results.length - 1]?.elevation.toFixed(3)}m</b> (Matches E2: ${data.E2.toFixed(3)}m) • Tan = ${data.tan.toFixed(6)} • Angle = ${data.angleDeg.toFixed(3)}°<br>
            <span style="color: #64748B; font-style: italic;">* Generated by Solar Pile Tracker Innovation Calculator • All distances fixed per engineering design standard • 64-bit precision</span>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim();

  // Package as self-contained MHTML archive (RFC 2557) so Excel embeds the image directly
  const mhtml = [
    'MIME-Version: 1.0',
    'X-Document-Type: Workbook',
    `Content-Type: multipart/related; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    `Content-Location: ${chartFileName}`,
    `Content-ID: <${chartFileName}>`,
    'Content-Type: image/png',
    'Content-Transfer-Encoding: base64',
    '',
    formattedPngBase64,
    '',
    `--${boundary}`,
    'Content-Location: solar_tracker_report.htm',
    'Content-Type: text/html; charset="utf-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html,
    '',
    `--${boundary}--`
  ].join('\r\n');

  const blob = new Blob([mhtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `solar_pile_tracker_innovation_${cleanType}_${data.pilePoints}Piles_${dateStr}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads current calculation results as a properly formatted CSV.
 */
export function downloadTrackerCSV(data: TrackerCalculationOutput): void {
  const rows: (string | number)[][] = [];

  rows.push(["================================================================================="]);
  rows.push(["SOLAR PILE TRACKER INNOVATION CALCULATOR - CALCULATION REPORT"]);
  rows.push(["================================================================================="]);
  rows.push(["Date Generated", new Date().toISOString().slice(0, 10)]);
  rows.push(["Tracker Type", data.trackerType]);
  rows.push(["Configuration", data.configurationName]);
  rows.push(["E1 Elevation (m)", data.E1.toFixed(3)]);
  rows.push(["E2 Elevation (m)", data.E2.toFixed(3)]);
  rows.push(["Elevation Difference (m)", data.elevationDifference.toFixed(3)]);
  rows.push(["Direction", data.direction]);
  rows.push([`Overall ${data.axis} Distance (m)`, data.overallDistance.toFixed(3)]);
  rows.push(["Tan (Slope Gradient)", data.tan.toFixed(6)]);
  rows.push(["Tan⁻¹ Angle (deg)", `${data.angleDeg.toFixed(3)}°`]);
  rows.push(["Number of Pile Points", data.pilePoints]);
  rows.push(["Number of Calculated Values", data.numberOfValues]);
  rows.push(["================================================================================="]);
  rows.push([]);

  rows.push([
    "Point",
    `Distance (${data.axis}) [m]`,
    "Result (Tan × Dist) [m]",
    "Final Elevation [m]",
    "Status"
  ]);

  data.results.forEach((item, index) => {
    const isLast = index === data.results.length - 1;
    rows.push([
      item.point,
      item.distance.toFixed(3),
      item.result.toFixed(3),
      item.elevation.toFixed(3),
      isLast ? "MATCHES E2" : "Intermediate Pile"
    ]);
  });

  rows.push([]);
  rows.push(["* Precision: 64-bit IEEE 754 floating point accuracy • Formatted to 3 decimal places (6 for Tan)"]);

  const csvContent = rows
    .map(row =>
      row.map(value => `"${value}"`).join(",")
    )
    .join("\r\n");

  const blob = new Blob(
    [csvContent],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanType = data.trackerType.replace(/\s+/g, '_');
  link.href = url;
  link.download = `solar_pile_tracker_innovation_${cleanType}_${data.pilePoints}Piles_${dateStr}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Returns available configuration keys for a selected tracker type.
 */
export function getConfigurationsForTracker(trackerType: TrackerType): TrackerConfig[] {
  return Object.values(trackerConfigurations).filter(cfg => cfg.trackerType === trackerType);
}
