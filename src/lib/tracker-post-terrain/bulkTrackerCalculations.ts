import * as XLSX from 'xlsx';
import {
  calculateTrackerCoordinates,
  TrackerTerrainCalculationResult,
  YDirectionType,
} from './calculateTrackerCoordinates';
import { TRACKER_TERRAIN_CONFIGS } from './trackerConfigurations';

export interface BulkTrackerRowInput {
  rowNumber: number;
  no: number | string;
  trackerId: string;
  trackerTypeRaw: string;
  configId: string;
  northing: number; // Starting Y coordinate (Y1)
  easting: number;  // Starting X coordinate (X1)
  E1: number;       // Start Elevation
  pilePointStart?: string; // Starting pile post reference (e.g. C149)
  E2: number;       // End Elevation
  pileNumberEnd?: string;  // Ending pile post reference (e.g. C142)
  gradientDegrees?: number;
  rawRowData?: Record<string, any>;
}

export interface BulkTrackerItemResult {
  input: BulkTrackerRowInput;
  calcResult: TrackerTerrainCalculationResult | null;
  isValid: boolean;
  error?: string;
  pileLabels?: string[];
}

export interface BulkTrackerBatchResult {
  facilityTitle: string;
  clientName: string;
  epcContractors: string;
  structureZone: string;
  locationGrid: string;
  docNo: string;
  inspectionDate: string;
  yDirection: YDirectionType;
  items: BulkTrackerItemResult[];
  totalTrackers: number;
  validTrackers: number;
  totalPiles: number;
  totalLengthM: number;
}

/**
 * Resolves a raw tracker type string (e.g. "2 String Corner", "2 String Internal") to a known config ID.
 */
export function mapTrackerTypeToConfigId(rawType: string): string {
  if (!rawType) return '2S-CORNER';
  const clean = rawType.trim().toLowerCase();

  // Direct matches or key matches
  if (clean.includes('2') && (clean.includes('cor') || clean.includes('et') || clean.includes('corner'))) {
    return '2S-CORNER';
  }
  if (clean.includes('2') && (clean.includes('int') || clean.includes('it') || clean.includes('internal'))) {
    return '2S-INTERNAL';
  }
  if (clean.includes('3') && (clean.includes('cor') || clean.includes('et') || clean.includes('corner'))) {
    return '3S-CORNER';
  }
  if (clean.includes('3') && (clean.includes('int') || clean.includes('it') || clean.includes('internal'))) {
    return '3S-INTERNAL';
  }
  if (clean.includes('4') && (clean.includes('cor') || clean.includes('et') || clean.includes('corner'))) {
    return '4S-CORNER';
  }
  if (clean.includes('4') && (clean.includes('int') || clean.includes('it') || clean.includes('internal'))) {
    return '4S-INTERNAL';
  }

  // Exact uppercase config ID checks
  const upper = rawType.trim().toUpperCase();
  if (TRACKER_TERRAIN_CONFIGS[upper]) {
    return upper;
  }

  return '2S-CORNER';
}

/**
 * Interpolates or generates custom pile point names between start pile (e.g. C149) and end pile (e.g. C142)
 */
export function generateInterpolatedPileLabels(
  startLabel: string | undefined,
  endLabel: string | undefined,
  count: number
): string[] {
  if (!startLabel && !endLabel) {
    return Array.from({ length: count }, (_, i) => `P${i + 1}`);
  }

  // Check if both match letter prefix + number (e.g. C149 and C142)
  const regex = /^([a-zA-Z]+)(\d+)$/;
  const mStart = (startLabel || '').trim().match(regex);
  const mEnd = (endLabel || '').trim().match(regex);

  if (mStart && mEnd && mStart[1].toUpperCase() === mEnd[1].toUpperCase()) {
    const prefix = mStart[1].toUpperCase();
    const startNum = parseInt(mStart[2], 10);
    const endNum = parseInt(mEnd[2], 10);
    const padLen = mStart[2].length;

    // Check if step is strictly 1 decrement or increment across count
    if (Math.abs(startNum - endNum) === count - 1) {
      const step = startNum > endNum ? -1 : 1;
      return Array.from({ length: count }, (_, i) => {
        const num = startNum + i * step;
        const formatted = String(num).padStart(padLen, '0');
        return `${prefix}${formatted} (P${i + 1})`;
      });
    }
  }

  // Fallback
  return Array.from({ length: count }, (_, i) => {
    if (i === 0 && startLabel) return `${startLabel} (P1)`;
    if (i === count - 1 && endLabel) return `${endLabel} (P${count})`;
    return `P${i + 1}`;
  });
}

/**
 * Parses raw 2D array or worksheet data from uploaded Excel/CSV file into BulkTrackerRowInput[]
 */
