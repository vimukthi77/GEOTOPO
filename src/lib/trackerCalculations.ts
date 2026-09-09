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
  results: PilePointResult[];
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
    results
  };
}

/**
 * Downloads current calculation results as a properly formatted CSV.
 */
export function downloadTrackerCSV(data: TrackerCalculationOutput): void {
  const rows: (string | number)[][] = [];

  rows.push(["Tracker Type", data.trackerType]);
  rows.push(["Configuration", data.configurationName]);
  rows.push(["E1 Elevation", data.E1.toFixed(3)]);
  rows.push(["E2 Elevation", data.E2.toFixed(3)]);
  rows.push(["Elevation Difference", data.elevationDifference.toFixed(3)]);
  rows.push(["Direction", data.direction]);
  rows.push([`Overall ${data.axis}`, data.overallDistance.toFixed(3)]);
  rows.push(["Tan", data.tan.toFixed(6)]);
  rows.push(["Number of Pile Points", data.pilePoints]);
  rows.push(["Number of Calculated Values", data.numberOfValues]);

  rows.push([]);

  rows.push([
    "Point",
    "Distance",
    "Result",
    "Final Elevation"
  ]);

  data.results.forEach(item => {
    rows.push([
      item.point,
      item.distance.toFixed(3),
      item.result.toFixed(3),
      item.elevation.toFixed(3)
    ]);
  });

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
  link.download = `tracker_${cleanType}_${data.pilePoints}Piles_${dateStr}.csv`;

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
