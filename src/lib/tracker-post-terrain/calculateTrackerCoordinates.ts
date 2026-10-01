import {
  TrackerTerrainConfig,
  TRACKER_TERRAIN_CONFIGS,
} from './trackerConfigurations';

export interface TerrainPointCoordinate {
  pointIndex: number;
  label: string;
  physicalSegmentLengthMm: number | null; // Physical tracker segment length L_i in mm
  physicalSegmentLengthM: number | null;  // Physical tracker segment length L_i in m
  segmentLengthMm: number | null;         // Alias for physicalSegmentLengthMm
  segmentLengthM: number | null;          // Alias for physicalSegmentLengthM
  groundProjectionMm: number | null;      // Horizontal ground projection ΔY = L_i * cos(θ) in mm
  groundProjectionM: number | null;       // Horizontal ground projection ΔY in m
  cumGroundYMm: number;                   // Cumulative horizontal ground location Y in mm
  cumGroundYM: number;                    // Cumulative horizontal ground location Y in m
  cumLengthMm: number;                    // Cumulative physical sloped tracker length in mm
  cumLengthM: number;                     // Cumulative physical sloped tracker length in m
  xM: number;
  xMm: number;
  yM: number;                             // Cumulative horizontal ground location Y in m
  yMm: number;                            // Cumulative horizontal ground location Y in mm
  zM: number;                             // Elevation Z in m
  zMm: number;                            // Elevation Z in mm
  deltaYM: number | null;                 // ΔY in m
  deltaYMm: number | null;                // ΔY in mm
  deltaZM: number | null;                 // ΔZ in m
  deltaZMm: number | null;                // ΔZ in mm
}

export type DirectionType = 'UP SLOPE' | 'DOWN SLOPE' | 'LEVEL';

export interface TrackerTerrainCalculationInput {
  zoneName: string;
  trackerId: string; // Tracker ID (e.g. TRK-01)
  startX?: number;   // Starting X coordinate (default 0.000)
  E1: number;        // Starting elevation
  E2: number;        // Ending elevation
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
  startX_m: number;
  startX_mm: number;
  E1_m: number;
  E2_m: number;
  E1_mm: number;
  E2_mm: number;
  deltaElevation_m: number;
  deltaElevation_mm: number;
  absDeltaElevation_m: number;
  totalLengthMm: number;                 // Total physical tracker length in mm
  totalLengthM: number;                  // Total physical tracker length in m
  totalHorizontalProjectionM: number;    // Total horizontal ground projection footprint Y_total in m
  totalHorizontalProjectionMm: number;   // Total horizontal ground projection footprint Y_total in mm
  ratio: number;
  thetaRad: number;
  thetaDeg: number;
  sinTheta: number;
  cosTheta: number;
  tanTheta: number;
  direction: DirectionType;
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
    startX = 0,
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

  // Normalize elevations and coordinates to meters and millimeters internally
  const unitMultiplier = elevationUnit === 'mm' ? 0.001 : 1;
  const startX_m = startX * unitMultiplier;
  const startX_mm = startX_m * 1000;
  const E1_m = E1 * unitMultiplier;
  const E2_m = E2 * unitMultiplier;
  const E1_mm = E1_m * 1000;
  const E2_mm = E2_m * 1000;

  const deltaElevation_m = E2_m - E1_m;
  const deltaElevation_mm = E2_mm - E1_mm;
  const absDeltaElevation_m = Math.abs(deltaElevation_m);

  // Compute total physical tracker length (hypotenuse) dynamically from segment array in mm
  const totalLengthMm = config.segmentLengths.reduce((sum, len) => sum + len, 0);
  const totalLengthM = totalLengthMm / 1000;

  // Validate ratio for ASIN: sin(θ) = ΔE / L_total
  const ratio = deltaElevation_mm / totalLengthMm;

  // Check valid ratio range [-1, 1]
  const isValidRatio = !isNaN(ratio) && ratio >= -1 && ratio <= 1;

  const formattedDate = new Date().toISOString().slice(0, 10);