export function parseBulkTrackerSheet(sheetData: any[][]): {
  metadata: {
    facilityTitle?: string;
    clientName?: string;
    epcContractors?: string;
    structureZone?: string;
    locationGrid?: string;
    docNo?: string;
    date?: string;
  };
  rows: BulkTrackerRowInput[];
  errors: string[];
} {
  const errors: string[] = [];
  const metadata: {
    facilityTitle?: string;
    clientName?: string;
    epcContractors?: string;
    structureZone?: string;
    locationGrid?: string;
    docNo?: string;
    date?: string;
  } = {};

  if (!sheetData || sheetData.length === 0) {
    return { metadata, rows: [], errors: ['Uploaded file contains no readable sheets or rows.'] };
  }

  // 1. Scan top rows (0 to 15) for metadata keys
  for (let r = 0; r < Math.min(sheetData.length, 15); r++) {
    const row = sheetData[r] || [];
    const rowStr = row.map((c) => String(c || '').trim()).join(' ');

    if (rowStr.toLowerCase().includes('solar park') || rowStr.toLowerCase().includes('siyambalanduwa')) {
      metadata.facilityTitle = String(row[0] || '').trim();
    }
    if (rowStr.toLowerCase().includes('client:')) {
      // Find value
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim();
        if (val.toLowerCase().includes('client:') && row[c + 1]) {
          metadata.clientName = String(row[c + 1]).trim();
        }
        if (val.toLowerCase().includes('doc. no:') || val.toLowerCase().includes('doc no:')) {
          metadata.docNo = String(row[c + 1] || '').trim();
        }
      }
    }
    if (rowStr.toLowerCase().includes('structure :') || rowStr.toLowerCase().includes('structure:')) {
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').trim();
        if (val.toLowerCase().includes('structure') && row[c + 1]) {
          metadata.structureZone = String(row[c + 1]).trim();
        }
        if (val.toLowerCase().includes('location') || val.toLowerCase().includes('grid')) {
          metadata.locationGrid = String(row[c + 1] || '').trim();
        }
      }
    }
  }

  // 2. Locate the Table Header row
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(sheetData.length, 25); r++) {
    const row = sheetData[r] || [];
    const rowJoined = row.map((c) => String(c || '').toLowerCase().trim()).join('|');
    if (
      (rowJoined.includes('tracker id') || rowJoined.includes('tracker_id')) &&
      (rowJoined.includes('northing') || rowJoined.includes('easting') || rowJoined.includes('e1') || rowJoined.includes('elevation'))
    ) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fallback: look for row with "tracker" and "elevation"
    for (let r = 0; r < Math.min(sheetData.length, 25); r++) {
      const row = sheetData[r] || [];
      const rowJoined = row.map((c) => String(c || '').toLowerCase().trim()).join('|');
      if (rowJoined.includes('tracker') && (rowJoined.includes('e1') || rowJoined.includes('elevation'))) {
        headerRowIndex = r;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    return {
      metadata,
      rows: [],
      errors: [
        'Could not locate the Tracker Table Header row. Please ensure columns include: Tracker ID, Tracker Type, Northing, Easting, E1 (or Elevation), E2.',
      ],
    };
  }

  const headerRow = (sheetData[headerRowIndex] || []).map((c) => String(c || '').trim());

  // 3. Map Header Columns
  let colNo = -1;
  let colTrackerId = -1;
  let colTrackerType = -1;
  let colNorthing = -1;
  let colEasting = -1;
  let colE1 = -1;
  let colPilePoint = -1;
  let colE2 = -1;
  let colPileNumber = -1;
  let colGradient = -1;

  const elevationColIndices: number[] = [];

  headerRow.forEach((col, idx) => {
    const norm = col.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (norm === 'no' || norm === 'num' || norm === 'srno' || norm === 'item') {
      if (colNo === -1) colNo = idx;
    } else if (norm.includes('trackerid') || norm === 'tracker' || (norm.includes('tracker') && norm.includes('id'))) {
      if (colTrackerId === -1) colTrackerId = idx;
    } else if (norm.includes('trackertype') || (norm.includes('tracker') && norm.includes('type')) || norm === 'type') {
      if (colTrackerType === -1) colTrackerType = idx;
    } else if (norm.includes('north')) {
      if (colNorthing === -1) colNorthing = idx;
    } else if (norm.includes('east')) {
      if (colEasting === -1) colEasting = idx;
    } else if (norm === 'e1' || norm.startsWith('e1') || norm.endsWith('e1') || norm.includes('startelev') || norm.includes('elev1')) {
      colE1 = idx;
    } else if (norm === 'e2' || norm.startsWith('e2') || norm.endsWith('e2') || norm.includes('endelev') || norm.includes('elev2')) {
      colE2 = idx;
    } else if (norm.includes('elevation') || norm.includes('elev')) {
      elevationColIndices.push(idx);
    } else if (norm.includes('pilepoint') || (norm.includes('pile') && norm.includes('point'))) {
      colPilePoint = idx;
    } else if (norm.includes('pilenumber') || (norm.includes('pile') && norm.includes('number')) || norm.includes('pileend')) {
      colPileNumber = idx;
    } else if (norm.includes('gradient') || norm.includes('degree') || norm.includes('angle') || norm.includes('slope')) {
      colGradient = idx;
    }
  });

  // If E1 or E2 were not explicitly named "E1"/"E2", use elevationColIndices
  if (colE1 === -1 && elevationColIndices.length > 0) {
    colE1 = elevationColIndices[0];
  }
  if (colE2 === -1) {
    const remainingElev = elevationColIndices.filter((i) => i !== colE1);
    if (remainingElev.length > 0) {
      colE2 = remainingElev[0];
    }
  }

  // Validate essential column mappings
  if (colTrackerId === -1) {
    return {
      metadata,
      rows: [],
      errors: ['Column "Tracker ID" was not found in the header row.'],
    };
  }
  if (colE1 === -1 || colE2 === -1) {
    return {
      metadata,
      rows: [],
      errors: ['Could not detect both E1 and E2 elevation columns in the header row.'],
    };
  }

  // 4. Parse Data Rows
  const parsedRows: BulkTrackerRowInput[] = [];

  for (let r = headerRowIndex + 1; r < sheetData.length; r++) {
    const row = sheetData[r] || [];
    // Stop if row is completely empty or reaches "NOTE", "Checked by", etc.
    const firstCell = String(row[0] || '').trim().toLowerCase();
    const trackerIdRaw = String(row[colTrackerId] || '').trim();

    if (
      firstCell.startsWith('note') ||
      firstCell.startsWith('checked by') ||
      firstCell.startsWith('approved by') ||
      firstCell.startsWith('client:')
    ) {
      break;
    }

    if (!trackerIdRaw) {
      continue;
    }

    const noVal = colNo >= 0 && row[colNo] !== undefined ? row[colNo] : parsedRows.length + 1;
    const trackerTypeRaw = colTrackerType >= 0 ? String(row[colTrackerType] || '').trim() : '2 String Corner';
    const northingRaw = colNorthing >= 0 ? parseFloat(String(row[colNorthing]).replace(/,/g, '')) : 0;
    const eastingRaw = colEasting >= 0 ? parseFloat(String(row[colEasting]).replace(/,/g, '')) : 0;
    const e1Raw = parseFloat(String(row[colE1]).replace(/,/g, ''));
    const e2Raw = parseFloat(String(row[colE2]).replace(/,/g, ''));
    const pilePointRaw = colPilePoint >= 0 ? String(row[colPilePoint] || '').trim() : undefined;
    const pileNumberRaw = colPileNumber >= 0 ? String(row[colPileNumber] || '').trim() : undefined;
    const gradRaw = colGradient >= 0 ? parseFloat(String(row[colGradient]).replace(/,/g, '')) : undefined;

    const configId = mapTrackerTypeToConfigId(trackerTypeRaw);

    parsedRows.push({
      rowNumber: r + 1,
      no: noVal,
      trackerId: trackerIdRaw,
      trackerTypeRaw,
      configId,
      northing: isNaN(northingRaw) ? 0 : northingRaw,
      easting: isNaN(eastingRaw) ? 0 : eastingRaw,
      E1: isNaN(e1Raw) ? 0 : e1Raw,
      pilePointStart: pilePointRaw,
      E2: isNaN(e2Raw) ? 0 : e2Raw,
      pileNumberEnd: pileNumberRaw,
      gradientDegrees: isNaN(gradRaw as number) ? undefined : gradRaw,
    });
  }

  return { metadata, rows: parsedRows, errors };
}

/**
 * Runs bulk calculation for all parsed tracker rows
 */
export function processBulkTrackers(
  rows: BulkTrackerRowInput[],
  options: {
    zoneName?: string;
    docNo?: string;
    locationGrid?: string;
    yDirection?: YDirectionType;
    elevationUnit?: 'm' | 'mm';
    facilityTitle?: string;
    clientName?: string;
    epcContractors?: string;
  }
): BulkTrackerBatchResult {
  const {
    zoneName = 'Tracker Mounting Structure',
    docNo = 'DOC-TRK-001',
    locationGrid = 'Grid A-1',
    yDirection = 'DECREASING (-)',
    elevationUnit = 'm',
    facilityTitle = '100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.',
    clientName = 'Rividhanavi (Private) Limited',
    epcContractors = 'Windforce PLC & Lakdhanavi Limited',
  } = options;

  let validCount = 0;
  let totalPilesSum = 0;
  let totalLengthSum = 0;

  const items: BulkTrackerItemResult[] = rows.map((row) => {
    try {
      const calcResult = calculateTrackerCoordinates({
        zoneName,
        trackerId: row.trackerId,
        startX: row.easting,  // Easting = X
        startY: row.northing, // Northing = Y
        yDirection,
        E1: row.E1,
        E2: row.E2,
        configId: row.configId,
        elevationUnit,
        docNo,
        locationGrid,
      });

      if (calcResult.isValid) {
        validCount++;
        totalPilesSum += calcResult.points.length;
        totalLengthSum += calcResult.totalLengthM;

        // Generate customized pile labels if pilePointStart/End are provided
        const customLabels = generateInterpolatedPileLabels(
          row.pilePointStart,
          row.pileNumberEnd,
          calcResult.points.length
        );

        return {
          input: row,
          calcResult,
          isValid: true,
          pileLabels: customLabels,
        };
      } else {
        return {
          input: row,
          calcResult: null,
          isValid: false,
          error: calcResult.errorMessage || 'Invalid geometry calculation',
        };
      }
    } catch (err: any) {
      return {
        input: row,
        calcResult: null,
        isValid: false,
        error: err.message || 'Calculation error',
      };
    }
  });

  return {
    facilityTitle,
    clientName,
    epcContractors,
    structureZone: zoneName,
    locationGrid,
    docNo,
    inspectionDate: new Date().toISOString().slice(0, 10),
    yDirection,
    items,
    totalTrackers: rows.length,
    validTrackers: validCount,
    totalPiles: totalPilesSum,
    totalLengthM: totalLengthSum,
  };
}

/**
 * Built-in Sample Dataset provided directly by the user for instant 1-click preview
 */
export const SAMPLE_USER_BULK_CSV = `"100 MW SOLAR PARK FACILITY, SIYAMBALANDUWA, SRI LANKA.",,,,,,,,,,
TRACKER - GRADIENT CHECKLIST,,,,,,,,,,
CLIENT:,,,,,,,,,,Doc. No:
Rividhanavi (Private) Limited,,,,,,,,,,DOC-TRK-Z6-01
EPC CONTRACTORS:,,,,,,,,,,Sheet No:
Windforce PLC & Lakdhanavi Limited,,,,,,,,,,01 of 17
,,,,,,,,,,
,,,,,,,,,,
Structure : Tracker Mounting Structure,,,,,,Location/ Grid : Z6 ,,,,
TRACKER TABLE : C,,,,,,Date : 2026-10-30,,,,
No.,,Tracker ID,Tracker Type ,Northing,Easting,E1,Pile Point,E2,Pile Number,Gradient( Degrees)
1,,STS17-C-ET01,2 String Corner,473347.37,579837.182,100.49,C149,99.742,C142,0.7
2,,STS17-C-ET02,2 String Corner,473347.37,579842.682,100.727,C141,99.81,C134,0.858
3,,STS17-C-IT03,2 String Internal,473347.284,579848.182,100.854,C133,99.926,C125,0.869
4,,STS17-C-IT04,2 String Internal,473347.284,579853.682,101.066,C124,100.082,C116,0.921
5,,STS17-C-IT05,2 String Internal,473347.284,579859.182,101.273,C115,100.214,C107,0.991
6,,STS17-C-IT06,2 String Internal,473347.284,579864.682,101.162,C106,100.34,C098,0.77
7,,STS17-C-IT07,2 String Internal,473347.284,579870.182,101.36,C097,100.511,C089,0.795
8,,STS17-C-IT08,2 String Internal,473347.284,579875.682,101.359,C088,100.498,C080,0.806
9,,STS17-C-IT09,2 String Internal,473347.284,579881.182,101.481,C079,100.258,C071,1.145
10,,STS17-C-IT10,2 String Internal,473347.284,579886.682,101.624,C070,99.996,C062,1.524
11,,STS17-C-IT11,2 String Internal,473347.284,579892.182,101.486,C061,99.916,C053,1.47
12,,STS17-C-IT12,2 String Internal,473347.284,579897.682,101.487,C052,99.896,C044,1.489
13,,STS17-C-IT13,2 String Internal,473347.284,579903.182,101.419,C043,99.95,C035,1.375
14,,STS17-C-IT14,2 String Internal,473347.284,579908.682,101.414,C034,99.798,C026,1.513
15,,STS17-C-IT15,2 String Internal,473347.284,579914.182,101.291,C025,99.98,C017,1.227
16,,STS17-C-ET16,2 String Corner,473347.37,579919.682,101.259,C016,99.655,C009,1.5
17,,STS17-C-ET17,2 String Corner,473347.37,579925.182,100.998,C008,99.621,C001,1.288
`;

