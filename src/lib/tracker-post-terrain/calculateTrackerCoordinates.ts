import {
  TrackerTerrainConfig,
  TRACKER_TERRAIN_CONFIGS,
} from './trackerConfigurations';

export interface TerrainPointCoordinate {
  pointIndex: number;
  label: string;
  segmentLengthMm: number | null;
  segmentLengthM: number | null;
  cumLengthMm: number;
  cumLengthM: number;
  xM: number;
  xMm: number;
  yM: number;
  yMm: number;
  zM: number;
  zMm: number;
  deltaYM: number | null;
  deltaYMm: number | null;
  deltaZM: number | null;
  deltaZMm: number | null;
}

export type DirectionType = 'UP SLOPE' | 'DOWN SLOPE' | 'LEVEL';

export interface TrackerTerrainCalculationInput {
  zoneName: string;
  trackerId: string; // NEW: Tracker ID (e.g. TRK-01)
  E1: number; // Starting elevation (m by default)
  E2: number; // Ending elevation (m by default)
  configId: string;
  elevationUnit?: 'm' | 'mm';
  docNo?: string;
  locationGrid?: string;
}

export interface TrackerTerrainValidationCheck {
  id: string;
  name: string;
  passed: boolean;
  message: string;
  details?: string;
}

export interface TrackerTerrainCalculationResult {
  isValid: boolean;
  errorMessage?: string;
  input: TrackerTerrainCalculationInput;
  config: TrackerTerrainConfig;
  zoneName: string;
  trackerId: string;
  docNo: string;
  locationGrid: string;
  E1_m: number;
  E2_m: number;
  E1_mm: number;
  E2_mm: number;
  deltaElevation_m: number;
  deltaElevation_mm: number;
  absDeltaElevation_m: number;
  totalLengthMm: number;
  totalLengthM: number;
  ratio: number;
  thetaRad: number;
  thetaDeg: number;
  sinTheta: number;
  cosTheta: number;
  tanTheta: number;
  direction: DirectionType;
  totalHorizontalProjectionM: number;
  totalHorizontalProjectionMm: number;
  calculatedFinalZM: number;
  calculatedFinalZMm: number;
  endpointErrorM: number;
  endpointErrorMm: number;
  endpointValidationPass: boolean;
  points: TerrainPointCoordinate[];
  validations: TrackerTerrainValidationCheck[];
  timestamp: string;
  inspectionDate: string;
}