  if (!isValidRatio) {
    const errorMsg =
      'Invalid elevation difference for the selected tracker geometry. The E1/E2 difference is greater than the available total physical tracker length.';
    return {
      isValid: false,
      errorMessage: errorMsg,
      input,
      config,
      zoneName,
      trackerId: trackerId || 'TRK-01',
      docNo,
      locationGrid,
      startX_m,
      startX_mm,
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
          details: `ΔE = ${deltaElevation_m.toFixed(4)}m, Physical Tracker Length = ${totalLengthM.toFixed(4)}m, Ratio = ${ratio.toFixed(4)}`,
        },
      ],
      timestamp: new Date().toISOString(),
      inspectionDate: formattedDate,
    };
  }

  // Calculate inclination angle θ using ASIN (inclined tracker beam geometry)
  // sin(θ) = ΔE / L_total => θ = ASIN(ΔE / L_total)
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

  // Generate pile coordinates sequentially using 64-bit floating point math
  const points: TerrainPointCoordinate[] = [];

  // Starting Point P1
  points.push({
    pointIndex: 1,
    label: 'P1',
    physicalSegmentLengthMm: null,
    physicalSegmentLengthM: null,
    segmentLengthMm: null,
    segmentLengthM: null,
    groundProjectionMm: null,
    groundProjectionM: null,
    cumGroundYMm: 0,
    cumGroundYM: 0,
    cumLengthMm: 0,
    cumLengthM: 0,
    xM: startX_m,
    xMm: startX_mm,
    yM: 0,
    yMm: 0,
    zM: E1_m,
    zMm: E1_mm,
    deltaYM: null,
    deltaYMm: null,
    deltaZM: null,
    deltaZMm: null,
  });

  let currentPhysicalCumMm = 0;
  let currentPhysicalCumM = 0;
  let currentGroundYMm = 0;
  let currentGroundYM = 0;
  let currentZM = E1_m;
  let currentZMm = E1_mm;

  for (let i = 0; i < config.segmentLengths.length; i++) {
    const segMm = config.segmentLengths[i];
    const segM = segMm / 1000;

    // 90-Degree Horizontal projection: ΔY_i = L_i * cos(θ)
    const deltaYMm = segMm * cosTheta;
    const deltaYM = segM * cosTheta;

    // Vertical elevation change: ΔZ_i = L_i * sin(θ)
    const deltaZMm = segMm * sinTheta;
    const deltaZM = segM * sinTheta;

    currentPhysicalCumMm += segMm;
    currentPhysicalCumM += segM;

    currentGroundYMm += deltaYMm;
    currentGroundYM += deltaYM;

    currentZMm += deltaZMm;
    currentZM += deltaZM;

    points.push({
      pointIndex: i + 2,
      label: `P${i + 2}`,
      physicalSegmentLengthMm: segMm,
      physicalSegmentLengthM: segM,
      segmentLengthMm: segMm,
      segmentLengthM: segM,
      groundProjectionMm: deltaYMm,
      groundProjectionM: deltaYM,
      cumGroundYMm: currentGroundYMm,
      cumGroundYM: currentGroundYM,
      cumLengthMm: currentPhysicalCumMm,
      cumLengthM: currentPhysicalCumM,
      xM: startX_m,
      xMm: startX_mm,
      yM: currentGroundYM,
      yMm: currentGroundYMm,
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
  const totalHorizontalProjectionM = currentGroundYM;
  const totalHorizontalProjectionMm = currentGroundYMm;

  const endpointErrorM = Math.abs(calculatedFinalZM - E2_m);
  const endpointErrorMm = Math.abs(calculatedFinalZMm - E2_mm);

  // Endpoint QA check tolerance: <= 1 mm (0.001 m)
  const endpointValidationPass = endpointErrorMm <= 1.0;

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
      passed: Math.abs(currentPhysicalCumMm - totalLengthMm) < 0.01,
      message: `Total inclined physical length sum = ${totalLengthMm} mm (${totalLengthM.toFixed(3)} m)`,
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
