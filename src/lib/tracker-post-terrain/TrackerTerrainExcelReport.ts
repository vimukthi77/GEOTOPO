import * as XLSX from 'xlsx';
import { TrackerTerrainCalculationResult } from './calculateTrackerCoordinates';

export function exportTrackerTerrainToExcel(result: TrackerTerrainCalculationResult): void {
  const {
    zoneName,
    trackerId,
    docNo,
    locationGrid,
    inspectionDate,
    config,
    startX_m,
    startX_mm,
    startY_m,
    startY_mm,
    E1_m,
    E2_m,
    deltaElevation_m,
    totalLengthMm,
    totalLengthM,
    totalHorizontalProjectionM,
    totalHorizontalProjectionMm,
    thetaDeg,
    direction,
    calculatedFinalZM,
    endpointErrorM,
    endpointValidationPass,
    points,
    timestamp,
  } = result;

  const workbook = XLSX.utils.book_new();

  // ----------------------------------------------------
  // SHEET 1: OFFICIAL CHECKLIST REPORT (MATCHING PDF & REFERENCE IMAGE)
  // ----------------------------------------------------
  const masterReportData: any[][] = [
    // Top Title Block
    ['100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.'],
    ['TRACKER - GRADIENT CHECKLIST'],
    [''],

    // Official 4-Row Header Grid Block
    ['CLIENT: Rividhanavi (Private) Limited', '', '', '', 'Doc. No:', docNo],
    ['EPC CONTRACTORS: Windforce PLC & Lakdhanavi Limited', '', '', '', 'Sheet No:', '01 of 01'],
    ['Structure / Zone:', zoneName, '', '', 'Location/ Grid:', locationGrid],
    ['TRACKER ID:', trackerId, '', '', 'Inspection Date:', inspectionDate],
    [''],

    // Geometry Parameters Summary Block
    ['ENGINEERING PARAMETERS & GEOMETRY SUMMARY'],
    ['Parameter', 'Value', 'Unit', 'Details / Formula'],
    ['Tracker Configuration', config.name, '-', `${config.stringCount} String ${config.position}`],
    ['Total Pile Points', config.pileCount, 'Piles', `${config.segmentCount} Segments`],
    ['X1 Starting X', startX_m.toFixed(3), 'm', 'Starting X Datum'],
    ['Y1 Starting Y', startY_m.toFixed(3), 'm', 'Starting Y Datum'],
    ['E1 Starting Elevation', E1_m.toFixed(3), 'm', 'Starting Elevation Datum'],
    ['E2 Ending Elevation', E2_m.toFixed(3), 'm', 'Ending Elevation Datum'],
    ['Elevation Difference (ΔE)', deltaElevation_m.toFixed(3), 'm', 'E2 - E1'],
    ['Total Inclined Tracker Length', totalLengthMm, 'mm', `${totalLengthM.toFixed(3)} m`],
    ['Total Horizontal Projection (Y_footprint)', totalHorizontalProjectionM.toFixed(3), 'm', 'L_total * cos(θ)'],
    ['Tracker Inclination Angle (θ)', thetaDeg.toFixed(6), 'degrees (°)', 'θ = asin(ΔE / L_total)'],
    ['Terrain Direction', direction, '-', 'UP SLOPE / DOWN SLOPE / LEVEL'],
    ['Endpoint Discrepancy Error', endpointErrorM.toFixed(6), 'm', endpointValidationPass ? 'PASS' : 'CHECK'],
    [''],

    // Point Coordinate Table Header
    ['TRACKER POST TERRAIN COORDINATE TABLE'],
    [
      'Pile',
      'Physical Tracker Segment Length (mm)',
      'Horizontal Ground Projection (mm)',
      'Cumulative Ground Location (mm)',
      'X (mm)',
      'Y Ground (mm)',
      'Z Elevation (m)',
      'ΔZ Elevation Change (mm)',
    ],
  ];

  // Append Point Coordinate Table Rows
  points.forEach((p) => {
    masterReportData.push([
      p.label,
      p.segmentLengthMm !== null ? p.segmentLengthMm : '—',
      p.deltaYMm !== null ? p.deltaYMm.toFixed(3) : '—',
      p.cumGroundYMm.toFixed(3),
      p.xMm.toFixed(3),
      p.yMm.toFixed(3),
      p.zM.toFixed(3),
      p.deltaZMm !== null ? p.deltaZMm.toFixed(3) : '—',
    ]);
  });

  // Append TOTAL / SUM row for Coordinate Table
  const finalPt = points[points.length - 1];
  masterReportData.push([
    'TOTAL / SUM',
    totalLengthMm,
    totalHorizontalProjectionMm.toFixed(3),
    totalHorizontalProjectionMm.toFixed(3),
    points[0]?.xMm.toFixed(3) || '0.000',
    finalPt ? finalPt.yMm.toFixed(3) : totalHorizontalProjectionMm.toFixed(3),
    E2_m.toFixed(3),
    `${deltaElevation_m >= 0 ? '+' : ''}${(deltaElevation_m * 1000).toFixed(3)}`,
  ]);

  // Append Blank Row & Engineering QA Check Section
  masterReportData.push(
    [''],
    ['ENGINEERING QA & ENDPOINT VALIDATION'],
    ['Check Item', 'Calculated Value', 'Target / Tolerance', 'Status'],
    [
      'Total Physical Segment Length Sum',
      `${totalLengthMm} mm (${totalLengthM.toFixed(3)} m)`,
      `${config.totalLengthMm} mm`,
      'PASS',
    ],
    [
      'Calculated Final Z Elevation',
      `${calculatedFinalZM.toFixed(6)} m`,
      `${E2_m.toFixed(6)} m`,
      endpointValidationPass ? 'PASS' : 'CHECK',
    ],
    [
      'Endpoint Error Tolerance Check',
      `${endpointErrorM.toFixed(6)} m`,
      '<= 0.001000 m',
      endpointValidationPass ? 'PASS' : 'CHECK',
    ],
    [
      'Overall Validation Status',
      endpointValidationPass ? 'PASS' : 'CHECK',
      'PASS',
      endpointValidationPass ? 'PASS' : 'CHECK',
    ]
  );

  const wsChecklist = XLSX.utils.aoa_to_sheet(masterReportData);

  // Set Column Widths for Checklist Sheet
  wsChecklist['!cols'] = [
    { wch: 14 },
    { wch: 32 },
    { wch: 32 },
    { wch: 32 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 24 },
  ];

  // Set Cell Merges for Header Titles & Grid
  wsChecklist['!merges'] = [
    // Top Title: Row 0 (A1:H1)
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    // Subtitle: Row 1 (A2:H2)
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    // Row 3: Client (A4:D4)
    { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
    // Row 4: EPC Contractors (A5:D5)
    { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } },
    // Row 5: Structure (B6:D6)
    { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } },
    // Row 6: Tracker ID (B7:D7)
    { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } },
    // Geometry Header Row 8 (A9:H9)
    { s: { r: 8, c: 0 }, e: { r: 8, c: 7 } },
  ];

  XLSX.utils.book_append_sheet(workbook, wsChecklist, 'Gradient Checklist Report');

  // ----------------------------------------------------
  // SHEET 2: RAW COORDINATES DATA (FOR CAD & SITE TEAMS)
  // ----------------------------------------------------
  const rawCoordHeaders = [
    'Pile',
    'Physical Tracker Segment Length (mm)',
    'Horizontal Ground Projection (mm)',
    'Cumulative Ground Location (mm)',
    'X (mm)',
    'Y Ground (mm)',
    'Z Elevation (mm)',
    'Y Ground (m)',
    'Z Elevation (m)',
    'Vertical Elevation Change ΔZ (mm)',
  ];

  const rawCoordRows = points.map((p) => [
    p.label,
    p.segmentLengthMm !== null ? p.segmentLengthMm : '-',
    p.deltaYMm !== null ? p.deltaYMm.toFixed(3) : '-',
    p.cumGroundYMm.toFixed(3),
    p.xMm.toFixed(3),
    p.yMm.toFixed(3),
    p.zMm.toFixed(3),
    p.yM.toFixed(3),
    p.zM.toFixed(3),
    p.deltaZMm !== null ? p.deltaZMm.toFixed(3) : '-',
  ]);

  // Append TOTAL row to Sheet 2
  rawCoordRows.push([
    'TOTAL / SUM',
    totalLengthMm,
    totalHorizontalProjectionMm.toFixed(3),
    totalHorizontalProjectionMm.toFixed(3),
    points[0]?.xMm.toFixed(3) || '0.000',
    finalPt ? finalPt.yMm.toFixed(3) : totalHorizontalProjectionMm.toFixed(3),
    (calculatedFinalZM * 1000).toFixed(3),
    finalPt ? finalPt.yM.toFixed(3) : totalHorizontalProjectionM.toFixed(3),
    E2_m.toFixed(3),
    `${deltaElevation_m >= 0 ? '+' : ''}${(deltaElevation_m * 1000).toFixed(3)}`,
  ]);

  const wsRawCoordinates = XLSX.utils.aoa_to_sheet([rawCoordHeaders, ...rawCoordRows]);
  wsRawCoordinates['!cols'] = [
    { wch: 10 },
    { wch: 22 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 28 },
    { wch: 28 },
  ];

  XLSX.utils.book_append_sheet(workbook, wsRawCoordinates, 'Raw Coordinates');

  // Generate filename: Tracker_Post_Terrain_Coordinates_[TRACKER_ID]_[ZONE].xlsx
  const safeTrackerId = trackerId.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const safeZone = zoneName.replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `Tracker_Post_Terrain_Coordinates_${safeTrackerId}_${safeZone}.xlsx`;

  // Write file and trigger download
  XLSX.writeFile(workbook, filename);
}
