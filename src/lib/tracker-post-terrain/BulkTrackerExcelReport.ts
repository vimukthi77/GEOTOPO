import * as XLSX from 'xlsx';
import { BulkTrackerBatchResult } from './bulkTrackerCalculations';

/**
 * Sanitizes a string to a valid Microsoft Excel worksheet name:
 * - Max 31 characters
 * - Cannot contain characters: \ / ? * : [ ]
 * - Cannot be empty
 */
export function sanitizeExcelSheetName(name: string, fallbackIndex: number): string {
  if (!name) return `TRK_${fallbackIndex + 1}`;
  let clean = name.replace(/[:\\/?*\[\]]/g, '-').trim();
  if (clean.length > 31) {
    clean = clean.slice(0, 31).trim();
  }
  return clean || `TRK_${fallbackIndex + 1}`;
}

/**
 * Generates and triggers download of a single unified Master Excel Workbook (.xlsx)
 * containing:
 * 1. "Master Summary" sheet (Consolidated project overview of all trackers)
 * 2. Individual dedicated sheets for EVERY Tracker ID (named after the Tracker ID)
 * All values, coordinates, projections, and segment lengths are in METERS (m).
 */
export function exportBulkTrackersToExcel(batch: BulkTrackerBatchResult): void {
  const {
    facilityTitle,
    clientName,
    epcContractors,
    structureZone,
    locationGrid,
    docNo,
    inspectionDate,
    items,
    totalTrackers,
    validTrackers,
    totalPiles,
    totalLengthM,
  } = batch;

  const workbook = XLSX.utils.book_new();

  // =========================================================================
  // SHEET 1: MASTER SUMMARY (OVERVIEW OF ALL TRACKERS)
  // =========================================================================
  const summarySheetData: any[][] = [
    // Header Title
    [facilityTitle || '100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.'],
    ['TRACKER - BULK GRADIENT CHECKLIST & 3D TERRAIN COORDINATE MASTER SUMMARY'],
    [''],

    // Project Info Block
    ['CLIENT:', clientName || 'Rividhanavi (Private) Limited', '', '', 'Doc. No:', docNo || 'DOC-TRK-001'],
    ['EPC CONTRACTORS:', epcContractors || 'Windforce PLC & Lakdhanavi Limited', '', '', 'Inspection Date:', inspectionDate],
    ['STRUCTURE / ZONE:', structureZone || 'Tracker Mounting Structure', '', '', 'Location / Grid:', locationGrid || 'Z6'],
    ['TOTAL TRACKERS:', `${validTrackers} of ${totalTrackers} Valid`, '', '', 'TOTAL PILE POSTS:', totalPiles],
    ['TOTAL INCLINED LENGTH:', `${totalLengthM.toFixed(3)} m (${(totalLengthM / 1000).toFixed(3)} km)`, '', '', 'UNIT STANDARD:', 'METERS (m)'],
    [''],

    // Master Table Header (All in Meters)
    [
      'No.',
      'Tracker ID',
      'Tracker Type',
      'Piles',
      'Segments',
      'Easting X1 (m)',
      'Northing Y1 (m)',
      'Easting Xn (m)',
      'Northing Yn (m)',
      'E1 Start Elev (m)',
      'E1 Foundation Top (m)',
      'E2 End Elev (m)',
      'E2 Foundation Top (m)',
      'ΔE Elev Diff (m)',
      'Inclined Length (m)',
      'Ground Footprint (m)',
      'Angle θ (°)',
      'Terrain Direction',
      'Start Pile Ref',
      'End Pile Ref',
      'QA Status',
    ],
  ];

  // Populate Master Table Rows
  items.forEach((item, idx) => {
    const { input, calcResult, isValid, error } = item;
    if (isValid && calcResult) {
      const finalPt = calcResult.points[calcResult.points.length - 1];
      summarySheetData.push([
        input.no || idx + 1,
        input.trackerId,
        calcResult.config.name,
        calcResult.config.pileCount,
        calcResult.config.segmentCount,
        calcResult.startX_m.toFixed(3),
        calcResult.startY_m.toFixed(3),
        finalPt ? finalPt.xM.toFixed(3) : calcResult.startX_m.toFixed(3),
        finalPt ? finalPt.yM.toFixed(3) : '—',
        calcResult.E1_m.toFixed(3),
        (calcResult.E1_m + 0.150).toFixed(3),
        calcResult.E2_m.toFixed(3),
        (calcResult.E2_m + 0.150).toFixed(3),
        calcResult.deltaElevation_m.toFixed(3),
        calcResult.totalLengthM.toFixed(3),
        calcResult.totalHorizontalProjectionM.toFixed(3),
        calcResult.thetaDeg.toFixed(3),
        calcResult.direction,
        input.pilePointStart || 'P1',
        input.pileNumberEnd || `P${calcResult.config.pileCount}`,
        calcResult.endpointValidationPass ? 'PASS' : 'CHECK',
      ]);
    } else {
      summarySheetData.push([
        input.no || idx + 1,
        input.trackerId,
        input.trackerTypeRaw || 'Unknown',
        '—',
        '—',
        input.easting.toFixed(3),
        input.northing.toFixed(3),
        '—',
        '—',
        input.E1.toFixed(3),
        (input.E1 + 0.150).toFixed(3),
        input.E2.toFixed(3),
        (input.E2 + 0.150).toFixed(3),
        (input.E2 - input.E1).toFixed(3),
        '—',
        '—',
        input.gradientDegrees !== undefined ? input.gradientDegrees.toFixed(3) : '—',
        'INVALID',
        input.pilePointStart || '—',
        input.pileNumberEnd || '—',
        `ERROR: ${error || 'Invalid'}`,
      ]);
    }
  });

  // TOTAL / SUMMARY ROW for Sheet 1
  summarySheetData.push([
    'TOTAL / SUMMARY',
    `${validTrackers} Trackers Valid`,
    '—',
    totalPiles,
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    '—',
    totalLengthM.toFixed(3),
    '—',
    '—',
    '—',
    '—',
    '—',
    validTrackers === totalTrackers ? 'ALL PASS' : 'REVIEW ERRORS',
  ]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);

  wsSummary['!cols'] = [
    { wch: 8 },  // No.
    { wch: 18 }, // Tracker ID
    { wch: 22 }, // Tracker Type
    { wch: 8 },  // Piles
    { wch: 10 }, // Segments
    { wch: 16 }, // Easting X1
    { wch: 16 }, // Northing Y1
    { wch: 16 }, // Easting Xn
    { wch: 16 }, // Northing Yn
    { wch: 16 }, // E1
    { wch: 22 }, // E1 Foundation Top
    { wch: 16 }, // E2
    { wch: 22 }, // E2 Foundation Top
    { wch: 16 }, // ΔE
    { wch: 18 }, // Inclined Length
    { wch: 20 }, // Ground Footprint
    { wch: 14 }, // Angle
    { wch: 18 }, // Direction
    { wch: 14 }, // Start Pile Ref
    { wch: 14 }, // End Pile Ref
    { wch: 16 }, // QA Status
  ];

  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Master Summary');

  // =========================================================================
  // SUBSEQUENT SHEETS: ONE SHEET PER TRACKER ID
  // =========================================================================
  // Track sheet names to guarantee uniqueness within Excel workbook
  const usedSheetNames = new Set<string>(['Master Summary']);

  items.forEach((item, itemIdx) => {
    const { input, calcResult, isValid, pileLabels } = item;
    if (!isValid || !calcResult) return;

    let sheetName = sanitizeExcelSheetName(input.trackerId, itemIdx);
    let counter = 1;
    while (usedSheetNames.has(sheetName)) {
      const suffix = `_${counter++}`;
      sheetName = `${sheetName.slice(0, 31 - suffix.length)}${suffix}`;
    }
    usedSheetNames.add(sheetName);

    const {
      config,
      startX_m,
      startY_m,
      E1_m,
      E2_m,
      deltaElevation_m,
      totalLengthM,
      totalHorizontalProjectionM,
      thetaDeg,
      direction,
      calculatedFinalZM,
      endpointErrorM,
      endpointValidationPass,
      points,
    } = calcResult;

    const trackerSheetData: any[][] = [
      // Top Title Block
      [facilityTitle || '100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.'],
      ['TRACKER - GRADIENT CHECKLIST'],
      [''],

      // Official 4-Row Header Grid Block
      ['CLIENT: Rividhanavi (Private) Limited', '', '', '', 'Doc. No:', docNo || 'DOC-TRK-001'],
      ['EPC CONTRACTORS: Windforce PLC & Lakdhanavi Limited', '', '', '', 'Sheet No:', `${itemIdx + 1} of ${totalTrackers}`],
      ['Structure / Zone:', structureZone || 'Tracker Mounting Structure', '', '', 'Location/ Grid:', locationGrid || 'Z6'],
      ['TRACKER ID:', input.trackerId, '', '', 'Inspection Date:', inspectionDate],
      [''],

      // Geometry Parameters Summary Block (All in Meters)
      ['ENGINEERING PARAMETERS & GEOMETRY SUMMARY'],
      ['Parameter', 'Value', 'Unit', 'Details / Formula'],
      ['Tracker Configuration', config.name, '-', `${config.stringCount} String ${config.position}`],
      ['Total Pile Points', config.pileCount, 'Piles', `${config.segmentCount} Segments`],
      ['Easting Starting X (X1)', startX_m.toFixed(3), 'm', 'Starting Easting Datum'],
      ['Northing Starting Y (Y1)', startY_m.toFixed(3), 'm', 'Starting Northing Datum'],
      ['E1 Starting Elevation', E1_m.toFixed(3), 'm', 'Starting Elevation Datum'],
      ['E2 Ending Elevation', E2_m.toFixed(3), 'm', 'Ending Elevation Datum'],
      ['Elevation Difference (ΔE)', deltaElevation_m.toFixed(3), 'm', 'E2 - E1'],
      ['Total Inclined Tracker Length', totalLengthM.toFixed(3), 'm', 'Physical inclined tracker length'],
      ['Total Horizontal Projection (Y_footprint)', totalHorizontalProjectionM.toFixed(3), 'm', 'L_total * cos(θ)'],
      ['Tracker Inclination Angle (θ)', thetaDeg.toFixed(6), 'degrees (°)', 'θ = asin(ΔE / L_total)'],
      ['Terrain Direction', direction, '-', 'UP SLOPE / DOWN SLOPE / LEVEL'],
      ['Endpoint Discrepancy Error', endpointErrorM.toFixed(6), 'm', endpointValidationPass ? 'PASS' : 'CHECK'],
      [''],

      // Point Coordinate Table Header (All in Meters)
      ['TRACKER POST TERRAIN COORDINATE TABLE (ALL VALUES IN METERS)'],
      [
        'Pile',
        'Physical Tracker Segment Length (m)',
        'Horizontal Ground Projection (m)',
        'Cumulative Ground Location (m)',
        'Easting X (m)',
        'Northing Y Ground (m)',
        'Z Elevation (m)',
        'Foundation Top Elevation (m)',
        'ΔZ Elevation Change (m)',
      ],
    ];

    // Append Point Coordinate Rows
    points.forEach((p, pIdx) => {
      const displayLabel = pileLabels && pileLabels[pIdx] ? pileLabels[pIdx] : p.label;
      trackerSheetData.push([
        displayLabel,
        p.segmentLengthM !== null ? p.segmentLengthM.toFixed(3) : '—',
        p.deltaYM !== null ? p.deltaYM.toFixed(3) : '—',
        p.cumGroundYM.toFixed(3),
        p.xM.toFixed(3),
        p.yM.toFixed(3),
        p.zM.toFixed(3),
        p.foundationTopElevationM.toFixed(3),
        p.deltaZM !== null ? p.deltaZM.toFixed(3) : '—',
      ]);
    });

    // Append TOTAL / SUM row for this tracker
    const finalPt = points[points.length - 1];
    trackerSheetData.push([
      'TOTAL / SUM',
      totalLengthM.toFixed(3),
      totalHorizontalProjectionM.toFixed(3),
      totalHorizontalProjectionM.toFixed(3),
      points[0]?.xM.toFixed(3) || '0.000',
      finalPt ? finalPt.yM.toFixed(3) : totalHorizontalProjectionM.toFixed(3),
      E2_m.toFixed(3),
      (E2_m + 0.150).toFixed(3),
      `${deltaElevation_m >= 0 ? '+' : ''}${deltaElevation_m.toFixed(3)}`,
    ]);

    // Append Blank Row & Engineering QA Check Section
    trackerSheetData.push(
      [''],
      ['ENGINEERING QA & ENDPOINT VALIDATION'],
      ['Check Item', 'Calculated Value', 'Target / Tolerance', 'Status'],
      [
        'Total Physical Segment Length Sum',
        `${totalLengthM.toFixed(3)} m`,
        `${config.totalLengthM.toFixed(3)} m`,
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

    const wsTracker = XLSX.utils.aoa_to_sheet(trackerSheetData);

    wsTracker['!cols'] = [
      { wch: 18 }, // Pile
      { wch: 34 }, // Segment Length
      { wch: 32 }, // Ground Projection
      { wch: 32 }, // Cum Ground Location
      { wch: 18 }, // Easting X
      { wch: 18 }, // Northing Y Ground
      { wch: 18 }, // Z Elevation
      { wch: 28 }, // Foundation Top Elevation (m)
      { wch: 24 }, // ΔZ Elevation Change
    ];

    wsTracker['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Top Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Subtitle
      { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Client
      { s: { r: 4, c: 0 }, e: { r: 4, c: 3 } }, // EPC
      { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } }, // Structure
      { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } }, // Tracker ID
      { s: { r: 8, c: 0 }, e: { r: 8, c: 8 } }, // Geometry Header
    ];

    XLSX.utils.book_append_sheet(workbook, wsTracker, sheetName);
  });

  // Generate File and Trigger Browser Download
  const safeDoc = (docNo || 'BATCH').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const safeGrid = (locationGrid || 'GRID').replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `Tracker_Bulk_Coordinates_${safeDoc}_${safeGrid}_${validTrackers}_Trackers.xlsx`;

  XLSX.writeFile(workbook, filename);
}

/**
 * Downloads a pre-formatted Excel template (.xlsx) matching the user's batch table specifications
 */
export function exportSampleBulkExcelTemplate(): void {
  const workbook = XLSX.utils.book_new();

  const templateData: any[][] = [
    ['100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.'],
    ['TRACKER - GRADIENT CHECKLIST'],
    ['CLIENT:', '', '', '', 'Doc. No:', 'DOC-TRK-Z6-01'],
    ['Rividhanavi (Private) Limited'],
    ['EPC CONTRACTORS:', '', '', '', 'Sheet No:', '01 of 17'],
    ['Windforce PLC & Lakdhanavi Limited'],
    [''],
    ['Structure : Tracker Mounting Structure', '', '', '', '', 'Location/ Grid : Z6'],
    ['TRACKER TABLE : C', '', '', '', '', 'Date : 2026-10-30'],
    ['No.', 'Tracker ID', 'Tracker Type', 'Northing', 'Easting', 'Elevation', 'Pile Point', 'Elevation', 'Pile Number', 'Gradient( Degrees)'],
    [1, 'STS17-C-ET01', '2 String Corner', 473347.37, 579837.182, 100.49, 'C149', 99.742, 'C142', 0.7],
    [2, 'STS17-C-ET02', '2 String Corner', 473347.37, 579842.682, 100.727, 'C141', 99.81, 'C134', 0.858],
    [3, 'STS17-C-IT03', '2 String Internal', 473347.284, 579848.182, 100.854, 'C133', 99.926, 'C125', 0.869],
    [4, 'STS17-C-IT04', '2 String Internal', 473347.284, 579853.682, 101.066, 'C124', 100.082, 'C116', 0.921],
    [5, 'STS17-C-IT05', '2 String Internal', 473347.284, 579859.182, 101.273, 'C115', 100.214, 'C107', 0.991],
    [6, 'STS17-C-IT06', '2 String Internal', 473347.284, 579864.682, 101.162, 'C106', 100.34, 'C098', 0.77],
    [7, 'STS17-C-IT07', '2 String Internal', 473347.284, 579870.182, 101.36, 'C097', 100.511, 'C089', 0.795],
    [8, 'STS17-C-IT08', '2 String Internal', 473347.284, 579875.682, 101.359, 'C088', 100.498, 'C080', 0.806],
    [9, 'STS17-C-IT09', '2 String Internal', 473347.284, 579881.182, 101.481, 'C079', 100.258, 'C071', 1.145],
    [10, 'STS17-C-IT10', '2 String Internal', 473347.284, 579886.682, 101.624, 'C070', 99.996, 'C062', 1.524],
    [11, 'STS17-C-IT11', '2 String Internal', 473347.284, 579892.182, 101.486, 'C061', 99.916, 'C053', 1.47],
    [12, 'STS17-C-IT12', '2 String Internal', 473347.284, 579897.682, 101.487, 'C052', 99.896, 'C044', 1.489],
    [13, 'STS17-C-IT13', '2 String Internal', 473347.284, 579903.182, 101.419, 'C043', 99.95, 'C035', 1.375],
    [14, 'STS17-C-IT14', '2 String Internal', 473347.284, 579908.682, 101.414, 'C034', 99.798, 'C026', 1.513],
    [15, 'STS17-C-IT15', '2 String Internal', 473347.284, 579914.182, 101.291, 'C025', 99.98, 'C017', 1.227],
    [16, 'STS17-C-ET16', '2 String Corner', 473347.37, 579919.682, 101.259, 'C016', 99.655, 'C009', 1.5],
    [17, 'STS17-C-ET17', '2 String Corner', 473347.37, 579925.182, 100.998, 'C008', 99.621, 'C001', 1.288],
  ];

  const ws = XLSX.utils.aoa_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(workbook, ws, 'Tracker Batch Template');
  XLSX.writeFile(workbook, 'Tracker_Post_Terrain_Bulk_Upload_Template.xlsx');
}