export function calculateTrackerCoordinates(
  input: TrackerTerrainCalculationInput
): TrackerTerrainCalculationResult {
  const {
    zoneName,
    trackerId,
    E1,
    E2,
    configId,
    elevationUnit = 'm',
    docNo = 'DOC-TRK-001',
    locationGrid = 'Grid A-1',
  } = input;

  const config = TRACKER_TERRAIN_CONFIGS[configId];
  if (!config) {
    throw new Error(`Invalid tracker configuration ID: ${configId}`);
  }

  // Normalize elevations to meters and millimeters
  const unitMultiplier = elevationUnit === 'mm' ? 0.001 : 1;
  const E1_m = E1 * unitMultiplier;
  const E2_m = E2 * unitMultiplier;
  const E1_mm = E1_m * 1000;
  const E2_mm = E2_m * 1000;

  const deltaElevation_m = E2_m - E1_m;
  const deltaElevation_mm = E2_mm - E1_mm;
  const absDeltaElevation_m = Math.abs(deltaElevation_m);

  const totalLengthMm = config.totalLengthMm;
  const totalLengthM = config.totalLengthM;

  // Validate ratio for ASIN: ratio = deltaE / totalLength
  const ratio = deltaElevation_m / totalLengthM;

  // Check valid ratio range [-1, 1]
  const isValidRatio = !isNaN(ratio) && ratio >= -1 && ratio <= 1;

  const formattedDate = new Date().toISOString().slice(0, 10);

  if (!isValidRatio) {
    const errorMsg =
      'Invalid elevation difference for the selected tracker geometry. The E1/E2 difference is greater than the available tracker length.';
    return {
      isValid: false,
      errorMessage: errorMsg,
      input,
      config,
      zoneName,
      trackerId: trackerId || 'TRK-01',
      docNo,
      locationGrid,
      E1_m,
      E2_m,
      E1_mm,
      E2_mm,
      deltaElevation_m,
      deltaElevation_mm,
      absDeltaElevation_m,
      totalLengthMm,
      totalLengthM,
      ratio,
      thetaRad: NaN,
      thetaDeg: NaN,
      sinTheta: NaN,
      cosTheta: NaN,
      tanTheta: NaN,
      direction: 'LEVEL',
      totalHorizontalProjectionM: 0,
      totalHorizontalProjectionMm: 0,
      calculatedFinalZM: 0,
      calculatedFinalZMm: 0,
      endpointErrorM: NaN,
      endpointErrorMm: NaN,
      endpointValidationPass: false,
      points: [],
      validations: [
        {
          id: 'config',
          name: 'Configuration Check',
          passed: true,
          message: `Valid configuration: ${config.name}`,
        },
        {
          id: 'ratio',
          name: 'Elevation Difference vs Length Check',
          passed: false,
          message: errorMsg,
          details: `ΔE = ${deltaElevation_m.toFixed(4)}m, Tracker Length = ${totalLengthM.toFixed(4)}m, Ratio = ${ratio.toFixed(4)}`,
        },
      ],
      timestamp: new Date().toISOString(),
      inspectionDate: formattedDate,
    };
  }

  // Calculate inclination angle θ using ASIN (inclined tracker beam geometry)
  const thetaRad = Math.asin(ratio);
  const thetaDeg = (thetaRad * 180) / Math.PI;
  const sinTheta = Math.sin(thetaRad);
  const cosTheta = Math.cos(thetaRad);
  const tanTheta = Math.tan(thetaRad);

  // Slope direction
  let direction: DirectionType = 'LEVEL';
  if (deltaElevation_m > 0) {
    direction = 'UP SLOPE';
  } else if (deltaElevation_m < 0) {
    direction = 'DOWN SLOPE';
  }

  // Generate pile coordinates sequentially using full double-precision floating point math
  const points: TerrainPointCoordinate[] = [];

  // Starting Point P1
  points.push({
    pointIndex: 1,
    label: 'P1',
    segmentLengthMm: null,
    segmentLengthM: null,
    cumLengthMm: 0,
    cumLengthM: 0,
    xM: 0,
    xMm: 0,
    yM: 0,
    yMm: 0,
    zM: E1_m,
    zMm: E1_mm,
    deltaYM: null,
    deltaYMm: null,
    deltaZM: null,
    deltaZMm: null,
  });

  let currentCumMm = 0;
  let currentCumM = 0;
  let currentYM = 0;
  let currentYMm = 0;
  let currentZM = E1_m;
  let currentZMm = E1_mm;

  for (let i = 0; i < config.segmentLengths.length; i++) {
    const segMm = config.segmentLengths[i];
    const segM = segMm / 1000;

    const deltaYMm = segMm * cosTheta;
    const deltaYM = segM * cosTheta;

    const deltaZMm = segMm * sinTheta;
    const deltaZM = segM * sinTheta;

    currentCumMm += segMm;
    currentCumM += segM;

    currentYMm += deltaYMm;
    currentYM += deltaYM;

    currentZMm += deltaZMm;
    currentZM += deltaZM;

    points.push({
      pointIndex: i + 2,
      label: `P${i + 2}`,
      segmentLengthMm: segMm,
      segmentLengthM: segM,
      cumLengthMm: currentCumMm,
      cumLengthM: currentCumM,
      xM: 0,
      xMm: 0,
      yM: currentYM,
      yMm: currentYMm,
      zM: currentZM,
      zMm: currentZMm,
      deltaYM: deltaYM,
      deltaYMm: deltaYMm,
      deltaZM: deltaZM,
      deltaZMm: deltaZMm,
    });
  }

  const calculatedFinalZM = currentZM;
  const calculatedFinalZMm = currentZMm;
  const totalHorizontalProjectionM = currentYM;
  const totalHorizontalProjectionMm = currentYMm;

  const endpointErrorM = Math.abs(calculatedFinalZM - E2_m);
  const endpointErrorMm = Math.abs(calculatedFinalZMm - E2_mm);

  // Endpoint QA check tolerance: <= 0.001 m (1 mm)
  const endpointValidationPass = endpointErrorM <= 0.001;

  // QA Validations list
  const validations: TrackerTerrainValidationCheck[] = [
    {
      id: 'config',
      name: 'Configuration Valid',
      passed: true,
      message: `Selected ${config.name} (${config.pileCount} Piles, ${config.segmentCount} Segments)`,
    },
    {
      id: 'segments',
      name: 'Segment Count Valid',
      passed: points.length === config.pileCount,
      message: `Calculated ${points.length} pile points matching target ${config.pileCount} piles.`,
    },
    {
      id: 'input',
      name: 'Elevation Input Valid',
      passed: !isNaN(E1_m) && !isNaN(E2_m),
      message: `E1: ${E1_m.toFixed(3)} m, E2: ${E2_m.toFixed(3)} m (ΔE: ${deltaElevation_m >= 0 ? '+' : ''}${deltaElevation_m.toFixed(3)} m)`,
    },
    {
      id: 'angle',
      name: 'Angle Calculation Valid',
      passed: !isNaN(thetaDeg),
      message: `θ = ${thetaDeg.toFixed(6)}° (${direction})`,
      details: `sin(θ) = ${sinTheta.toFixed(8)}, cos(θ) = ${cosTheta.toFixed(8)}`,
    },
    {
      id: 'coordinates',
      name: 'Coordinate Generation Complete',
      passed: points.length === config.pileCount,
      message: `Successfully computed 3D (X, Y, Z) coordinates for all ${points.length} pile locations.`,
    },
    {
      id: 'endpoint',
      name: 'Endpoint Elevation Check',
      passed: endpointValidationPass,
      message: endpointValidationPass
        ? `PASS: Final calculated Z (${calculatedFinalZM.toFixed(4)} m) matches E2 (${E2_m.toFixed(4)} m) within tolerance.`
        : `CHECK: Endpoint discrepancy of ${endpointErrorM.toFixed(4)} m between calculated Z and E2.`,
      details: `Expected E2 = ${E2_m.toFixed(6)} m | Calculated Z = ${calculatedFinalZM.toFixed(6)} m | Error = ${endpointErrorM.toFixed(6)} m`,
    },
    {
      id: 'length',
      name: 'Total Length Check',
      passed: Math.abs(currentCumMm - totalLengthMm) < 0.01,
      message: `Total inclined length sum = ${totalLengthMm} mm (${totalLengthM.toFixed(3)} m)`,
    },
  ];

  return {
    isValid: true,
    input,
    config,
    zoneName: zoneName || 'Default Zone',
    trackerId: trackerId || 'TRK-01',
    docNo: docNo || 'DOC-TRK-001',
    locationGrid: locationGrid || 'Grid A-1',
    E1_m,
    E2_m,
    E1_mm,
    E2_mm,
    deltaElevation_m,
    deltaElevation_mm,
    absDeltaElevation_m,
    totalLengthMm,
    totalLengthM,
    ratio,
    thetaRad,
    thetaDeg,
    sinTheta,
    cosTheta,
    tanTheta,
    direction,
    totalHorizontalProjectionM,
    totalHorizontalProjectionMm,
    calculatedFinalZM,
    calculatedFinalZMm,
    endpointErrorM,
    endpointErrorMm,
    endpointValidationPass,
    points,
    validations,
    timestamp: new Date().toLocaleString(),
    inspectionDate: formattedDate,
  };
}
